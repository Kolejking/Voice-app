import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ResultDisplayProps {
  result: {
    isAI: boolean;
    confidence: number;
    message: string;
  };
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset }) => {
  // Format confidence as percentage
  const confidencePercentage = Math.round(result.confidence * 100);
  
  return (
    <View style={styles.container}>
      <View style={[
        styles.resultCard,
        result.isAI ? styles.aiResult : styles.humanResult
      ]}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={result.isAI ? "warning" : "checkmark-circle"}
            size={48}
            color={result.isAI ? "#FF9500" : "#34C759"}
          />
        </View>
        
        <Text style={styles.resultTitle}>
          {result.isAI ? "AI-Generated Voice" : "Genuine Human Voice"}
        </Text>
        
        <Text style={styles.confidenceText}>
          Confidence: {confidencePercentage}%
        </Text>
        
        <Text style={styles.messageText}>
          {result.message}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.resetButton} onPress={onReset}>
        <Ionicons name="refresh" size={20} color="white" />
        <Text style={styles.resetButtonText}>Try Another</Text>
      </TouchableOpacity>
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
  resultCard: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiResult: {
    backgroundColor: '#FFF5EB',
    borderColor: '#FF9500',
    borderWidth: 1,
  },
  humanResult: {
    backgroundColor: '#F2FFF5',
    borderColor: '#34C759',
    borderWidth: 1,
  },
  iconContainer: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ResultDisplay;