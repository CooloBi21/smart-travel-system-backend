import { Injectable } from '@nestjs/common';
import {
  BehaviorSignalRecord,
  CandidateTourRecord,
  CompletedTourHistoryRecord,
  RecommendationRepository,
} from './repositories/recommendation.repository';
import {
  RecommendationProfileForScoring,
  RecommendationScoring,
  RecommendationScoreBreakdown,
} from './recommendation.scoring';

export interface RecommendationResult {
  tour: CandidateTourRecord;
  breakdown: RecommendationScoreBreakdown;
  reason: string;
}

interface RecommendationProfile {
  preferredCategoryId: number | null;
  preferredDestinationId: number | null;

  budgetMin: number;
  budgetMax: number | null;

  preferredDurationDays: number | null;
  travelStyle: string | null;

  completedTourIds: number[];

  historyDestinationIds: number[];
  historyCategoryIds: number[];
  historyTravelStyles: string[];

  completedHistory: CompletedTourHistoryRecord[];

  favoriteTourIds: number[];

  behaviorTourScores: Map<number, number>;
}

const RECOMMENDATION_TOP_K = 10;

const BEHAVIOR_WEIGHTS: Record<string, number> = {
  VIEW: 1,
  SEARCH: 1,
  FAVORITE: 3,
  BOOKING_INTENT: 4,
  BOOKING: 5,
  UNFAVORITE: -2,
};

@Injectable()
export class RecommendationService {
  constructor(
    private readonly recommendationRepository: RecommendationRepository,
  ) {}

  async generateRecommendations(
    userId: number,
  ): Promise<RecommendationResult[]> {
    const profile =
      await this.buildRecommendationProfile(
        userId,
      );

    const candidates =
      await this.recommendationRepository.getCandidateTours();

    const completedTourIds =
      new Set(profile.completedTourIds);

    const rankedRecommendations = candidates
      .filter(
        (candidate) =>
          !completedTourIds.has(
            candidate.tourId,
          ),
      )
      .map((candidate) => {
        const breakdown =
          RecommendationScoring.calculate(
            candidate,
            profile,
            profile.completedHistory,
          );

        return {
          tour: candidate,
          breakdown,
          reason:
            this.buildRecommendationReason(
              candidate,
              breakdown,
            ),
        };
      })
      .sort(
        (a, b) =>
          b.breakdown.finalScore -
          a.breakdown.finalScore,
      );

    const topRecommendations =
      rankedRecommendations.slice(0, RECOMMENDATION_TOP_K);

    await this.recommendationRepository.createRecommendationRunWithItems(
      {
        userId,
        algorithmCode: 'RULE_BASED',
        algorithmVersion: '1.0',
        context: {
          weights: {
            preference: 0.25,
            budget: 0.2,
            duration: 0.15,
            destination: 0.15,
            tourHistory: 0.15,
            behavior: 0.1,
          },
        },
      },
      topRecommendations.map(
        (recommendation, index) => ({
          tourId: recommendation.tour.tourId,
          rankPosition: index + 1,
          score: recommendation.breakdown.finalScore,
          reason: recommendation.reason,
        }),
      ),
    );

    return topRecommendations;
  }

  async buildRecommendationProfile(
    userId: number,
  ): Promise<RecommendationProfile> {
    const [
      preferences,
      history,
      favorites,
      behaviorSignals,
    ] = await Promise.all([
      this.recommendationRepository.getUserPreferences(userId),
      this.recommendationRepository.getCompletedTourHistory(userId),
      this.recommendationRepository.getFavoriteTours(userId),
      this.recommendationRepository.getBehaviorSignals(userId),
    ]);

    const completedTourIds = [
      ...new Set(history.map((item) => item.tourId)),
    ];

    const historyDestinationIds = [
      ...new Set(
        history.map((item) => item.destinationId),
      ),
    ];

    const historyCategoryIds = [
      ...new Set(
        history.map((item) => item.categoryId),
      ),
    ];

    const historyTravelStyles = [
      ...new Set(
        history.map((item) => item.travelStyle),
      ),
    ];

    const favoriteTourIds = [
      ...new Set(
        favorites.map((item) => item.tourId),
      ),
    ];

    const behaviorTourScores =
      this.buildBehaviorTourScores(
        behaviorSignals,
      );

    return {
      preferredCategoryId:
        preferences?.preferredCategoryId ?? null,

      preferredDestinationId:
        preferences?.preferredDestinationId ?? null,

      budgetMin:
        preferences?.budgetMin ?? 0,

      budgetMax:
        preferences?.budgetMax ?? null,

      preferredDurationDays:
        preferences?.preferredDurationDays ?? null,

      travelStyle:
        preferences?.travelStyle ?? null,

      completedTourIds,

      historyDestinationIds,
      historyCategoryIds,
      historyTravelStyles,

      completedHistory: history,

      favoriteTourIds,

      behaviorTourScores,
    };
  }

  private buildBehaviorTourScores(
    signals: BehaviorSignalRecord[],
  ): Map<number, number> {
    const scores = new Map<number, number>();

    for (const signal of signals) {
      if (signal.tourId === null) {
        continue;
      }

      const weight =
        BEHAVIOR_WEIGHTS[signal.actionType] ?? 0;

      if (weight === 0) {
        continue;
      }

      const currentScore =
        scores.get(signal.tourId) ?? 0;

      scores.set(
        signal.tourId,
        currentScore + weight,
      );
    }

    return scores;
  }

  private buildRecommendationReason(
    candidate: CandidateTourRecord,
    breakdown: RecommendationScoreBreakdown,
  ): string {
    const reasons: string[] = [];

    if (breakdown.preference >= 0.8) {
      reasons.push('phù hợp với sở thích của bạn');
    }

    if (breakdown.budget >= 0.8) {
      reasons.push('phù hợp với ngân sách');
    }

    if (breakdown.duration >= 0.8) {
      reasons.push('phù hợp với thời lượng chuyến đi');
    }

    if (breakdown.destination >= 0.8) {
      reasons.push('phù hợp với điểm đến bạn quan tâm');
    }

    if (breakdown.tourHistory >= 0.8) {
      reasons.push('tương đồng với lịch sử du lịch của bạn');
    }

    if (breakdown.behavior >= 0.8) {
      reasons.push(
        'được ưu tiên dựa trên dữ liệu tương tác của bạn',
      );
    }

    if (reasons.length === 0) {
      return 'Được đề xuất dựa trên hồ sơ và dữ liệu tương tác hiện có.';
    }

    if (reasons.length === 1) {
      return `${this.capitalize(reasons[0])}.`;
    }

    return `${this.capitalize(
      reasons.slice(0, -1).join(', '),
    )} và ${reasons[reasons.length - 1]}.`;
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
