/**
 * API utility functions for communicating with the Flask backend
 */
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// API configuration
const CONFIG = {
  // Set this to false to use the real Flask backend
  USE_MOCK_DATA: false,
  
  // Timeout for API requests in milliseconds (30 seconds)
  API_TIMEOUT: 30000,
  
  // API endpoints
  ENDPOINTS: {
    // Local development endpoint
    // For Android Emulator, use 10.0.2.2 instead of localhost
    // For iOS Simulator, use localhost
    // For physical devices, use your computer's IP address on the local network
    PREDICT: Platform.OS === 'android' 
      ? 'http://10.0.2.2:5000/predict'  // Android emulator special IP
      : 'http://localhost:5000/predict', // iOS or web
  }
};

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
const generateMockResult = (): { prediction: string; confidence: number } => {
  console.log('Generating mock result');
  // Randomly determine if the voice is genuine or fake
  const isFake = Math.random() > 0.5;
  
  // Generate a random confidence level between 0.7 and 0.95
  const confidence = 0.7 + Math.random() * 0.25;
  
  return { 
    prediction: isFake ? "Fake" : "Genuine",
    confidence: confidence
  };
};

/**
 * Analyzes audio file using the Flask backend
 * @param fileUri Local URI of the audio file to analyze
 * @returns Promise with the analysis result
 */
export const analyzeAudio = async (fileUri: string): Promise<{ 
  isAI: boolean; 
  confidence: number; 
  message: string;
  rawPrediction?: string;
}> => {
  console.log(`analyzeAudio called with URI: ${fileUri}`);
  
  try {
    // Check if file exists
    console.log('Checking if file exists...');
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
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
      
      const mockResult = generateMockResult();
      return {
        isAI: mockResult.prediction === "Fake",
        confidence: mockResult.confidence,
        message: `This voice appears to be ${mockResult.prediction.toLowerCase()}. ${
          mockResult.prediction === "Fake" 
            ? "The analysis detected patterns consistent with synthetic speech." 
            : "No synthetic patterns were detected."
        }`,
        rawPrediction: mockResult.prediction
      };
    }
    
    // Get file extension from URI
    const fileExtension = fileUri.split('.').pop()?.toLowerCase() || '';
    console.log(`File extension: ${fileExtension}`);
    
    // Check if file type is supported
    if (!['wav', 'flac'].includes(fileExtension)) {
      throw new Error('Unsupported file type. Only .wav and .flac files are supported.');
    }
    
    // Determine MIME type based on file extension
    const mimeType = fileExtension === 'flac' ? 'audio/flac' : 'audio/wav';
    
    console.log(`Sending request to API: ${CONFIG.ENDPOINTS.PREDICT}`);
    
    // Create form data for file upload
    const formData = new FormData();
    
    // Get file name from URI
    const fileName = fileUri.split('/').pop() || `recording.${fileExtension}`;
    console.log(`File name: ${fileName}`);
    
    // Append file to form data
    formData.append('audio', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);
    
    console.log('Form data created, sending request...');
    
    // Race between fetch request and timeout
    const fetchPromise = fetch(CONFIG.ENDPOINTS.PREDICT, {
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
    
    // Parse response
    console.log('Parsing response...');
    const result = await response.json();
    console.log('Analysis complete, result:', result);
    
    // Expected response format from Flask: { prediction: "Genuine" | "Fake", confidence: number }
    // Convert to our app's format
    const prediction = result.prediction || "Unknown";
    const confidence = result.confidence || 0.5;
    
    return {
      isAI: prediction === "Fake",
      confidence: confidence,
      message: `This voice appears to be ${prediction.toLowerCase()}. ${
        prediction === "Fake" 
          ? "The analysis detected patterns consistent with synthetic speech." 
          : "No synthetic patterns were detected."
      }`,
      rawPrediction: prediction
    };
  } catch (error) {
    console.error('Error analyzing audio:', error);
    throw error;
  }
};