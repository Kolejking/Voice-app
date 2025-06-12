import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AudioRecorder from '../components/AudioRecorder';
import { analyzeAudio } from '../utils/api';
import { RootStackParamList } from '../types';

type RecordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Record'>;

const RecordScreen: React.FC = () => {
  const navigation = useNavigation<RecordScreenNavigationProp>();
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle when recording is complete
  const handleRecordingComplete = (uri: string) => {
    setAudioUri(uri);
    setError(null);
  };

  // Handle analysis of recorded audio
  const handleAnalyzeAudio = async () => {
    if (!audioUri) return;
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const result = await analyzeAudio(audioUri);
      
      // Navigate to results screen with analysis result
      navigation.navigate('Result', { result });
    } catch (error) {
      console.error('Error analyzing audio:', error);
      setError(`Failed to analyze audio: ${(error as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Audio</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.instructionText}>
          Record your voice to analyze whether it's AI-generated or genuine.
        </Text>
        
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        
        {audioUri && !isAnalyzing && (
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleAnalyzeAudio}
          >
            <Text style={styles.analyzeButtonText}>Analyze Recording</Text>
          </TouchableOpacity>
        )}
        
        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Analyzing audio...</Text>
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

export default RecordScreen;