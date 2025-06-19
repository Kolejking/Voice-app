/**
 * API utility functions for communicating with the Flask backend
 */
import * as FileSystem from 'expo-file-system';

// Replace with your actual Flask backend URL when ready for production
const API_URL = 'https://your-flask-api.onrender.com/analyze';

// Flag to use mock data for testing (set to false when backend is ready)
const USE_MOCK_DATA = true;

// Timeout for API requests in milliseconds (5 seconds)
const API_TIMEOUT = 5000;

/**
 * Creates a promise that rejects after a specified timeout
 * @param ms Timeout in milliseconds
 * @returns Promise that rejects after timeout
 */
const createTimeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
};

/**
 * Generates mock analysis result for testing
 * @returns Mock analysis result
 */
const generateMockResult = (): { isAI: boolean; confidence: number; message: string } => {
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
  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    // Use mock data for testing if flag is set
    if (USE_MOCK_DATA) {
      // Simulate network delay (0.5-1.5 seconds)
      const delay = 500 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return generateMockResult();
    }
    
    // Create form data for file upload
    const formData = new FormData();
    
    // Get file name from URI
    const fileName = fileUri.split('/').pop() || 'recording.wav';
    
    // Append file to form data
    formData.append('audio', {
      uri: fileUri,
      name: fileName,
      type: 'audio/wav',
    } as any);
    
    // Race between fetch request and timeout
    const response = await Promise.race([
      fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      }),
      createTimeoutPromise(API_TIMEOUT)
    ]);
    
    // Check if request was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }
    
    // Parse and return response
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing audio:', error);
    throw error;
  }
};