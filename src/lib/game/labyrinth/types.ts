export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Entry {
  id: number;
  x: number;
  y: number;
  isCorrect: boolean;
}

export interface Goal {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface LabyrinthLevel {
  id: string;
  name: string;
  difficulty: Difficulty;
  width: number;
  height: number;
  mazeHeight: number;
  walls: Wall[];
  entries: Entry[];
  goal: Goal;
  maxAttempts: number;
  unlockCost: number;
  hint?: string;
}

export type AttemptOutcome = 'won' | 'stuck' | 'out';

export interface AttemptResult {
  entryId: number;
  outcome: AttemptOutcome;
  power: number;
  durationMs: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}
