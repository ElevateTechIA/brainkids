export interface DifficultyState {
  level: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  totalCorrect: number;
  totalAttempts: number;
}

export function createDifficultyState(startLevel: number = 1): DifficultyState {
  return {
    level: startLevel,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    totalCorrect: 0,
    totalAttempts: 0,
  };
}

export function updateDifficulty(state: DifficultyState, correct: boolean): DifficultyState {
  const newState = { ...state, totalAttempts: state.totalAttempts + 1 };

  if (correct) {
    newState.consecutiveCorrect = state.consecutiveCorrect + 1;
    newState.consecutiveWrong = 0;
    newState.totalCorrect = state.totalCorrect + 1;

    // 3 correct in a row -> level up
    if (newState.consecutiveCorrect >= 3) {
      newState.level = Math.min(state.level + 1, 10);
      newState.consecutiveCorrect = 0;
    }
  } else {
    newState.consecutiveWrong = state.consecutiveWrong + 1;
    newState.consecutiveCorrect = 0;

    // 2 wrong in a row -> level down
    if (newState.consecutiveWrong >= 2) {
      newState.level = Math.max(state.level - 1, 1);
      newState.consecutiveWrong = 0;
    }
  }

  return newState;
}

export function getAccuracy(state: DifficultyState): number {
  if (state.totalAttempts === 0) return 0;
  return Math.round((state.totalCorrect / state.totalAttempts) * 100);
}

export function calculateStars(accuracy: number, level: number): number {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 50) return 1;
  return 0;
}

export function calculateXp(score: number, stars: number, level: number): number {
  const base = score * 2;
  const starBonus = stars === 3 ? 20 : stars === 2 ? 10 : 0;
  const levelBonus = level * 3;
  return base + starBonus + levelBonus;
}
