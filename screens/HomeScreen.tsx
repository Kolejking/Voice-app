import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Analyzer</Text>
        <Text style={styles.subtitle}>Detect AI-generated voices</Text>
      </View>
      
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/images/appacella-logo-blue.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsTitle}>Choose an option:</Text>
        
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate('Record')}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="mic" size={28} color="white" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Record Audio</Text>
            <Text style={styles.optionDescription}>
              Record your voice directly using the microphone
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate('Upload')}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: '#4CD964' }]}>
            <Ionicons name="document" size={28} color="white" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Upload .WAV File</Text>
            <Text style={styles.optionDescription}>
              Select an existing audio file from your device
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by AI Voice Detection Technology
        </Text>
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  image: {
    width: 200,
    height: 100,
  },
  optionsContainer: {
    padding: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default HomeScreen;