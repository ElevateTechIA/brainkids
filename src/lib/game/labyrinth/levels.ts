import type { Entry, LabyrinthLevel, Wall } from './types';

const W = 360;
const H = 540;
const MAZE_H = H;
const ENTRY_COUNT = 10;
const ENTRY_SPACING = W / ENTRY_COUNT;
const ENTRY_Y = 24;

function entries(correctIds: number[]): Entry[] {
  return Array.from({ length: ENTRY_COUNT }, (_, i) => ({
    id: i,
    x: i * ENTRY_SPACING + ENTRY_SPACING / 2,
    y: ENTRY_Y,
    isCorrect: correctIds.includes(i),
  }));
}

function box(x: number, y: number, w: number, h: number): Wall {
  return { x, y, w, h };
}

function peg(cx: number, cy: number, size = 14): Wall {
  return { x: cx - size / 2, y: cy - size / 2, w: size, h: size };
}

function goalBox(centerX: number, y: number, w = 100, h = 36) {
  return { x: centerX - w / 2, y, w, h };
}

// Diagonal staircase (acts as a slope under gravity).
// dx>0,dy>0 = goes down-right; dx<0 = down-left.
function ramp(
  startX: number,
  startY: number,
  steps: number,
  dx: number,
  dy: number,
  size = 12,
): Wall[] {
  return Array.from({ length: steps }, (_, i) =>
    box(startX + i * dx, startY + i * dy, size, size),
  );
}

const LEVEL_BASE = {
  width: W,
  height: H,
  mazeHeight: MAZE_H,
  maxAttempts: 3,
};

