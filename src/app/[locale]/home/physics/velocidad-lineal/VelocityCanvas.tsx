'use client';

import { useEffect, useRef } from 'react';

interface VelocityCanvasProps {
  velocity: number; // m/s
  distanceM: number; // total track length in meters
  runToken: number; // 0 = idle; each increment runs a fresh drive
  onProgress: (timeSec: number, distM: number) => void;
  onArrive: (timeSec: number) => void;
}

export default function VelocityCanvas({
  velocity,
  distanceM,
  runToken,
  onProgress,
  onArrive,
}: VelocityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onProgressRef = useRef(onProgress);
  const onArriveRef = useRef(onArrive);
  useEffect(() => {
    onProgressRef.current = onProgress;
    onArriveRef.current = onArrive;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const running = runToken > 0;
    let W = 0;
    let H = 0;
    let roadY = 0;
    let startX = 0;
    let endX = 0;
    let pxPerM = 0;

    function layout() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      roadY = Math.round(H * 0.62);
      startX = 44;
      endX = W - 44;
      pxPerM = (endX - startX) / distanceM;
    }

    function drawCar(x: number, y: number) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      // body
      ctx.fillStyle = '#6c5ce7';
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-16, -12);
      ctx.lineTo(6, -12);
      ctx.lineTo(12, -2);
      ctx.lineTo(22, 0);
      ctx.closePath();
      ctx.fill();
      // window
      ctx.fillStyle = '#c8c0ff';
      ctx.fillRect(-12, -10, 12, 8);
      // wheels
      ctx.fillStyle = '#222';
      for (const wx of [-12, 12]) {
        ctx.beginPath();
        ctx.arc(wx, 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function draw(carDistM: number) {
      if (!ctx) return;
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#eaf4ff');
      sky.addColorStop(1, '#d6ecff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Grass
      ctx.fillStyle = '#bfe6a0';
      ctx.fillRect(0, roadY + 16, W, H - roadY - 16);

      // Road
      ctx.fillStyle = '#4a4f57';
      ctx.fillRect(startX - 8, roadY, endX - startX + 16, 16);

      // Distance ticks every 5 m
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#3a3f47';
      ctx.font = '11px Nunito, sans-serif';
      ctx.textAlign = 'center';
      for (let m = 0; m <= distanceM; m += 5) {
        const x = startX + m * pxPerM;
        ctx.beginPath();
        ctx.moveTo(x, roadY);
        ctx.lineTo(x, roadY + 16);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillText(`${m}m`, x, roadY + 32);
      }
      ctx.textAlign = 'start';

      // Start line
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(startX - 3, roadY - 22, 4, 22);

      // Finish flag
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(endX, roadY - 40, 3, 40);
      ctx.fillStyle = '#333';
      ctx.beginPath();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          if ((r + c) % 2 === 0) ctx.rect(endX + 3 + c * 9, roadY - 40 + r * 7, 9, 7);
        }
      }
      ctx.fill();

      // Car
      const carX = startX + carDistM * pxPerM;
      drawCar(carX, roadY);

      // Speed flag above the car
      ctx.fillStyle = '#6c5ce7';
      ctx.font = 'bold 13px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${velocity} m/s`, carX, roadY - 22);
      ctx.textAlign = 'start';
    }

    layout();

    if (!running) {
      draw(0);
      const ro = new ResizeObserver(() => {
        layout();
        draw(0);
      });
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    // Drive animation
    let raf = 0;
    let start = 0;
    let arrived = false;
    let hudClock = 0;

    function frame(ts: number) {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;
      let dist = velocity * elapsed;
      if (dist >= distanceM) {
        dist = distanceM;
        if (!arrived) {
          arrived = true;
          const t = distanceM / velocity;
          onProgressRef.current(Math.round(t * 100) / 100, Math.round(dist * 10) / 10);
          onArriveRef.current(Math.round(t * 100) / 100);
        }
      } else {
        hudClock += 0.016;
        if (hudClock >= 0.1) {
          hudClock = 0;
          onProgressRef.current(Math.round(elapsed * 100) / 100, Math.round(dist * 10) / 10);
        }
      }
      draw(dist);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [velocity, distanceM, runToken]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
