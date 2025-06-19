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

// Operation timeout (10 seconds)
const OPERATION_TIMEOUT = 10000;

/**
 * Creates a promise that rejects after a specified timeout
 * @param ms Timeout in milliseconds
 * @returns Promise that rejects after timeout
 */
const createTimeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
};

/**
 * Request permission to record audio
 * @returns Promise with boolean indicating if permission was granted
 */
export const requestAudioPermission = async (): Promise<boolean> => {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
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
  try {
    // Ensure app has recording permission
    const permissionGranted = await requestAudioPermission();
    if (!permissionGranted) {
      throw new Error('Permission to record audio was denied');
    }
    
    // Prepare recording with timeout
    await Promise.race([
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        // Additional settings for Android
        ...(Platform.OS === 'android' ? {
          playThroughEarpieceAndroid: false,
        } : {})
      }),
      createTimeoutPromise(OPERATION_TIMEOUT)
    ]);
    
    // Start recording with timeout
    const recording = new Audio.Recording();
    
    await Promise.race([
      recording.prepareToRecordAsync(RECORDING_OPTIONS),
      createTimeoutPromise(OPERATION_TIMEOUT)
    ]);
    
    await Promise.race([
      recording.startAsync(),
      createTimeoutPromise(OPERATION_TIMEOUT)
    ]);
    
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
  try {
    // Stop recording with timeout
    await Promise.race([
      recording.stopAndUnloadAsync(),
      createTimeoutPromise(OPERATION_TIMEOUT)
    ]);
    
    // Reset audio mode with timeout
    await Promise.race([
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      }),
      createTimeoutPromise(OPERATION_TIMEOUT)
    ]);
    
    // Get recording URI
    const uri = recording.getURI();
    if (!uri) {
      throw new Error('Recording URI is null');
    }
    
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
  try {
    // Open document picker with timeout
    const result = await Promise.race([
      DocumentPicker.getDocumentAsync({
        type: 'audio/*', // Accept any audio file type for better user experience
        copyToCacheDirectory: true,
      }),
      createTimeoutPromise(OPERATION_TIMEOUT)
    ]);
    
    // Check if user canceled
    if (result.canceled) {
      throw new Error('User canceled file selection');
    }
    
    // Return file URI
    return result.assets[0].uri;
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
  try {
    // Load sound with timeout
    const soundResult = await Promise.race([
      Audio.Sound.createAsync({ uri }),
      createTimeoutPromise(OPERATION_TIMEOUT)
    ]);
    
    const sound = soundResult.sound;
    
    // Play sound with timeout
    await Promise.race([
      sound.playAsync(),
      createTimeoutPromise(OPERATION_TIMEOUT)
    ]);
    
    return sound;
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};