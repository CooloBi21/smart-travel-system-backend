import {
  CandidateTourRecord,
  CompletedTourHistoryRecord,
} from './repositories/recommendation.repository';

export interface RecommendationProfileForScoring {
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

  favoriteTourIds: number[];

  behaviorTourScores: Map<number, number>;
}

export interface RecommendationScoreBreakdown {
  preference: number;
  budget: number;
  duration: number;
  destination: number;
  tourHistory: number;
  behavior: number;
  finalScore: number;
}

export const RECOMMENDATION_WEIGHTS = {
  preference: 0.25,
  budget: 0.2,
  duration: 0.15,
  destination: 0.15,
  tourHistory: 0.15,
  behavior: 0.1,
} as const;

export class RecommendationScoring {
  static calculate(
    candidate: CandidateTourRecord,
    profile: RecommendationProfileForScoring,
    history: CompletedTourHistoryRecord[],
  ): RecommendationScoreBreakdown {
    const preference =
      this.calculatePreferenceScore(
        candidate,
        profile,
      );

    const budget =
      this.calculateBudgetScore(
        candidate,
        profile,
      );

    const duration =
      this.calculateDurationScore(
        candidate,
        profile,
      );

    const destination =
      this.calculateDestinationScore(
        candidate,
        profile,
      );

    const tourHistory =
      this.calculateTourHistoryScore(
        candidate,
        profile,
        history,
      );

    const behavior =
      this.calculateBehaviorScore(
        candidate,
        profile,
      );

    const finalScore =
      preference *
        RECOMMENDATION_WEIGHTS.preference +
      budget *
        RECOMMENDATION_WEIGHTS.budget +
      duration *
        RECOMMENDATION_WEIGHTS.duration +
      destination *
        RECOMMENDATION_WEIGHTS.destination +
      tourHistory *
        RECOMMENDATION_WEIGHTS.tourHistory +
      behavior *
        RECOMMENDATION_WEIGHTS.behavior;

    return {
      preference,
      budget,
      duration,
      destination,
      tourHistory,
      behavior,
      finalScore: this.round(finalScore),
    };
  }

  private static calculatePreferenceScore(
    candidate: CandidateTourRecord,
    profile: RecommendationProfileForScoring,
  ): number {
    const checks: number[] = [];

    if (profile.preferredCategoryId !== null) {
      checks.push(
        candidate.categoryId ===
          profile.preferredCategoryId
          ? 1
          : 0,
      );
    }

    if (profile.travelStyle !== null) {
      checks.push(
        candidate.travelStyle ===
          profile.travelStyle
          ? 1
          : 0,
      );
    }

    if (checks.length === 0) {
      return 0.5;
    }

    return this.average(checks);
  }

  private static calculateBudgetScore(
    candidate: CandidateTourRecord,
    profile: RecommendationProfileForScoring,
  ): number {
    if (
      candidate.minPrice === null ||
      profile.budgetMax === null
    ) {
      return 0.5;
    }

    if (candidate.minPrice <= profile.budgetMax) {
      return 1;
    }

    if (profile.budgetMax <= 0) {
      return 0;
    }

    const penalty =
      (candidate.minPrice - profile.budgetMax) /
      profile.budgetMax;

    return this.clamp(1 - penalty);
  }

  private static calculateDurationScore(
    candidate: CandidateTourRecord,
    profile: RecommendationProfileForScoring,
  ): number {
    if (
      profile.preferredDurationDays === null ||
      profile.preferredDurationDays <= 0
    ) {
      return 0.5;
    }

    const difference = Math.abs(
      candidate.durationDays -
        profile.preferredDurationDays,
    );

    return this.clamp(
      1 -
        difference /
          profile.preferredDurationDays,
    );
  }

  private static calculateDestinationScore(
    candidate: CandidateTourRecord,
    profile: RecommendationProfileForScoring,
  ): number {
    if (
      profile.preferredDestinationId === null
    ) {
      return 0.5;
    }

    return candidate.destinationId ===
      profile.preferredDestinationId
      ? 1
      : 0;
  }

  private static calculateTourHistoryScore(
    candidate: CandidateTourRecord,
    profile: RecommendationProfileForScoring,
    history: CompletedTourHistoryRecord[],
  ): number {
    if (history.length === 0) {
      return 0.5;
    }

    const historyMatchScores = history.map(
      (item) => {
        const destinationMatch =
          item.destinationId ===
          candidate.destinationId;

        const categoryMatch =
          item.categoryId ===
          candidate.categoryId;

        const styleMatch =
          item.travelStyle ===
          candidate.travelStyle;

        return (
          Number(destinationMatch) * 0.4 +
          Number(categoryMatch) * 0.3 +
          Number(styleMatch) * 0.3
        );
      },
    );

    return Math.max(...historyMatchScores);
  }

  private static calculateBehaviorScore(
    candidate: CandidateTourRecord,
    profile: RecommendationProfileForScoring,
  ): number {
    const score =
      profile.behaviorTourScores.get(
        candidate.tourId,
      ) ?? 0;

    if (score <= 0) {
      return 0;
    }

    const positiveScores = [
      ...profile.behaviorTourScores.values(),
    ].filter((value) => value > 0);

    if (positiveScores.length === 0) {
      return 0;
    }

    const maxScore = Math.max(
      ...positiveScores,
    );

    if (maxScore <= 0) {
      return 0;
    }

    return this.clamp(score / maxScore);
  }

  private static average(values: number[]): number {
    if (values.length === 0) {
      return 0.5;
    }

    return (
      values.reduce(
        (sum, value) => sum + value,
        0,
      ) / values.length
    );
  }

  private static clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private static round(value: number): number {
    return Number(value.toFixed(6));
  }
}
