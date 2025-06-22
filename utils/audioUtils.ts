/**
 * Utility functions for audio recording and file handling
 */
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

// Audio recording settings
const RECORDING_OPTIONS = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

/**
 * Request permission to record audio
 * @returns Promise with boolean indicating if permission was granted
 */
export const requestAudioPermission = async (): Promise<boolean> => {
  try {
    console.log('Requesting audio permission...');
    const { granted } = await Audio.requestPermissionsAsync();
    console.log('Audio permission result:', granted);
    return granted;
  } catch (error) {
    console.error('Error requesting audio permission:', error);
    return false;
  }
};

/**
 * Start recording audio
 * @returns Promise with the recording object
 */
export const startRecording = async (): Promise<Audio.Recording> => {
  console.log('Starting recording...');
  try {
    // Ensure app has recording permission
    const permissionGranted = await requestAudioPermission();
    if (!permissionGranted) {
      throw new Error('Permission to record audio was denied');
    }
    
    // Prepare recording
    console.log('Setting audio mode...');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      // Additional settings for Android
      ...(Platform.OS === 'android' ? {
        playThroughEarpieceAndroid: false,
      } : {})
    });
    
    // Start recording
    console.log('Creating recording object...');
    const recording = new Audio.Recording();
    
    console.log('Preparing to record...');
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    
    console.log('Starting recording...');
    await recording.startAsync();
    
    console.log('Recording started successfully');
    return recording;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

/**
 * Stop recording and get the file URI
 * @param recording The recording object
 * @returns Promise with the URI of the recorded file
 */
export const stopRecording = async (recording: Audio.Recording): Promise<string> => {
  console.log('Stopping recording...');
  try {
    // Stop recording
    await recording.stopAndUnloadAsync();
    
    // Reset audio mode
    console.log('Resetting audio mode...');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
    
    // Get recording URI
    const uri = recording.getURI();
    if (!uri) {
      throw new Error('Recording URI is null');
    }
    
    console.log('Recording stopped, URI:', uri);
    return uri;
  } catch (error) {
    console.error('Error stopping recording:', error);
    throw error;
  }
};

/**
 * Validates if a file is a supported audio format
 * @param uri File URI to validate
 * @param fileName Original file name
 * @returns Promise with validation result
 */
const validateAudioFile = async (uri: string, fileName: string): Promise<{ isValid: boolean; fileType: string; error?: string }> => {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      return { isValid: false, fileType: '', error: 'File does not exist' };
    }
    
    // Check file size (should be > 0)
    if (fileInfo.size === 0) {
      return { isValid: false, fileType: '', error: 'File is empty' };
    }
    
    // Extract file extension from original filename
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    console.log(`Original file extension: ${fileExtension}`);
    
    // Also check URI extension as fallback
    const uriExtension = uri.split('.').pop()?.toLowerCase() || '';
    console.log(`URI file extension: ${uriExtension}`);
    
    // Use original filename extension if available, otherwise use URI extension
    const detectedExtension = fileExtension || uriExtension;
    
    // Validate file type
    if (!['wav', 'flac'].includes(detectedExtension)) {
      return { 
        isValid: false, 
        fileType: detectedExtension, 
        error: `Unsupported file type: .${detectedExtension}. Only .wav and .flac files are supported.` 
      };
    }
    
    console.log(`File validation successful: ${detectedExtension}, size: ${fileInfo.size} bytes`);
    return { isValid: true, fileType: detectedExtension };
    
  } catch (error) {
    console.error('Error validating file:', error);
    return { isValid: false, fileType: '', error: `Validation error: ${(error as Error).message}` };
  }
};

/**
 * Pick an audio file from device storage
 * @returns Promise with the URI of the selected file
 */
export const pickAudioFile = async (): Promise<string> => {
  console.log('Opening document picker...');
  try {
    // Open document picker with broader audio types and all files as fallback
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'audio/wav', 
        'audio/x-wav', 
        'audio/flac', 
        'audio/x-flac',
        'audio/*',  // Broader audio type
        '*/*'       // Allow all files as fallback
      ],
      copyToCacheDirectory: true,
    });
    
    // Check if user canceled
    if (result.canceled) {
      throw new Error('User canceled file selection');
    }
    
    const asset = result.assets[0];
    const uri = asset.uri;
    const fileName = asset.name || 'unknown.wav';
    
    console.log(`File selected - Name: ${fileName}, URI: ${uri}`);
    
    // Validate the selected file
    const validation = await validateAudioFile(uri, fileName);
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid file selected');
    }
    
    console.log(`File validation passed: ${validation.fileType}`);
    return uri;
    
  } catch (error) {
    console.error('Error picking audio file:', error);
    throw error;
  }
};

/**
 * Play audio from URI
 * @param uri URI of the audio file to play
 * @returns Promise with the sound object
 */
export const playAudio = async (uri: string): Promise<Audio.Sound> => {
  console.log('Loading audio to play...');
  try {
    // Load sound
    const { sound } = await Audio.Sound.createAsync({ uri });
    
    // Play sound
    console.log('Playing audio...');
    await sound.playAsync();
    
    return sound;
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};