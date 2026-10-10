export interface AiRecommendationInput {
  destinationName?: string;
  travelStyle?: string;
  durationDays?: number;
  budget?: number;
  interests?: string[];
}

export interface AiRecommendationResult {
  score: number;
  reasons: string[];
}

export interface AiSentimentInput {
  text: string;
}

export type AiSentimentLabel =
  | 'POSITIVE'
  | 'NEUTRAL'
  | 'NEGATIVE';

export interface AiSentimentResult {
  label: AiSentimentLabel;
  confidence: number;
  modelVersion: string;
}

export interface AiProvider {
  recommend(
    input: AiRecommendationInput,
  ): Promise<AiRecommendationResult>;

  analyzeSentiment(
    input: AiSentimentInput,
  ): Promise<AiSentimentResult>;
}
