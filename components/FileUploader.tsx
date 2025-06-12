import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickAudioFile } from '../utils/audioUtils';

interface FileUploaderProps {
  onFileSelected: (fileUri: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Handle file selection
  const handleSelectFile = async () => {
    try {
      setIsLoading(true);
      const uri = await pickAudioFile();
      
      // Extract file name from URI
      const name = uri.split('/').pop() || 'audio.wav';
      setFileName(name);
      
      onFileSelected(uri);
    } catch (error) {
      console.error('Error selecting file:', error);
      // If user canceled, don't show error
      if ((error as Error).message !== 'User canceled file selection') {
        alert('Error selecting file: ' + (error as Error).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleSelectFile}
          >
            <Ionicons name="document" size={32} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.instructionText}>
            Tap to select a .wav file
          </Text>
          
          {fileName && (
            <View style={styles.fileInfoContainer}>
              <Ionicons name="document-text" size={20} color="#007AFF" />
              <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode="middle">
                {fileName}
              </Text>
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
});

export default FileUploader;