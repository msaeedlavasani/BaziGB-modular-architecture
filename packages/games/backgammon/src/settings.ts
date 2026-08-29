export const BACKGAMMON_RULES_PROFILE = {
  id: 'backgammon-standard-match',
  version: 1,
  playModes: ['single', 'points'] as const,
  targetScores: [3, 5, 7, 9, 11, 13] as const,
  doublingCube: true,
  crawfordRule: true,
  winByTwo: false,
  undo: {
    randomRoll: false,
    crossGameBoundary: false,
  },
} as const;

export type BackgammonPlayMode = (typeof BACKGAMMON_RULES_PROFILE.playModes)[number];
export type BackgammonTargetScore = (typeof BACKGAMMON_RULES_PROFILE.targetScores)[number];
