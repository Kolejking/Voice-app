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
 * Pick an audio file from device storage
 * @returns Promise with the URI of the selected file
 */
export const pickAudioFile = async (): Promise<string> => {
  console.log('Opening document picker...');
  try {
    // Open document picker with specific audio types
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac'],
      copyToCacheDirectory: true,
    });
    
    // Check if user canceled
    if (result.canceled) {
      throw new Error('User canceled file selection');
    }
    
    const uri = result.assets[0].uri;
    const fileExtension = uri.split('.').pop()?.toLowerCase() || '';
    
    // Validate file type
    if (!['wav', 'flac'].includes(fileExtension)) {
      throw new Error('Unsupported file type. Only .wav and .flac files are supported.');
    }
    
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