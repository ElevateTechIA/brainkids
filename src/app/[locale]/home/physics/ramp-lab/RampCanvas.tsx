'use client';

import { useEffect, useRef } from 'react';

export type RampOutcome = 'hit' | 'short' | 'stuck';

interface SurfaceLabels {
  ice: string;
  wood: string;
  sand: string;
}

interface RampCanvasProps {
  angle: number; // degrees
  friction: number; // coefficient of friction (μ)
  ballMass: number; // kg — does not affect the motion (Galileo), only ball size
  runToken: number; // 0 = idle; each increment launches a fresh run
  surfaceLabels: SurfaceLabels;
  onRunEnd: (outcome: RampOutcome) => void;
  onPhysicsUpdate: (speedMs: number, distanceM: number) => void;
}

// World scale: real units so the HUD readings (m/s, m) are true
const SCALE = 50; // px per meter
const G = 9.81; // m/s²
const RAMP_LEN_M = 4; // ramp length in meters (200 px)
const STEP = 1 / 120; // fixed physics timestep, frame-rate independent
const STUCK_DELAY = 0.7; // s before reporting a ball that never moved

type Mode = 'idle' | 'ramp' | 'floor' | 'done';

interface Sim {
  mode: Mode;
  s: number; // distance along ramp (m)
  x: number; // ball center x on floor (px)
  v: number; // speed along current surface (m/s)
  traveled: number; // total path length (m)
  rot: number; // ball rotation (rad), rolling without slipping
  stuckTime: number;
  trail: { x: number; y: number }[];
  trailClock: number;
}

