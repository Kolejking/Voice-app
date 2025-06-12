import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Request permission on component mount
  useEffect(() => {
    const requestPermission = async () => {
      const { granted } = await Audio.requestPermissionsAsync();
      setPermissionGranted(granted);
    };
    
    requestPermission();
  }, []);

  // Update recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
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
    try {
      setIsLoading(true);
      const newRecording = await startRecording();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    if (!recording) return;
    
    try {
      setIsLoading(true);
      const uri = await stopRecording(recording);
      setIsRecording(false);
      setRecording(null);
      onRecordingComplete(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If permission not granted, show message
  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Microphone permission is required to record audio.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
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
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});

export default AudioRecorder;