export const LABYRINTH_LEVELS: LabyrinthLevel[] = [
  // --- Level 1: Le Petit Chemin (easy) -----------------------------------
  // Three layers, central goal. Side pegs scatter. Two ramps deflect into goal.
  {
    ...LEVEL_BASE,
    id: 'petit-chemin',
    name: 'Le Petit Chemin',
    difficulty: 'easy',
    unlockCost: 0,
    walls: [
      // Layer 1 — wall blocks edges, gap in centre x=120..240
      box(0, 90, 120, 14),
      box(240, 90, 120, 14),
      // Pegs above gap to scatter slightly
      peg(140, 78),
      peg(220, 78),
      // Layer 2 — pair of ramps funnelling toward the centre
      ...ramp(40, 170, 6, 16, 8), // down-right slope on left
      ...ramp(304, 170, 6, -16, 8), // down-left slope on right
      // Layer 3 — narrow horizontal walls on far edges (block stray balls)
      box(0, 280, 70, 12),
      box(290, 280, 70, 12),
      // Vertical funnel walls leading to goal
      box(80, 330, 10, 110),
      box(270, 330, 10, 110),
      // Bottom rails outside goal area
      box(0, 470, 80, 12),
      box(280, 470, 80, 12),
    ],
    goal: goalBox(W / 2, 478, 180, 50),
    entries: entries([4, 5, 6]),
  },

  // --- Level 2: Le Jardin Secret (easy/medium) ---------------------------
  // Goal on the LEFT. A long ramp slopes balls left. Right side is decoy.
  {
    ...LEVEL_BASE,
    id: 'jardin-secret',
    name: 'Le Jardin Secret',
    difficulty: 'easy',
    unlockCost: 25,
    walls: [
      // Layer 1 — left third blocked
      box(0, 80, 110, 12),
      // Right-leaning ramp pushes right-side balls into a dead end
      ...ramp(140, 100, 7, 18, 10),
      // Layer 2 — left ramp pushes balls down-left toward goal
      ...ramp(110, 200, 8, -12, 12),
      // Layer 3 — right wall blocks anything that drifted right
      box(180, 320, 180, 12),
      // Dead-end pocket on right (visual decoy)
      box(180, 320, 12, 90),
      box(348, 320, 12, 90),
      box(180, 410, 180, 12),
      // Left vertical guide
      box(125, 280, 10, 130),
      // Bottom rails
      box(125, 470, 90, 12),
      box(280, 470, 80, 12),
    ],
    goal: goalBox(60, 478, 110, 50),
    entries: entries([2, 3]),
  },

  // --- Level 3: Le Défi Royal (medium) -----------------------------------
  // Multi-corridor: 4 vertical channels, only one leads through. Pegs split flow.
  {
    ...LEVEL_BASE,
    id: 'defi-royal',
    name: 'Le Défi Royal',
    difficulty: 'medium',
    unlockCost: 25,
    walls: [
      // Layer 1 — four pegs split entries into 5 columns
      peg(72, 70, 16),
      peg(144, 70, 16),
      peg(216, 70, 16),
      peg(288, 70, 16),
      // Layer 2 — vertical dividers create 4 channels
      box(72, 110, 10, 140),
      box(180, 110, 10, 140),
      box(288, 110, 10, 140),
      // Layer 3 — close the wrong channels with horizontal caps
      box(0, 250, 72, 12), // cap channel 1
      box(190, 250, 98, 12), // cap channel 3
      box(298, 250, 62, 12), // cap channel 4
      // Channel 2 (x=82..180) stays open and leads down
      // Layer 4 — small horizontal deflector to add interest
      peg(120, 320, 14),
      // Layer 5 — final funnel walls
      box(60, 380, 10, 90),
      box(200, 380, 10, 90),
      // Bottom rails
      box(0, 470, 60, 12),
      box(210, 470, 150, 12),
    ],
    goal: goalBox(135, 478, 130, 50),
    entries: entries([2, 3]),
  },

  // --- Level 4: Le Chemin des Énigmes (medium/hard) ----------------------
  // Zigzag: ball must traverse left -> right -> left to reach goal.
  {
    ...LEVEL_BASE,
    id: 'chemin-enigmes',
    name: 'Le Chemin des Énigmes',
    difficulty: 'medium',
    unlockCost: 25,
    walls: [
      // Layer 1 — gap on right only
      box(0, 80, 280, 12),
      // Right ramp going down-left (catches the right gap and pushes left)
      ...ramp(280, 100, 9, -16, 10),
      // Layer 2 — wall with gap on the left
      box(150, 250, 210, 12),
      // Left ramp going down-right
      ...ramp(40, 270, 9, 16, 10),
      // Layer 3 — gap on right again
      box(0, 410, 230, 12),
      // Trap pocket bottom-left
      box(0, 410, 12, 70),
      box(40, 470, 80, 12),
      // Final right-side funnel
      box(245, 410, 10, 70),
      // Bottom rails
      box(120, 470, 130, 12),
      box(310, 470, 50, 12),
    ],
    goal: goalBox(280, 478, 100, 50),
    entries: entries([8, 9]),
  },

  // --- Level 5: Le Labyrinthe de Versailles (hard) -----------------------
  // Full plinko + corridors. Two valid paths converge at centre.
  {
    ...LEVEL_BASE,
    id: 'labyrinthe-versailles',
    name: 'Le Labyrinthe de Versailles',
    difficulty: 'hard',
    unlockCost: 25,
    walls: [
      // Layer 1 — pegs to scatter
      peg(54, 60, 14),
      peg(126, 60, 14),
      peg(198, 60, 14),
      peg(270, 60, 14),
      // Layer 2 — horizontal walls with two gaps
      box(0, 130, 90, 12),
      box(140, 130, 90, 12),
      box(290, 130, 70, 12),
      // Layer 3 — pegs offset
      peg(90, 170, 14),
      peg(180, 170, 14),
      peg(290, 170, 14),
      // Layer 4 — vertical channel walls
      box(50, 210, 10, 80),
      box(140, 210, 10, 80),
      box(220, 210, 10, 80),
      box(310, 210, 10, 80),
      // Layer 5 — partial caps
      box(0, 290, 60, 12),
      box(150, 290, 60, 12),
      box(220, 290, 90, 12),
      // Layer 6 — diagonal ramps redirecting toward centre
      ...ramp(60, 320, 5, 14, 10),
      ...ramp(310, 320, 5, -14, 10),
      // Layer 7 — bottom funnel walls
      box(70, 410, 10, 60),
      box(280, 410, 10, 60),
      // Bottom rails
      box(0, 470, 80, 12),
      box(280, 470, 80, 12),
    ],
    goal: goalBox(W / 2, 478, 180, 50),
    entries: entries([2, 6]),
  },
];

export function getLevel(index: number): LabyrinthLevel {
  return LABYRINTH_LEVELS[index % LABYRINTH_LEVELS.length];
}

export function levelCount(): number {
  return LABYRINTH_LEVELS.length;
}
