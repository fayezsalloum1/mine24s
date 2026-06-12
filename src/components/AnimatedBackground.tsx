"use client";

import { useEffect, useRef } from "react";

const CHARS = "01₿Ξ₮◎#@!01₿01Ξ₮01";
const FONT_SIZE = 14;
const BG = "#030a0f";

type Machine = {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  leds: boolean[];
  ledTimer: number;
  opacity: number;
  hashRate: number;
};

type BtcSymbol = {
  x: number;
  y: number;
  size: number;
  rot: number;
  rotSpeed: number;
  vy: number;
  opacity: number;
};

type Node = {
  x: number;
  y: number;
  r: number;
  pulse: number;
  pulseSpeed: number;
};

function createMachines(w: number, h: number, count: number): Machine[] {
  const spacing = w / (count + 1);
  return Array.from({ length: count }, (_, i) => ({
    x: spacing * (i + 1) - 45,
    y: h * 0.55 + Math.random() * h * 0.25,
    w: 90,
    h: 50,
    vy: -0.2 - Math.random() * 0.2,
    leds: Array.from({ length: 5 }, () => Math.random() > 0.5),
    ledTimer: 0,
    opacity: 0.25 + Math.random() * 0.25,
    hashRate: 90 + Math.random() * 10,
  }));
}

function createBtcs(w: number, h: number, count: number): BtcSymbol[] {
  const spacing = w / (count + 1);
  return Array.from({ length: count }, (_, i) => ({
    x: spacing * (i + 1),
    y: 50 + Math.random() * h * 0.6,
    size: 40 + Math.random() * 50,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.005,
    vy: -0.15 - Math.random() * 0.1,
    opacity: 0.04 + Math.random() * 0.06,
  }));
}

function createNodes(w: number, h: number, count: number): Node[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.7,
    r: 3 + Math.random() * 3,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.03 + Math.random() * 0.02,
  }));
}

function drawMachine(
  ctx: CanvasRenderingContext2D,
  m: Machine,
  frame: number
) {
  ctx.save();
  ctx.globalAlpha = m.opacity;

  ctx.fillStyle = "#0d1f2d";
  ctx.strokeStyle = "#1a3a4a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(m.x, m.y, m.w, m.h, 4);
  ctx.fill();
  ctx.stroke();

  const cx = m.x + 20;
  const cy = m.y + m.h / 2;
  ctx.strokeStyle = "#1e4a5a";
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.stroke();

  for (let a = 0; a < 4; a++) {
    const angle = (a / 4) * Math.PI * 2 + frame * 0.04;
    ctx.strokeStyle = "#2a6a7a";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 10, cy + Math.sin(angle) * 10);
    ctx.stroke();
  }

  for (let l = 0; l < m.leds.length; l++) {
    ctx.fillStyle = m.leds[l] ? "#00ff41" : "#003310";
    ctx.beginPath();
    ctx.arc(m.x + 45 + l * 8, m.y + 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = "7px 'Courier New', monospace";
  ctx.fillStyle = "#00ff41";
  ctx.fillText(`${m.hashRate.toFixed(1)} TH/s`, m.x + 40, m.y + 30);

  ctx.restore();
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cols: number[] = [];
    let machines: Machine[] = [];
    let btcs: BtcSymbol[] = [];
    let nodes: Node[] = [];
    let frame = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.offsetWidth;
      const h = wrap.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colCount = Math.floor(w / FONT_SIZE);
      cols = Array.from({ length: colCount }, () =>
        Math.floor(Math.random() * (-h / FONT_SIZE))
      );

      const machineCount = Math.max(4, Math.min(8, Math.floor(w / 180)));
      const btcCount = Math.max(4, Math.min(7, Math.floor(w / 200)));
      const nodeCount = Math.max(6, Math.min(10, Math.floor(w / 120)));

      machines = createMachines(w, h, machineCount);
      btcs = createBtcs(w, h, btcCount);
      nodes = createNodes(w, h, nodeCount);

      if (reducedMotion) {
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, w, h);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = wrap.offsetWidth;
      const h = wrap.offsetHeight;

      if (reducedMotion) {
        return;
      }

      frame++;

      ctx.fillStyle = "rgba(3,10,15,0.18)";
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
      for (let i = 0; i < cols.length; i++) {
        const y = cols[i] * FONT_SIZE;
        if (y > 0 && y < h) {
          const bright = Math.random() > 0.95;
          ctx.fillStyle = bright
            ? "#ffffff"
            : `rgba(0,${180 + Math.floor(Math.random() * 75)},${40 + Math.floor(Math.random() * 30)},${0.5 + Math.random() * 0.3})`;
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * FONT_SIZE, y);
        }
        cols[i]++;
        if (cols[i] * FONT_SIZE > h && Math.random() > 0.975) {
          cols[i] = Math.floor(Math.random() * -20);
        }
      }

      for (const b of btcs) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.font = `bold ${b.size}px 'Courier New', monospace`;
        ctx.fillStyle = `rgba(245,158,11,${b.opacity})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("₿", 0, 0);
        ctx.restore();
        b.rot += b.rotSpeed;
        b.y += b.vy;
        if (b.y < -b.size) b.y = h + b.size;
      }

      const linkDist = Math.min(220, w * 0.28);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.22;
            ctx.strokeStyle = `rgba(245,158,11,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        n.pulse += n.pulseSpeed;
        const glow = 0.35 + 0.55 * Math.sin(n.pulse);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (1 + 0.4 * Math.sin(n.pulse)), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,158,11,${glow})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 2.5 * (1 + 0.3 * Math.sin(n.pulse)), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,158,11,${glow * 0.12})`;
        ctx.fill();
      }

      for (const m of machines) {
        m.ledTimer++;
        if (m.ledTimer > 30) {
          m.ledTimer = 0;
          m.leds = m.leds.map(() => Math.random() > 0.4);
          m.hashRate = 90 + Math.random() * 10;
        }
        m.y += m.vy;
        if (m.y < -m.h - 20) {
          m.y = h + 20;
          m.x = Math.random() * (w - m.w);
        }
        drawMachine(ctx, m, frame);
      }

      const scanY = (frame * 1.5) % h;
      const grad = ctx.createLinearGradient(0, scanY - 8, 0, scanY + 8);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, "rgba(0,255,65,0.035)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 8, w, 16);

      raf = requestAnimationFrame(draw);
    };

    if (!reducedMotion) {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ background: BG }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,15,30,0.65) 0%, rgba(10,15,30,0.3) 45%, rgba(10,15,30,0.55) 100%)",
        }}
      />
    </div>
  );
}
