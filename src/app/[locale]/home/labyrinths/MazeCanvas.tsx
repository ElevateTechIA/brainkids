'use client';

import { useEffect, useRef } from 'react';
import {
  ballInGoal,
  ballOutOfBounds,
  ballSpeed,
  STUCK_FRAMES,
  STUCK_VELOCITY,
  stepBall,
} from '@/lib/game/labyrinth/physics';
import type {
  AttemptOutcome,
  BallState,
  LabyrinthLevel,
} from '@/lib/game/labyrinth/types';

const BALL_RADIUS = 9;

type Phase = 'aim' | 'flying' | 'done';

interface Props {
  level: LabyrinthLevel;
  themeColor: string;
  themeColorLight: string;
  isLocked: boolean;
  resetKey: number;
  onAttemptComplete: (outcome: AttemptOutcome) => void;
}

export default function MazeCanvas({
  level,
  themeColor,
  themeColorLight,
  isLocked,
  resetKey,
  onAttemptComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const phaseRef = useRef<Phase>('aim');
  const selectedEntryRef = useRef<number | null>(null);
  const ballRef = useRef<BallState | null>(null);
  const stuckCounterRef = useRef<number>(0);
  const flyStartRef = useRef<number>(0);
  const animRef = useRef<number>(0);
  const onAttemptRef = useRef(onAttemptComplete);

  useEffect(() => {
    onAttemptRef.current = onAttemptComplete;
  }, [onAttemptComplete]);

  useEffect(() => {
    phaseRef.current = 'aim';
    selectedEntryRef.current = null;
    ballRef.current = null;
    stuckCounterRef.current = 0;
  }, [level.id, resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = level.width;
    const H = level.height;

    function getCanvasCoords(evt: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const scaleX = canvas!.width / rect.width;
      const scaleY = canvas!.height / rect.height;
      return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY,
      };
    }

    function entryHit(px: number, py: number): number | null {
      for (const e of level.entries) {
        const dx = px - e.x;
        const dy = py - e.y;
        if (dx * dx + dy * dy <= 22 * 22) return e.id;
      }
      return null;
    }

    function dropBallFromEntry(entryId: number) {
      const entry = level.entries.find((e) => e.id === entryId);
      if (!entry) return;
      ballRef.current = {
        x: entry.x,
        y: entry.y + 18,
        vx: 0,
        vy: 0.6,
        radius: BALL_RADIUS,
      };
      phaseRef.current = 'flying';
      stuckCounterRef.current = 0;
      flyStartRef.current = performance.now();
    }

    function onPointerDown(evt: PointerEvent) {
      if (isLocked) return;
      if (phaseRef.current !== 'aim') return;
      const { x, y } = getCanvasCoords(evt);
      const id = entryHit(x, y);
      if (id !== null) {
        selectedEntryRef.current = id;
        dropBallFromEntry(id);
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown);

    // Drawing -------------------------------------------------------------
    function drawBackground() {
      const grad = ctx!.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fff7e6');
      grad.addColorStop(1, '#ffe1a0');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);

      // Light dot pattern
      ctx!.fillStyle = 'rgba(243, 156, 18, 0.06)';
      for (let yy = 8; yy < H; yy += 16) {
        for (let xx = (yy / 16) % 2 === 0 ? 8 : 16; xx < W; xx += 16) {
          ctx!.fillRect(xx, yy, 2, 2);
        }
      }

      // Subtle entry strip header
      ctx!.fillStyle = 'rgba(0,0,0,0.04)';
      ctx!.fillRect(0, 0, W, 50);
    }

    function drawWalls() {
      for (const w of level.walls) {
        const grad = ctx!.createLinearGradient(0, w.y, 0, w.y + w.h);
        grad.addColorStop(0, themeColor);
        grad.addColorStop(1, '#a05a00');
        ctx!.fillStyle = grad;
        ctx!.fillRect(w.x, w.y, w.w, w.h);
        ctx!.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx!.lineWidth = 1;
        ctx!.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
      }
    }

    function drawGoal() {
      const g = level.goal;
      const cx = g.x + g.w / 2;
      const cy = g.y + g.h / 2;
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 250);
      const glow = ctx!.createRadialGradient(cx, cy, 4, cx, cy, 80);
      glow.addColorStop(0, `rgba(255, 215, 64, ${0.55 * pulse})`);
      glow.addColorStop(1, 'rgba(255, 215, 64, 0)');
      ctx!.fillStyle = glow;
      ctx!.fillRect(g.x - 30, g.y - 30, g.w + 60, g.h + 60);
      ctx!.fillStyle = '#ffd93d';
      ctx!.fillRect(g.x, g.y, g.w, g.h);
      ctx!.strokeStyle = '#b8860b';
      ctx!.lineWidth = 2;
      ctx!.strokeRect(g.x, g.y, g.w, g.h);
      ctx!.fillStyle = '#5a3a00';
      ctx!.font = 'bold 22px sans-serif';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText('👑', cx, cy);
    }

    function drawEntries() {
      const sel = selectedEntryRef.current;
      const t = performance.now();
      for (const e of level.entries) {
        const isSel = sel === e.id;
        const pulse = isSel
          ? 1 + 0.18 * Math.sin(t / 120)
          : 0.85 + 0.15 * Math.sin((t + e.id * 220) / 400);
        const r = 10 * pulse;
        // hole shadow
        ctx!.fillStyle = 'rgba(0,0,0,0.18)';
        ctx!.beginPath();
        ctx!.arc(e.x, e.y + 1, r + 1, 0, Math.PI * 2);
        ctx!.fill();
        // hole rim
        ctx!.beginPath();
        ctx!.arc(e.x, e.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = isSel ? themeColor : '#ffffff';
        ctx!.fill();
        ctx!.lineWidth = isSel ? 3 : 2;
        ctx!.strokeStyle = isSel ? '#7a3e00' : themeColor;
        ctx!.stroke();
        // down arrow indicating drop direction
        ctx!.fillStyle = isSel ? '#fff' : themeColor;
        ctx!.font = 'bold 11px sans-serif';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText('▼', e.x, e.y + 0.5);
      }
    }

    function drawBall() {
      const b = ballRef.current;
      if (!b) return;
      ctx!.fillStyle = 'rgba(0,0,0,0.18)';
      ctx!.beginPath();
      ctx!.ellipse(b.x, b.y + b.radius - 1, b.radius, b.radius * 0.4, 0, 0, Math.PI * 2);
      ctx!.fill();
      const grad = ctx!.createRadialGradient(b.x - 3, b.y - 3, 2, b.x, b.y, b.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#dadada');
      grad.addColorStop(1, '#888888');
      ctx!.beginPath();
      ctx!.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx!.fillStyle = grad;
      ctx!.fill();
      ctx!.strokeStyle = '#555';
      ctx!.lineWidth = 1;
      ctx!.stroke();
    }

    function drawHint() {
      if (phaseRef.current !== 'aim') return;
      ctx!.fillStyle = 'rgba(44, 24, 16, 0.85)';
      ctx!.font = 'bold 13px sans-serif';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText('Touche une entrée — la bille tombe ▼', W / 2, 50 - 8);
    }

    function drawLockOverlay() {
      if (!isLocked) return;
      ctx!.fillStyle = 'rgba(0,0,0,0.55)';
      ctx!.fillRect(0, 0, W, H);
      ctx!.fillStyle = '#fff';
      ctx!.font = 'bold 26px sans-serif';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText('🔒', W / 2, H / 2 - 18);
      ctx!.font = 'bold 14px sans-serif';
      ctx!.fillText('Touche pour débloquer', W / 2, H / 2 + 16);
    }

    function tick() {
      if (phaseRef.current === 'flying' && ballRef.current) {
        stepBall(ballRef.current, level.walls, W);

        if (ballInGoal(ballRef.current, level.goal)) {
          phaseRef.current = 'done';
          onAttemptRef.current('won');
        } else if (ballOutOfBounds(ballRef.current, H)) {
          phaseRef.current = 'done';
          onAttemptRef.current('out');
        } else {
          const speed = ballSpeed(ballRef.current);
          if (speed < STUCK_VELOCITY) {
            stuckCounterRef.current++;
            if (stuckCounterRef.current > STUCK_FRAMES) {
              phaseRef.current = 'done';
              onAttemptRef.current('stuck');
            }
          } else {
            stuckCounterRef.current = 0;
          }
          if (performance.now() - flyStartRef.current > 14000) {
            phaseRef.current = 'done';
            onAttemptRef.current('stuck');
          }
        }
      }

      ctx!.clearRect(0, 0, W, H);
      drawBackground();
      drawWalls();
      drawGoal();
      drawEntries();
      drawBall();
      drawHint();
      drawLockOverlay();

      animRef.current = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [level, themeColor, themeColorLight, isLocked]);

  return (
    <canvas
      ref={canvasRef}
      width={level.width}
      height={level.height}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
        cursor: isLocked ? 'pointer' : 'pointer',
      }}
    />
  );
}
