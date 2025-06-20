// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Record: undefined;
  Upload: undefined;
  Result: { 
    result: { 
      isAI: boolean; 
      confidence: number; 
      message: string;
      rawPrediction?: string;
    } 
  };
};

// API response types
export interface AnalysisResult {
  isAI: boolean;
  confidence: number;
  message: string;
  rawPrediction?: string;
}

export interface FlaskApiResponse {
  prediction: string;
  confidence: number;
}