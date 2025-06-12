/**
 * Utility functions for audio recording and file handling
 */
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

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
    
    // Prepare recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    
    // Start recording
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();
    
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
    // Stop recording
    await recording.stopAndUnloadAsync();
    
    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    
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
    // Open document picker
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/wav',
      copyToCacheDirectory: true,
    });
    
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
    // Load sound
    const { sound } = await Audio.Sound.createAsync({ uri });
    
    // Play sound
    await sound.playAsync();
    
    return sound;
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};