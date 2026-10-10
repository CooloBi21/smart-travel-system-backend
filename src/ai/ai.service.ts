import { Inject, Injectable } from '@nestjs/common';
import {
  AiProvider,
  AiRecommendationInput,
  AiSentimentInput,
} from './providers/ai-provider.interface';

@Injectable()
export class AiService {
  constructor(
    @Inject('AI_PROVIDER')
    private readonly provider: AiProvider,
  ) {}

  async recommend(
    input: AiRecommendationInput,
  ) {
    return this.provider.recommend(input);
  }

  async analyzeSentiment(
    input: AiSentimentInput,
  ) {
    return this.provider.analyzeSentiment(input);
  }
}
