/**
 * API utility functions for communicating with the Flask backend
 */
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// API configuration
const CONFIG = {
  // Set this to true to use mock data during development
  USE_MOCK_DATA: true,
  
  // Timeout for API requests in milliseconds (15 seconds - increased from default)
  API_TIMEOUT: 15000,
  
  // API endpoints
  ENDPOINTS: {
    // Production endpoint (replace with your actual deployed API)
    PRODUCTION: 'https://your-flask-api.onrender.com/analyze',
    
    // Local development endpoint
    DEVELOPMENT: Platform.OS === 'android' 
      ? 'http://10.0.2.2:5000/analyze'  // Android emulator special IP
      : 'http://localhost:5000/analyze', // iOS or web
  }
};

// Select the appropriate API URL based on environment
const API_URL = __DEV__ ? CONFIG.ENDPOINTS.DEVELOPMENT : CONFIG.ENDPOINTS.PRODUCTION;

/**
 * Creates a promise that rejects after a specified timeout
 * @param ms Timeout in milliseconds
 * @param operationName Name of the operation for better error messages
 * @returns Promise that rejects after timeout
 */
const createTimeoutPromise = (ms: number, operationName: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${ms}ms`));
    }, ms);
  });
};

/**
 * Generates mock analysis result for testing
 * @returns Mock analysis result
 */
const generateMockResult = (): { isAI: boolean; confidence: number; message: string } => {
  console.log('Generating mock result');
  // Randomly determine if the voice is AI or human
  const isAI = Math.random() > 0.5;
  
  // Generate a random confidence level between 0.7 and 0.95
  const confidence = 0.7 + Math.random() * 0.25;
  
  // Create appropriate message based on result
  const message = isAI
    ? "This voice appears to be AI-generated. The analysis detected patterns consistent with synthetic speech."
    : "This voice appears to be from a genuine human. No synthetic patterns were detected.";
  
  return { isAI, confidence, message };
};

/**
 * Uploads audio file to the Flask backend for analysis
 * @param fileUri Local URI of the audio file to upload
 * @returns Promise with the analysis result
 */
export const analyzeAudio = async (fileUri: string): Promise<{ isAI: boolean; confidence: number; message: string }> => {
  console.log(`analyzeAudio called with URI: ${fileUri}`);
  
  try {
    // Check if file exists with timeout
    console.log('Checking if file exists...');
    const fileInfoPromise = FileSystem.getInfoAsync(fileUri);
    const fileInfo = await Promise.race([
      fileInfoPromise,
      createTimeoutPromise(5000, 'File info check')
    ]);
    
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    console.log('File exists, size:', fileInfo.size);
    
    // Use mock data for testing if flag is set
    if (CONFIG.USE_MOCK_DATA) {
      console.log('Using mock data for API response');
      // Simulate network delay (0.5-1.5 seconds)
      const delay = 500 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return generateMockResult();
    }
    
    console.log(`Sending request to API: ${API_URL}`);
    
    // Create form data for file upload
    const formData = new FormData();
    
    // Get file name from URI
    const fileName = fileUri.split('/').pop() || 'recording.wav';
    console.log(`File name: ${fileName}`);
    
    // Append file to form data
    formData.append('audio', {
      uri: fileUri,
      name: fileName,
      type: 'audio/wav',
    } as any);
    
    console.log('Form data created, sending request...');
    
    // Race between fetch request and timeout
    const fetchPromise = fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const response = await Promise.race([
      fetchPromise,
      createTimeoutPromise(CONFIG.API_TIMEOUT, 'API request')
    ]);
    
    console.log('Response received, status:', response.status);
    
    // Check if request was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }
    
    // Parse and return response
    console.log('Parsing response...');
    const jsonPromise = response.json();
    const result = await Promise.race([
      jsonPromise,
      createTimeoutPromise(5000, 'JSON parsing')
    ]);
    
    console.log('Analysis complete, result:', result);
    return result;
  } catch (error) {
    console.error('Error analyzing audio:', error);
    // Return a fallback result in case of error
    if (CONFIG.USE_MOCK_DATA) {
      console.log('Returning fallback mock result due to error');
      return {
        isAI: false,
        confidence: 0.75,
        message: "Analysis encountered an error. This is a fallback result."
      };
    }
    throw error;
  }
};