/**
 * API utility functions for communicating with the Flask backend
 */
import * as FileSystem from 'expo-file-system';

// Replace with your actual Flask backend URL
const API_URL = 'https://your-flask-api.onrender.com/analyze';

/**
 * Uploads audio file to the Flask backend for analysis
 * @param fileUri Local URI of the audio file to upload
 * @returns Promise with the analysis result
 */
export const analyzeAudio = async (fileUri: string): Promise<{ isAI: boolean; confidence: number; message: string }> => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    // Get file name from URI
    const fileName = fileUri.split('/').pop() || 'recording.wav';
    
    // Append file to form data
    formData.append('audio', {
      uri: fileUri,
      name: fileName,
      type: 'audio/wav',
    } as any);
    
    // Send request to API
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
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