export default function RampCanvas({
  angle,
  friction,
  ballMass,
  runToken,
  surfaceLabels,
  onRunEnd,
  onPhysicsUpdate,
}: RampCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Callbacks and labels live in refs so the sim effect never resets because
  // a parent render produced new function identities.
  const onRunEndRef = useRef(onRunEnd);
  const onPhysicsUpdateRef = useRef(onPhysicsUpdate);
  const labelsRef = useRef(surfaceLabels);
  useEffect(() => {
    onRunEndRef.current = onRunEnd;
    onPhysicsUpdateRef.current = onPhysicsUpdate;
    labelsRef.current = surfaceLabels;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const theta = (angle * Math.PI) / 180;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const rampLenPx = RAMP_LEN_M * SCALE;
    const ballR = 12 + ballMass * 4; // px

    let W = 0;
    let H = 0;
    let floorY = 0;
    let rampTopX = 0;
    let rampTopY = 0;
    let rampBaseX = 0;
    let targetX = 0;
    const targetW = 56;
    const targetH = 44;

    // runToken > 0 means "run"; the page resets it to 0 when a run ends, so
    // slider tweaks afterwards never relaunch the ball on their own.
    const sim: Sim = {
      mode: runToken > 0 ? 'ramp' : 'idle',
      s: 0,
      x: 0,
      v: 0,
      traveled: 0,
      rot: 0,
      stuckTime: 0,
      trail: [],
      trailClock: 0,
    };

    function layout() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      floorY = H - 50;
      rampTopX = 36;
      rampTopY = floorY - rampLenPx * sinT;
      rampBaseX = rampTopX + rampLenPx * cosT;
      targetX = W - 96;
    }

    // Ball center for the current sim state
    function ballCenter(): { x: number; y: number } {
      if (sim.mode === 'ramp' || sim.mode === 'idle') {
        const px = rampTopX + sim.s * SCALE * cosT;
        const py = rampTopY + sim.s * SCALE * sinT;
        // offset perpendicular to the ramp surface so the ball sits on it
        return { x: px + sinT * ballR, y: py - cosT * ballR };
      }
      return { x: sim.x, y: floorY - ballR };
    }

    function surfaceLabel(): string {
      const l = labelsRef.current;
      return friction < 0.1 ? `🧊 ${l.ice}` : friction < 0.25 ? `🪵 ${l.wood}` : `🏖️ ${l.sand}`;
    }

    function draw() {
      if (!ctx) return;
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#e8f4fd');
      sky.addColorStop(1, '#c8e6f5');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, floorY, W, H - floorY);
      ctx.fillStyle = '#90c965';
      ctx.fillRect(0, floorY - 4, W, 8);

      // Ramp (right triangle: vertical back, hypotenuse down to the floor)
      ctx.beginPath();
      ctx.moveTo(rampTopX, rampTopY);
      ctx.lineTo(rampBaseX, floorY);
      ctx.lineTo(rampTopX, floorY);
      ctx.closePath();
      ctx.fillStyle = '#b8b8c4';
      ctx.fill();
      ctx.strokeStyle = '#8d8d9c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Angle arc at the base of the ramp
      ctx.beginPath();
      ctx.arc(rampBaseX, floorY, 26, Math.PI, Math.PI + theta, false);
      ctx.strokeStyle = '#6c5ce7';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#6c5ce7';
      ctx.font = 'bold 13px Nunito, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${angle}°`, rampBaseX - 30, floorY - 10);
      ctx.textAlign = 'start';

      // Surface (friction) label
      ctx.fillStyle = '#555';
      ctx.font = '12px Nunito, sans-serif';
      ctx.fillText(surfaceLabel(), rampTopX, floorY + 30);

      // Basket: open on top, with walls, so the ball can land inside
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(targetX, floorY - 8, targetW, 8); // base
      ctx.fillRect(targetX, floorY - targetH, 6, targetH); // left wall
      ctx.fillRect(targetX + targetW - 6, floorY - targetH, 6, targetH); // right wall
      ctx.strokeStyle = '#f0c400';
      ctx.lineWidth = 2;
      ctx.strokeRect(targetX, floorY - targetH, targetW, targetH);
      ctx.font = '16px sans-serif';
      ctx.fillText('🎯', targetX + targetW / 2 - 9, floorY - targetH - 8);

      // Motion trail — dots spaced farther apart mean the ball moved faster
      for (let i = 0; i < sim.trail.length; i++) {
        const p = sim.trail[i];
        const alpha = ((i + 1) / sim.trail.length) * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108, 92, 231, ${alpha})`;
        ctx.fill();
      }

      // Ball
      const c = ballCenter();
      const grad = ctx.createRadialGradient(c.x - 3, c.y - 3, 2, c.x, c.y, ballR);
      grad.addColorStop(0, '#ff8a65');
      grad.addColorStop(1, '#e64a19');
      ctx.beginPath();
      ctx.arc(c.x, c.y, ballR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#bf360c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rolling marker: a dot near the rim that spins with the ball
      const mx = c.x + Math.cos(sim.rot) * ballR * 0.55;
      const my = c.y + Math.sin(sim.rot) * ballR * 0.55;
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(2.5, ballR * 0.16), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();

      // Mass label
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.max(10, ballR - 4)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${ballMass}`, c.x, c.y);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }

    function endRun(outcome: RampOutcome) {
      sim.mode = 'done';
      onPhysicsUpdateRef.current(Math.round(sim.v * 10) / 10, Math.round(sim.traveled * 10) / 10);
      onRunEndRef.current(outcome);
    }

    // One fixed physics step. Acceleration on the ramp: a = g(sinθ − μcosθ).
    // Mass cancels out — Galileo — so the mass slider changes size only.
    function stepPhysics() {
      if (sim.mode === 'ramp') {
        const a = G * (sinT - friction * cosT);
        if (sim.v === 0 && a <= 0) {
          // Static friction wins: the ball never starts moving
          sim.stuckTime += STEP;
          if (sim.stuckTime >= STUCK_DELAY) endRun('stuck');
          return;
        }
        sim.v += a * STEP;
        const ds = sim.v * STEP;
        sim.s += ds;
        sim.traveled += ds;
        sim.rot += (ds * SCALE) / ballR;
        if (sim.s >= RAMP_LEN_M) {
          // Reached the bottom: speed carries onto the floor horizontally
          const overshoot = sim.s - RAMP_LEN_M;
          sim.mode = 'floor';
          sim.x = rampBaseX + sinT * ballR + overshoot * SCALE;
        }
      } else if (sim.mode === 'floor') {
        // Kinetic friction decelerates the ball: a = −μg
        sim.v = Math.max(0, sim.v - friction * G * STEP);
        const ds = sim.v * STEP;
        sim.x += ds * SCALE;
        sim.traveled += ds;
        sim.rot += (ds * SCALE) / ballR;

        const inBasket = sim.x + ballR >= targetX + 6 && sim.x - ballR <= targetX + targetW - 6;
        if (inBasket) {
          sim.x = targetX + targetW / 2; // settle in the middle of the basket
          sim.v = 0;
          endRun('hit');
        } else if (sim.v === 0) {
          endRun('short');
        } else if (sim.x - ballR > W) {
          endRun('short'); // safety: should not happen, basket blocks the path
        }
      }
    }

    let raf = 0;
    let lastTs = 0;
    let acc = 0;
    let hudClock = 0;

    function frame(ts: number) {
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
      lastTs = ts;

      if (sim.mode === 'ramp' || sim.mode === 'floor') {
        acc += dt;
        while (acc >= STEP && (sim.mode === 'ramp' || sim.mode === 'floor')) {
          acc -= STEP;
          stepPhysics();
        }
        // Breadcrumb trail every 90 ms while moving
        sim.trailClock += dt;
        if (sim.v > 0 && sim.trailClock >= 0.09) {
          sim.trailClock = 0;
          sim.trail.push(ballCenter());
          if (sim.trail.length > 40) sim.trail.shift();
        }
        // HUD readings ~10×/s
        hudClock += dt;
        if (hudClock >= 0.1) {
          hudClock = 0;
          onPhysicsUpdateRef.current(
            Math.round(sim.v * 10) / 10,
            Math.round(sim.traveled * 10) / 10
          );
        }
      }

      draw();
      raf = requestAnimationFrame(frame);
    }

    layout();
    const ro = new ResizeObserver(() => {
      layout();
      draw();
    });
    ro.observe(canvas);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [angle, friction, ballMass, runToken]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
