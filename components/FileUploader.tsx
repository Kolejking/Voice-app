import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickAudioFile } from '../utils/audioUtils';

interface FileUploaderProps {
  onFileSelected: (fileUri: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleSelectFile = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const uri = await pickAudioFile();
      
      // Extract file name from URI
      const name = uri.split('/').pop() || 'audio.wav';
      setFileName(name);
      
      onFileSelected(uri);
    } catch (error) {
      console.error('Error selecting file:', error);
      
      // If user canceled, don't show error
      if ((error as Error).message !== 'User canceled file selection') {
        setError((error as Error).message);
        Alert.alert(
          'File Selection Error',
          `Error selecting file: ${(error as Error).message}`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Selecting file...</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleSelectFile}
            disabled={isLoading}
          >
            <Ionicons name="document" size={32} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.instructionText}>
            Tap to select an audio file
          </Text>
          
          {fileName && (
            <View style={styles.fileInfoContainer}>
              <Ionicons name="document-text" size={20} color="#007AFF" />
              <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode="middle">
                {fileName}
              </Text>
            </View>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
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
  uploadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CD964',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    maxWidth: '80%',
  },
  fileNameText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    maxWidth: '90%',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 10,
    backgroundColor: '#FFF2F2',
    borderRadius: 8,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
    flex: 1,
  },
});

export default FileUploader;