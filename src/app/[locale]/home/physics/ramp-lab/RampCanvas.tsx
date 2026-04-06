'use client';

import { useEffect, useRef } from 'react';

interface RampCanvasProps {
  angle: number;
  friction: number;
  ballMass: number;
  isRunning: boolean;
  onBallReachedTarget: () => void;
  onPhysicsUpdate: (speed: number, distance: number) => void;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export default function RampCanvas({
  angle,
  friction,
  ballMass,
  isRunning,
  onBallReachedTarget,
  onPhysicsUpdate,
}: RampCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const ballRef = useRef<Ball>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 12 + ballMass * 4,
  });
  const startPosRef = useRef({ x: 0, y: 0 });
  const reachedTargetRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const rampAngleRad = (angle * Math.PI) / 180;
    const rampStartX = 60;
    const rampStartY = 60;
    const rampLength = 200;
    const rampEndX = rampStartX + rampLength * Math.cos(rampAngleRad);
    const rampEndY = rampStartY + rampLength * Math.sin(rampAngleRad);
    const floorY = rampEndY;

    // Target basket
    const targetX = W - 80;
    const targetW = 50;

    const ballRadius = 12 + ballMass * 4;

    // Reset ball position
    ballRef.current = {
      x: rampStartX + ballRadius,
      y: rampStartY - ballRadius,
      vx: 0,
      vy: 0,
      radius: ballRadius,
    };
    startPosRef.current = { x: ballRef.current.x, y: ballRef.current.y };
    reachedTargetRef.current = false;

    const gravity = 0.3;
    const dt = 1;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, W, H);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#e8f4fd');
      skyGrad.addColorStop(1, '#c8e6f5');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, floorY, W, H - floorY);
      ctx.fillStyle = '#90c965';
      ctx.fillRect(0, floorY - 4, W, 8);

      // Ramp
      ctx.beginPath();
      ctx.moveTo(rampStartX, rampStartY);
      ctx.lineTo(rampEndX, rampEndY);
      ctx.lineTo(rampStartX, rampEndY);
      ctx.closePath();
      ctx.fillStyle = '#b0b0b0';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Friction indicator on ramp
      const frictionLabel = friction < 0.1 ? '🧊 Hielo' : friction < 0.25 ? '🪨 Normal' : '🏖️ Arena';
      ctx.fillStyle = '#666';
      ctx.font = '11px Nunito, sans-serif';
      ctx.fillText(frictionLabel, rampStartX + 20, rampEndY - 10);

      // Target basket
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(targetX, floorY - 40, targetW, 40);
      ctx.strokeStyle = '#f0c400';
      ctx.lineWidth = 3;
      ctx.strokeRect(targetX, floorY - 40, targetW, 40);
      ctx.fillStyle = '#333';
      ctx.font = '16px sans-serif';
      ctx.fillText('🎯', targetX + 14, floorY - 14);

      // Angle label
      ctx.fillStyle = '#6c5ce7';
      ctx.font = 'bold 13px Nunito, sans-serif';
      ctx.fillText(`${angle}°`, rampStartX + 5, rampEndY - 20);

      // Ball
      const ball = ballRef.current;
      const ballGrad = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, ball.radius);
      ballGrad.addColorStop(0, '#ff8a65');
      ballGrad.addColorStop(1, '#e64a19');
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();
      ctx.strokeStyle = '#bf360c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mass label
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.max(10, ball.radius - 2)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${ballMass}`, ball.x, ball.y);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }

    function simulate() {
      const ball = ballRef.current;

      if (!isRunning) {
        draw();
        animRef.current = requestAnimationFrame(simulate);
        return;
      }

      // Check if ball is on ramp
      const onRamp = ball.x <= rampEndX && ball.y + ball.radius < rampEndY + 5;

      if (onRamp) {
        // Gravity component along ramp
        const gAlongRamp = gravity * Math.sin(rampAngleRad);
        const frictionForce = friction * gravity * Math.cos(rampAngleRad);
        const accel = gAlongRamp - frictionForce;

        ball.vx += accel * Math.cos(rampAngleRad) * dt;
        ball.vy += accel * Math.sin(rampAngleRad) * dt;
      } else {
        // On flat ground
        ball.vy += gravity * dt;

        // Floor collision
        if (ball.y + ball.radius >= floorY) {
          ball.y = floorY - ball.radius;
          ball.vy = 0;

          // Apply ground friction
          if (Math.abs(ball.vx) > 0.1) {
            ball.vx *= (1 - friction * 0.5);
          } else {
            ball.vx = 0;
          }
        }
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Speed and distance
      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      const dist = Math.sqrt(
        (ball.x - startPosRef.current.x) ** 2 + (ball.y - startPosRef.current.y) ** 2
      );
      onPhysicsUpdate(speed, dist);

      // Check target
      if (
        !reachedTargetRef.current &&
        ball.x >= targetX &&
        ball.x <= targetX + targetW &&
        ball.y + ball.radius >= floorY - 40
      ) {
        reachedTargetRef.current = true;
        ball.vx = 0;
        ball.vy = 0;
        onBallReachedTarget();
      }

      // Stop if ball exits canvas
      if (ball.x > W + 50) {
        ball.vx = 0;
      }

      draw();
      animRef.current = requestAnimationFrame(simulate);
    }

    simulate();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [angle, friction, ballMass, isRunning, onBallReachedTarget, onPhysicsUpdate]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={300}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
