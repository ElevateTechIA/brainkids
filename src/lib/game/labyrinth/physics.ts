import type { BallState, Goal, Wall } from './types';

export const GRAVITY = 0.22;
export const FRICTION = 0.9985;
export const RESTITUTION = 0.42;
export const MAX_VELOCITY = 12;
export const SUBSTEPS = 4;
export const STUCK_VELOCITY = 0.35;
export const STUCK_FRAMES = 90;

export function stepBall(
  ball: BallState,
  walls: Wall[],
  canvasW: number,
) {
  ball.vy += GRAVITY;
  ball.vx *= FRICTION;
  ball.vy *= FRICTION;
  ball.vx = clamp(ball.vx, -MAX_VELOCITY, MAX_VELOCITY);
  ball.vy = clamp(ball.vy, -MAX_VELOCITY, MAX_VELOCITY);

  for (let s = 0; s < SUBSTEPS; s++) {
    ball.x += ball.vx / SUBSTEPS;
    ball.y += ball.vy / SUBSTEPS;

    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = -ball.vx * RESTITUTION;
    }
    if (ball.x + ball.radius > canvasW) {
      ball.x = canvasW - ball.radius;
      ball.vx = -ball.vx * RESTITUTION;
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy * RESTITUTION;
    }
    // bottom: not clamped — used to detect "out of bounds"

    for (const w of walls) {
      resolveCircleAabb(ball, w);
    }
  }
}

function resolveCircleAabb(ball: BallState, w: Wall) {
  const closestX = clamp(ball.x, w.x, w.x + w.w);
  const closestY = clamp(ball.y, w.y, w.y + w.h);
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= ball.radius * ball.radius) return;

  const dist = Math.sqrt(distSq) || 0.0001;
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = ball.radius - dist;
  ball.x += nx * overlap;
  ball.y += ny * overlap;
  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + RESTITUTION) * vn * nx;
    ball.vy -= (1 + RESTITUTION) * vn * ny;
  }
}

export function ballInGoal(ball: BallState, goal: Goal): boolean {
  return (
    ball.x + ball.radius > goal.x &&
    ball.x - ball.radius < goal.x + goal.w &&
    ball.y + ball.radius > goal.y &&
    ball.y - ball.radius < goal.y + goal.h
  );
}

export function ballOutOfBounds(ball: BallState, canvasH: number): boolean {
  return ball.y - ball.radius > canvasH + 30;
}

export function ballSpeed(ball: BallState): number {
  return Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
