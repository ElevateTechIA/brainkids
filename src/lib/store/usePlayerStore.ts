import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameProgress {
  highScore: number;
  stars: number; // 0-3
  timesPlayed: number;
  lastPlayed: number;
  currentLevel: number;
}

export interface PlayerState {
  // Profile
  displayName: string;
  avatarId: number;
  uid: string | null;

  // Progression
  xp: number;
  level: number;
  streak: number;
  lastPlayDate: string | null;

  // Badges
  badges: string[];

  // Per-game progress
  games: Record<string, GameProgress>;

  // Actions
  addXp: (amount: number) => void;
  updateGameProgress: (gameId: string, progress: Partial<GameProgress>) => void;
  addBadge: (badge: string) => void;
  setProfile: (name: string, avatarId: number) => void;
  setUid: (uid: string | null) => void;
  updateStreak: () => void;
  reset: () => void;
}

function calculateLevel(xp: number): number {
  // Each level requires progressively more XP
  // Level 1: 0, Level 2: 100, Level 3: 250, Level 4: 450...
  let level = 1;
  let threshold = 100;
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level++;
    threshold += 50;
  }
  return level;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

const initialState = {
  displayName: '',
  avatarId: 0,
  uid: null,
  xp: 0,
  level: 1,
  streak: 0,
  lastPlayDate: null,
  badges: [],
  games: {},
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      ...initialState,

      addXp: (amount) =>
        set((state) => {
          const newXp = state.xp + amount;
          return { xp: newXp, level: calculateLevel(newXp) };
        }),

      updateGameProgress: (gameId, progress) =>
        set((state) => {
          const existing = state.games[gameId] || {
            highScore: 0,
            stars: 0,
            timesPlayed: 0,
            lastPlayed: 0,
            currentLevel: 1,
          };
          return {
            games: {
              ...state.games,
              [gameId]: {
                ...existing,
                ...progress,
                timesPlayed: existing.timesPlayed + 1,
                lastPlayed: Date.now(),
                highScore: Math.max(existing.highScore, progress.highScore ?? 0),
                stars: Math.max(existing.stars, progress.stars ?? 0),
              },
            },
          };
        }),

      addBadge: (badge) =>
        set((state) => ({
          badges: state.badges.includes(badge) ? state.badges : [...state.badges, badge],
        })),

      setProfile: (name, avatarId) =>
        set({ displayName: name, avatarId }),

      setUid: (uid) => set({ uid }),

      updateStreak: () =>
        set((state) => {
          const today = getTodayStr();
          if (state.lastPlayDate === today) return state;

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          const newStreak = state.lastPlayDate === yesterdayStr ? state.streak + 1 : 1;
          return { streak: newStreak, lastPlayDate: today };
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'brainkids-player',
    }
  )
);
