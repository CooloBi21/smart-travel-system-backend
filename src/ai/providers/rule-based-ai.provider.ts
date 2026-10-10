import {
  AiProvider,
  AiRecommendationInput,
  AiRecommendationResult,
  AiSentimentInput,
  AiSentimentResult,
} from './ai-provider.interface';

export class RuleBasedAiProvider
  implements AiProvider
{
  async recommend(
    input: AiRecommendationInput,
  ): Promise<AiRecommendationResult> {
    let score = 50;

    const reasons: string[] = [];

    if (input.travelStyle) {
      score += 10;

      reasons.push(
        `Phù hợp với phong cách du lịch ${input.travelStyle}.`,
      );
    }

    if (
      input.durationDays &&
      input.durationDays >= 3
    ) {
      score += 10;

      reasons.push(
        'Phù hợp với chuyến đi từ 3 ngày trở lên.',
      );
    }

    if (
      input.interests &&
      input.interests.length > 0
    ) {
      score += 10;

      reasons.push(
        `Có ${input.interests.length} nhóm sở thích phù hợp.`,
      );
    }

    return {
      score: Math.min(score, 100),
      reasons,
    };
  }

  async analyzeSentiment(
    input: AiSentimentInput,
  ): Promise<AiSentimentResult> {
    const normalizedText =
      input.text.trim().toLowerCase();

    const positiveKeywords = [
      'tuyệt',
      'tuyệt vời',
      'thích',
      'hài lòng',
      'hay',
      'đẹp',
      'tốt',
      'xuất sắc',
      'ấn tượng',
      'vui',
      'recommend',
      'great',
      'excellent',
      'good',
      'amazing',
    ];

    const negativeKeywords = [
      'tệ',
      'không thích',
      'không hài lòng',
      'kém',
      'xấu',
      'thất vọng',
      'chán',
      'tồi',
      'khó chịu',
      'bad',
      'terrible',
      'poor',
      'disappointed',
    ];

    const positiveMatches =
      positiveKeywords.filter((keyword) =>
        normalizedText.includes(keyword),
      ).length;

    const negativeMatches =
      negativeKeywords.filter((keyword) =>
        normalizedText.includes(keyword),
      ).length;

    if (
      positiveMatches > negativeMatches &&
      positiveMatches > 0
    ) {
      return {
        label: 'POSITIVE',
        confidence: 0.85,
        modelVersion: 'rule-based-v1',
      };
    }

    if (
      negativeMatches > positiveMatches &&
      negativeMatches > 0
    ) {
      return {
        label: 'NEGATIVE',
        confidence: 0.85,
        modelVersion: 'rule-based-v1',
      };
    }

    return {
      label: 'NEUTRAL',
      confidence: 0.6,
      modelVersion: 'rule-based-v1',
    };
  }
}
