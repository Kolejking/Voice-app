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

// Operation timeout (15 seconds - increased from default)
const OPERATION_TIMEOUT = 15000;

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
 * Safely execute an async operation with timeout
 * @param operation The async operation to execute
 * @param timeoutMs Timeout in milliseconds
 * @param operationName Name of the operation for better error messages
 * @returns Promise with the result of the operation
 */
const executeWithTimeout = async <T>(
  operation: Promise<T>, 
  timeoutMs: number, 
  operationName: string
): Promise<T> => {
  try {
    return await Promise.race([
      operation,
      createTimeoutPromise(timeoutMs, operationName)
    ]);
  } catch (error) {
    console.error(`Error in ${operationName}:`, error);
    throw error;
  }
};

/**
 * Request permission to record audio
 * @returns Promise with boolean indicating if permission was granted
 */
export const requestAudioPermission = async (): Promise<boolean> => {
  try {
    console.log('Requesting audio permission...');
    const permissionResult = await executeWithTimeout(
      Audio.requestPermissionsAsync(),
      5000,
      'Audio permission request'
    );
    console.log('Audio permission result:', permissionResult);
    return permissionResult.granted;
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
    await executeWithTimeout(
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        // Additional settings for Android
        ...(Platform.OS === 'android' ? {
          playThroughEarpieceAndroid: false,
        } : {})
      }),
      5000,
      'Set audio mode'
    );
    
    // Start recording
    console.log('Creating recording object...');
    const recording = new Audio.Recording();
    
    console.log('Preparing to record...');
    await executeWithTimeout(
      recording.prepareToRecordAsync(RECORDING_OPTIONS),
      10000,
      'Prepare recording'
    );
    
    console.log('Starting recording...');
    await executeWithTimeout(
      recording.startAsync(),
      5000,
      'Start recording'
    );
    
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
    await executeWithTimeout(
      recording.stopAndUnloadAsync(),
      10000,
      'Stop recording'
    );
    
    // Reset audio mode
    console.log('Resetting audio mode...');
    await executeWithTimeout(
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      }),
      5000,
      'Reset audio mode'
    );
    
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
 * Pick a .wav file from device storage
 * @returns Promise with the URI of the selected file
 */
export const pickAudioFile = async (): Promise<string> => {
  console.log('Opening document picker...');
  try {
    // Open document picker
    const result = await executeWithTimeout(
      DocumentPicker.getDocumentAsync({
        type: 'audio/*', // Accept any audio file type
        copyToCacheDirectory: true,
      }),
      OPERATION_TIMEOUT,
      'Document picker'
    );
    
    // Check if user canceled
    if (result.canceled) {
      throw new Error('User canceled file selection');
    }
    
    const uri = result.assets[0].uri;
    console.log('File selected, URI:', uri);
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
    const soundResult = await executeWithTimeout(
      Audio.Sound.createAsync({ uri }),
      10000,
      'Load sound'
    );
    
    const sound = soundResult.sound;
    
    // Play sound
    console.log('Playing audio...');
    await executeWithTimeout(
      sound.playAsync(),
      5000,
      'Play sound'
    );
    
    return sound;
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};