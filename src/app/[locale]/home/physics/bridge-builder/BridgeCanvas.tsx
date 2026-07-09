'use client';

import { useEffect, useRef } from 'react';

export type ForceMode = 'unset' | 'tension' | 'compression';

interface BridgeCanvasProps {
  // Comma-joined member modes, left→right (e.g. "tension,compression,compression,tension").
  modes: string;
  // 0 = idle/build; each increment runs a fresh truck test.
  testToken: number;
  // Whether the current test should succeed (computed by the page).
  success: boolean;
  // Index of the first wrong member (weak link); -1 when success.
  weakIndex: number;
  labels: { tension: string; compression: string };
  onTestEnd: (success: boolean) => void;
}

// The correct force mode for each member, by geometry:
// outer members hang UP from the towers → stretched → TENSION.
// inner members prop DOWN onto the central pier → squeezed → COMPRESSION.
const CORRECT: ForceMode[] = ['tension', 'compression', 'compression', 'tension'];
const TENSION_COLOR = '#2f80ed';
const COMPRESSION_COLOR = '#e74c3c';
const TEST_DURATION = 1.9; // seconds for the truck to cross

export default function BridgeCanvas({
  modes,
  testToken,
  success,
  weakIndex,
  labels,
  onTestEnd,
}: BridgeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTestEndRef = useRef(onTestEnd);
  const labelsRef = useRef(labels);
  useEffect(() => {
    onTestEndRef.current = onTestEnd;
    labelsRef.current = labels;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const memberModes = modes.split(',') as ForceMode[];
    const testing = testToken > 0;

    let W = 0;
    let H = 0;
    let deckY = 0;
    let leftEdge = 0;
    let rightEdge = 0;
    let towerTopY = 0;
    let pierTopY = 0;
    let riverbedY = 0;
    let pierX = 0;
    const nodes: { x: number; y: number; anchor: { x: number; y: number } }[] = [];

    const cliffW = 44;

    function layout() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      deckY = Math.round(H * 0.52);
      leftEdge = cliffW;
      rightEdge = W - cliffW;
      towerTopY = deckY - 76;
      pierTopY = deckY + 58;
      riverbedY = H - 20;
      pierX = Math.round((leftEdge + rightEdge) / 2);

      const span = rightEdge - leftEdge;
      nodes.length = 0;
      for (let i = 0; i < 4; i++) {
        const x = Math.round(leftEdge + (span * (i + 1)) / 5);
        const anchor =
          CORRECT[i] === 'tension'
            ? { x: i < 2 ? leftEdge : rightEdge, y: towerTopY } // up to nearest tower
            : { x: pierX, y: pierTopY }; // down to central pier
        nodes.push({ x, y: deckY, anchor });
      }
    }

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawScene(truckX: number | null, crackAt: number | null, glow: boolean) {
      if (!ctx) return;

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#eaf4ff');
      sky.addColorStop(1, '#d3e8fb');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Water in the gap
      const water = ctx.createLinearGradient(0, deckY, 0, H);
      water.addColorStop(0, '#8fd3ff');
      water.addColorStop(1, '#4aa3e0');
      ctx.fillStyle = water;
      ctx.fillRect(leftEdge, deckY + 6, rightEdge - leftEdge, H - deckY);

      // Cliffs
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, deckY, leftEdge, H - deckY);
      ctx.fillRect(rightEdge, deckY, W - rightEdge, H - deckY);
      ctx.fillStyle = '#90c965';
      ctx.fillRect(0, deckY - 5, leftEdge, 8);
      ctx.fillRect(rightEdge, deckY - 5, W - rightEdge, 8);

      // Central pier
      ctx.fillStyle = '#b0b0bd';
      ctx.fillRect(pierX - 9, pierTopY, 18, riverbedY - pierTopY);
      ctx.strokeStyle = '#8d8d9c';
      ctx.lineWidth = 2;
      ctx.strokeRect(pierX - 9, pierTopY, 18, riverbedY - pierTopY);

      // Towers
      ctx.fillStyle = '#c2c2ce';
      ctx.fillRect(leftEdge - 6, towerTopY, 12, deckY - towerTopY);
      ctx.fillRect(rightEdge - 6, towerTopY, 12, deckY - towerTopY);
      ctx.strokeStyle = '#9a9aa8';
      ctx.strokeRect(leftEdge - 6, towerTopY, 12, deckY - towerTopY);
      ctx.strokeRect(rightEdge - 6, towerTopY, 12, deckY - towerTopY);

      // Members
      for (let i = 0; i < 4; i++) {
        const n = nodes[i];
        const mode = memberModes[i] || 'unset';
        const isWeak = crackAt !== null && i === weakIndex;
        drawMember(n.x, n.y, n.anchor.x, n.anchor.y, mode, isWeak, glow && !isWeak);
      }

      // Deck (wood beam), possibly cracked
      const deckThick = 12;
      if (crackAt === null) {
        ctx.fillStyle = glow ? '#7bd88f' : '#b5793f';
        roundRect(leftEdge, deckY - deckThick / 2, rightEdge - leftEdge, deckThick, 4);
        ctx.fill();
        ctx.strokeStyle = glow ? '#3fae5a' : '#8a5a2b';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Broken deck: two halves tilt down toward the crack
        const cx = nodes[weakIndex]?.x ?? (leftEdge + rightEdge) / 2;
        ctx.fillStyle = '#b5793f';
        ctx.save();
        ctx.translate(leftEdge, deckY);
        ctx.rotate(0.08);
        roundRect(0, -deckThick / 2, cx - leftEdge, deckThick, 4);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(rightEdge, deckY);
        ctx.rotate(-0.08);
        roundRect(-(rightEdge - cx), -deckThick / 2, rightEdge - cx, deckThick, 4);
        ctx.fill();
        ctx.restore();
        // crack spark
        ctx.fillStyle = '#ffde59';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💥', cx, deckY - 14);
        ctx.textAlign = 'start';
      }

      // Nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
      }

      // Truck
      if (truckX !== null) {
        let ty = deckY - deckThick / 2 - 20;
        let rot = 0;
        if (crackAt !== null && truckX >= (nodes[weakIndex]?.x ?? W)) {
          // fell past the crack — drop into the water, tilted
          const drop = Math.min(H - deckY, (truckX - (nodes[weakIndex]?.x ?? 0)) * 1.4 + 10);
          ty += drop;
          rot = 0.5;
        }
        drawTruck(truckX, ty, rot);
      }
    }

    function drawMember(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      mode: ForceMode,
      weak: boolean,
      glow: boolean
    ) {
      if (!ctx) return;
      if (mode === 'unset') {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#9aa0a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#6b7075';
        ctx.font = 'bold 16px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', (x1 + x2) / 2, (y1 + y2) / 2 - 4);
        ctx.textAlign = 'start';
        return;
      }
      const color = weak ? '#e74c3c' : mode === 'tension' ? TENSION_COLOR : COMPRESSION_COLOR;
      ctx.strokeStyle = glow ? '#3fae5a' : color;
      ctx.lineWidth = mode === 'compression' ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // little label chip at the midpoint
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      ctx.fillStyle = glow ? '#3fae5a' : color;
      ctx.beginPath();
      ctx.arc(mx, my, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mode === 'tension' ? 'T' : 'C', mx, my + 0.5);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }

    function drawTruck(x: number, y: number, rot: number) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      // body
      ctx.fillStyle = '#e2544c';
      roundRect(-22, -14, 30, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#3a7bd5';
      roundRect(8, -8, 14, 10, 2);
      ctx.fill();
      // wheels
      ctx.fillStyle = '#222';
      for (const wx of [-14, 0, 15]) {
        ctx.beginPath();
        ctx.arc(wx, 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ── Static build view ────────────────────────────────────────────────
    if (!testing) {
      layout();
      drawScene(null, null, false);
      const ro = new ResizeObserver(() => {
        layout();
        drawScene(null, null, false);
      });
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    // ── Test animation ───────────────────────────────────────────────────
    layout();
    let raf = 0;
    let start = 0;
    let ended = false;
    const failX = weakIndex >= 0 ? nodes[weakIndex].x : rightEdge + 40;
    const endX = success ? rightEdge + 30 : failX;

    function frame(ts: number) {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;
      const p = Math.min(elapsed / TEST_DURATION, 1);
      const truckX = leftEdge - 20 + (endX - (leftEdge - 20)) * p;

      const reached = truckX >= endX - 0.5;
      const crackAt = !success && reached ? weakIndex : null;
      const glow = success && reached;
      drawScene(truckX, crackAt, glow);

      if (reached && !ended) {
        ended = true;
        // hold the final frame briefly, then report
        setTimeout(() => onTestEndRef.current(success), 650);
      }
      if (p < 1 || (!ended && !reached)) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = requestAnimationFrame(frame); // keep drawing the result frame
      }
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [modes, testToken, success, weakIndex]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
