import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import FileUploader from '../components/FileUploader';
import { analyzeAudio } from '../utils/api';
import { RootStackParamList } from '../types';

type UploadScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Upload'>;

const UploadScreen: React.FC = () => {
  const navigation = useNavigation<UploadScreenNavigationProp>();
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle when file is selected
  const handleFileSelected = useCallback((uri: string) => {
    console.log('File selected, URI:', uri);
    setFileUri(uri);
    setError(null);
  }, []);

  // Handle analysis of uploaded file
  const handleAnalyzeFile = useCallback(async () => {
    if (!fileUri) {
      Alert.alert('Error', 'No file selected. Please select an audio file first.');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      console.log('Starting file analysis...');
      
      // Set a timeout for the entire operation
      const analysisPromise = analyzeAudio(fileUri);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Analysis timed out after 20 seconds'));
        }, 20000);
      });
      
      // Race between analysis and timeout
      const result = await Promise.race([analysisPromise, timeoutPromise]);
      
      console.log('Analysis complete, navigating to results');
      
      // Navigate to results screen with analysis result
      navigation.navigate('Result', { result });
    } catch (error) {
      console.error('Error analyzing file:', error);
      
      // Show alert for better visibility
      Alert.alert(
        'Analysis Error',
        `Failed to analyze file: ${(error as Error).message}`,
        [{ text: 'OK' }]
      );
      
      setError(`Failed to analyze file: ${(error as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [fileUri, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Audio</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.instructionText}>
          Upload a .wav file to analyze whether it's AI-generated or genuine.
        </Text>
        
        <FileUploader onFileSelected={handleFileSelected} />
        
        {fileUri && !isAnalyzing && (
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleAnalyzeFile}
          >
            <Text style={styles.analyzeButtonText}>Analyze File</Text>
          </TouchableOpacity>
        )}
        
        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Analyzing audio...</Text>
            <Text style={styles.loadingSubtext}>This may take a few moments</Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: {
    color: '#FF3B30',
    marginLeft: 8,
    flex: 1,
  },
});

export default UploadScreen;