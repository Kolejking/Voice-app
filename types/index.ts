/**
 * Type definitions for the app
 */

// Navigation parameter list
export type RootStackParamList = {
  Home: undefined;
  Record: undefined;
  Upload: undefined;
  Result: {
    result: {
      isAI: boolean;
      confidence: number;
      message: string;
    };
  };
};