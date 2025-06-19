import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { startRecording, stopRecording } from '../utils/audioUtils';

interface AudioRecorderProps {
  onRecordingComplete: (fileUri: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [isLoading, setIsLoading] = useState(false);

  // Request permission on component mount
  useEffect(() => {
    const requestPermission = async () => {
      try {
        setIsLoading(true);
        const { granted, canAskAgain } = await Audio.requestPermissionsAsync();
        
        if (granted) {
          setPermissionStatus('granted');
          
          // Set up audio mode
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            // Additional settings for Android
            ...(Platform.OS === 'android' ? {
              playThroughEarpieceAndroid: false,
            } : {})
          });
        } else {
          setPermissionStatus(canAskAgain ? 'undetermined' : 'denied');
        }
      } catch (error) {
        console.error('Error requesting audio permission:', error);
        setPermissionStatus('denied');
      } finally {
        setIsLoading(false);
      }
    };
    
    requestPermission();
    
    // Cleanup function
    return () => {
      // Ensure recording is stopped when component unmounts
      if (recording) {
        recording.stopAndUnloadAsync().catch(error => {
          console.error('Error stopping recording on unmount:', error);
        });
      }
    };
  }, []);

  // Update recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle start recording
  const handleStartRecording = async () => {
    if (isLoading || isRecording) return;
    
    try {
      setIsLoading(true);
      
      // Double-check permission
      if (permissionStatus !== 'granted') {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          throw new Error('Microphone permission is required');
        }
        setPermissionStatus('granted');
      }
      
      const newRecording = await startRecording();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(`Failed to start recording: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    if (isLoading || !recording || !isRecording) return;
    
    try {
      setIsLoading(true);
      const uri = await stopRecording(recording);
      setIsRecording(false);
      setRecording(null);
      onRecordingComplete(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert(`Failed to stop recording: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // If permission status is still being determined, show loading
  if (permissionStatus === 'undetermined' && isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Requesting microphone access...</Text>
      </View>
    );
  }

  // If permission denied, show message
  if (permissionStatus === 'denied') {
    return (
      <View style={styles.container}>
        <Ionicons name="mic-off" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>
          Microphone permission is required to record audio.
        </Text>
        <Text style={styles.errorSubtext}>
          Please enable microphone access in your device settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {isRecording ? "Stopping recording..." : "Starting recording..."}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.durationContainer}>
            {isRecording && (
              <>
                <Ionicons name="radio" size={24} color="red" style={styles.recordingIcon} />
                <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
              </>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording ? styles.recordingActive : styles.recordingInactive
            ]}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isLoading}
          >
            <Ionicons
              name={isRecording ? "square" : "mic"}
              size={32}
              color="white"
            />
          </TouchableOpacity>
          
          <Text style={styles.instructionText}>
            {isRecording ? "Tap to stop recording" : "Tap to start recording"}
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  recordingActive: {
    backgroundColor: '#FF3B30',
  },
  recordingInactive: {
    backgroundColor: '#007AFF',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  recordingIcon: {
    marginRight: 8,
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default AudioRecorder;