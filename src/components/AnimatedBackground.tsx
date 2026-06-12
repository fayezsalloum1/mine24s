"use client";

/** Fixed layout — deterministic for SSR and zero layout shift */
const NODES = [
  { id: 0, x: 6, y: 10, size: 6, delay: 0 },
  { id: 1, x: 18, y: 22, size: 5, delay: 0.4 },
  { id: 2, x: 32, y: 8, size: 7, delay: 0.8 },
  { id: 3, x: 48, y: 18, size: 5, delay: 1.2 },
  { id: 4, x: 62, y: 12, size: 6, delay: 0.2 },
  { id: 5, x: 78, y: 24, size: 5, delay: 0.6 },
  { id: 6, x: 92, y: 14, size: 4, delay: 1.0 },
  { id: 7, x: 12, y: 42, size: 5, delay: 1.4 },
  { id: 8, x: 28, y: 52, size: 6, delay: 0.3 },
  { id: 9, x: 44, y: 38, size: 7, delay: 0.7 },
  { id: 10, x: 58, y: 48, size: 5, delay: 1.1 },
  { id: 11, x: 72, y: 40, size: 6, delay: 0.5 },
  { id: 12, x: 86, y: 55, size: 5, delay: 0.9 },
  { id: 13, x: 24, y: 72, size: 4, delay: 1.3 },
  { id: 14, x: 68, y: 68, size: 6, delay: 0.1 },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
  [0, 7], [1, 8], [3, 9], [4, 10], [5, 11], [6, 12],
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 12],
  [7, 13], [9, 14], [10, 14], [8, 9], [3, 10], [1, 9],
];

const COINS = [
  { symbol: "₿", left: 8, delay: 0, duration: 22, size: 28 },
  { symbol: "₮", left: 22, delay: 4, duration: 26, size: 24 },
  { symbol: "◎", left: 38, delay: 8, duration: 24, size: 26 },
  { symbol: "₿", left: 52, delay: 2, duration: 28, size: 22 },
  { symbol: "₮", left: 66, delay: 6, duration: 23, size: 25 },
  { symbol: "◎", left: 78, delay: 10, duration: 27, size: 24 },
  { symbol: "₿", left: 88, delay: 3, duration: 25, size: 20 },
  { symbol: "◎", left: 45, delay: 12, duration: 30, size: 22 },
];

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: (i * 17 + 7) % 98,
  top: (i * 23 + 11) % 95,
  delay: (i % 5) * 1.2,
  duration: 12 + (i % 6) * 2,
  dx: i % 2 === 0 ? 18 : -14,
  dy: i % 3 === 0 ? -12 : 16,
}));

const MATRIX_COLS = [
  { left: 4, delay: 0, chars: "01001101" },
  { left: 14, delay: 2, chars: "11010010" },
  { left: 26, delay: 4, chars: "00110101" },
  { left: 38, delay: 1, chars: "10101001" },
  { left: 52, delay: 3, chars: "01100110" },
  { left: 66, delay: 5, chars: "10011010" },
  { left: 78, delay: 2, chars: "01010111" },
  { left: 90, delay: 4, chars: "11001100" },
];

export default function AnimatedBackground() {
  return (
    <>
      <style>{`
        .anim-bg-root {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          background: #0a0f1e;
        }

        .anim-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .anim-bg-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(10, 15, 30, 0.55) 0%,
            rgba(10, 15, 30, 0.25) 40%,
            rgba(10, 15, 30, 0.45) 100%
          );
        }

        .anim-bg-network {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.85;
        }

        .anim-bg-line {
          stroke: rgba(245, 158, 11, 0.2);
          stroke-width: 0.15;
          stroke-dasharray: 1.5 2;
          animation: anim-line-flow 5s linear infinite;
        }

        @keyframes anim-line-flow {
          0% { stroke-dashoffset: 0; opacity: 0.15; }
          50% { opacity: 0.35; }
          100% { stroke-dashoffset: -8; opacity: 0.15; }
        }

        .anim-bg-node {
          position: absolute;
          border-radius: 50%;
          background: #f59e0b;
          transform: translate(-50%, -50%);
          animation: anim-node-pulse 3.5s ease-in-out infinite;
        }

        @keyframes anim-node-pulse {
          0%, 100% {
            box-shadow: 0 0 6px 1px rgba(245, 158, 11, 0.35);
            opacity: 0.55;
          }
          50% {
            box-shadow: 0 0 14px 3px rgba(245, 158, 11, 0.55);
            opacity: 0.9;
          }
        }

        .anim-bg-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.3);
          animation: anim-particle-drift linear infinite;
        }

        @keyframes anim-particle-drift {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.2;
          }
          50% {
            transform: translate(var(--dx, 10px), var(--dy, 10px));
            opacity: 0.55;
          }
        }

        .anim-bg-coin {
          position: absolute;
          bottom: -10%;
          font-weight: 700;
          color: rgba(245, 158, 11, 0.15);
          animation: anim-coin-rise linear infinite;
          user-select: none;
        }

        @keyframes anim-coin-rise {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          8% { opacity: 0.3; }
          92% { opacity: 0.3; }
          100% {
            transform: translateY(-115vh) rotate(360deg);
            opacity: 0;
          }
        }

        .anim-bg-matrix-col {
          position: absolute;
          top: -20%;
          font-family: ui-monospace, monospace;
          font-size: 11px;
          line-height: 1.6;
          letter-spacing: 0.15em;
          color: rgba(16, 185, 129, 0.06);
          writing-mode: vertical-rl;
          white-space: nowrap;
          animation: anim-matrix-fall linear infinite;
        }

        @keyframes anim-matrix-fall {
          0% { transform: translateY(-10%); }
          100% { transform: translateY(110vh); }
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-bg-line,
          .anim-bg-node,
          .anim-bg-particle,
          .anim-bg-coin,
          .anim-bg-matrix-col {
            animation: none !important;
          }
        }
      `}</style>

      <div className="anim-bg-root" aria-hidden>
        <div className="anim-bg-grid" />

        {MATRIX_COLS.map((col) => (
          <div
            key={col.left}
            className="anim-bg-matrix-col"
            style={{
              left: `${col.left}%`,
              animationDuration: "28s",
              animationDelay: `${col.delay}s`,
            }}
          >
            {(col.chars + col.chars + col.chars).split("").join(" ")}
          </div>
        ))}

        <svg className="anim-bg-network" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {EDGES.map(([a, b], i) => {
            const na = NODES[a];
            const nb = NODES[b];
            return (
              <line
                key={i}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                className="anim-bg-line"
                style={{ animationDelay: `${(i % 6) * 0.6}s` }}
              />
            );
          })}
        </svg>

        {NODES.map((node) => (
          <span
            key={node.id}
            className="anim-bg-node"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: node.size,
              height: node.size,
              animationDelay: `${node.delay}s`,
            }}
          />
        ))}

        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="anim-bg-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              ["--dx" as string]: `${p.dx}px`,
              ["--dy" as string]: `${p.dy}px`,
            }}
          />
        ))}

        {COINS.map((coin, i) => (
          <span
            key={i}
            className="anim-bg-coin"
            style={{
              left: `${coin.left}%`,
              fontSize: coin.size,
              animationDuration: `${coin.duration}s`,
              animationDelay: `${coin.delay}s`,
            }}
          >
            {coin.symbol}
          </span>
        ))}

        <div className="anim-bg-scrim" />
      </div>
    </>
  );
}
