"use client";

import { useEffect, useMemo, useState } from "react";

type Node = { id: number; x: number; y: number; hash: string; online: boolean };
type Edge = { from: number; to: number; delay: number };

function buildNetwork(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    { id: 0, x: 8, y: 18, hash: "142.58 TH/s", online: true },
    { id: 1, x: 22, y: 32, hash: "98.21 TH/s", online: true },
    { id: 2, x: 38, y: 14, hash: "256.04 TH/s", online: true },
    { id: 3, x: 52, y: 28, hash: "187.33 TH/s", online: true },
    { id: 4, x: 68, y: 16, hash: "312.77 TH/s", online: true },
    { id: 5, x: 84, y: 30, hash: "76.45 TH/s", online: true },
    { id: 6, x: 14, y: 52, hash: "203.11 TH/s", online: true },
    { id: 7, x: 30, y: 58, hash: "164.89 TH/s", online: false },
    { id: 8, x: 48, y: 48, hash: "421.06 TH/s", online: true },
    { id: 9, x: 64, y: 54, hash: "118.72 TH/s", online: true },
    { id: 10, x: 78, y: 46, hash: "289.55 TH/s", online: true },
    { id: 11, x: 92, y: 58, hash: "95.38 TH/s", online: true },
    { id: 12, x: 20, y: 72, hash: "156.20 TH/s", online: true },
    { id: 13, x: 44, y: 68, hash: "334.18 TH/s", online: true },
    { id: 14, x: 70, y: 70, hash: "211.44 TH/s", online: true },
  ];

  const pairs: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
    [0, 6], [1, 7], [2, 3], [3, 8], [4, 9], [5, 10], [5, 11],
    [6, 7], [7, 8], [8, 9], [9, 10], [10, 11],
    [6, 12], [8, 13], [9, 14], [10, 14], [12, 13], [13, 14],
    [1, 8], [3, 9], [6, 13],
  ];

  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const [a, b] of pairs) {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ from: a, to: b, delay: (a + b) * 0.35 });
  }

  return { nodes, edges };
}

const HEX_STREAMS = [
  "0x4f2a8b…a91c",
  "blk #892441",
  "nonce 0x00f3",
  "sha256 ✓",
  "merkle ok",
  "diff 68.2T",
  "pool sync",
  "hash ✓",
];

const RIG_COUNT = 6;

function MiningRig({ index }: { index: number }) {
  const delay = index * 0.4;
  return (
    <g transform={`translate(${index * 160 + 40}, 0)`}>
      {/* Rack frame */}
      <rect x="0" y="20" width="130" height="100" rx="4" fill="#0a1628" stroke="#22d3ee" strokeOpacity="0.25" strokeWidth="1" />
      {/* ASIC rows */}
      {[0, 1, 2, 3].map((row) => (
        <g key={row} transform={`translate(8, ${32 + row * 22})`}>
          <rect width="114" height="16" rx="2" fill="#0d1424" stroke="#f5a623" strokeOpacity="0.15" strokeWidth="0.5" />
          {/* Fan */}
          <circle cx="102" cy="8" r="5" fill="none" stroke="#22d3ee" strokeOpacity="0.5" strokeWidth="1" className="hash-rig-fan" style={{ animationDelay: `${delay + row * 0.1}s` }} />
          {/* LEDs */}
          <circle cx="6" cy="8" r="2" fill="#10b981" className="hash-rig-led" style={{ animationDelay: `${delay + row * 0.25}s` }} />
          <circle cx="14" cy="8" r="2" fill="#f5a623" className="hash-rig-led" style={{ animationDelay: `${delay + row * 0.35}s` }} />
          <rect x="22" y="5" width="70" height="6" rx="1" fill="#22d3ee" fillOpacity="0.08" />
          {/* Hash bar */}
          <rect x="22" y="5" width="40" height="6" rx="1" fill="#f5a623" fillOpacity="0.35" className="hash-rig-bar" style={{ animationDelay: `${delay}s` }} />
        </g>
      ))}
      {/* Top antenna / network node */}
      <circle cx="65" cy="12" r="6" fill="#01050d" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.6" />
      <circle cx="65" cy="12" r="3" fill="#22d3ee" fillOpacity="0.4" className="hash-node-pulse" style={{ animationDelay: `${delay}s` }} />
      {/* Uplink line */}
      <line x1="65" y1="18" x2="65" y2="20" stroke="#22d3ee" strokeOpacity="0.4" strokeWidth="1" />
    </g>
  );
}

export default function HashNetworkBackground() {
  const { nodes, edges } = useMemo(() => buildNetwork(), []);
  const [streams, setStreams] = useState<{ id: number; left: number; text: string; delay: number; duration: number }[]>([]);

  useEffect(() => {
    setStreams(
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: 2 + (i % 7) * 14 + Math.random() * 4,
        text: HEX_STREAMS[i % HEX_STREAMS.length],
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 5,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden hash-bg-base" aria-hidden>
      {/* Perspective datacenter floor grid */}
      <div className="absolute inset-0 hash-perspective-grid" />

      {/* Network topology mesh */}
      <svg
        className="absolute inset-0 w-full h-full hash-network-svg"
        viewBox="0 0 100 80"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hashLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
          </linearGradient>
          <filter id="hashGlow">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Network edges */}
        {edges.map(({ from, to, delay }, i) => {
          const a = nodes[from];
          const b = nodes[to];
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#hashLineGrad)"
              strokeWidth="0.12"
              strokeOpacity="0.35"
              className="hash-network-line"
              style={{ animationDelay: `${delay}s` }}
            />
          );
        })}

        {/* Data packets traveling along random edges */}
        {edges.filter((_, i) => i % 3 === 0).map(({ from, to, delay }, i) => {
          const a = nodes[from];
          const b = nodes[to];
          return (
            <circle
              key={`pkt-${i}`}
              r="0.35"
              fill="#f5a623"
              className="hash-data-packet"
              style={{ animationDelay: `${delay + i * 0.7}s` }}
            >
              <animateMotion
                dur={`${3 + (i % 4)}s`}
                repeatCount="indefinite"
                path={`M${a.x},${a.y} L${b.x},${b.y}`}
              />
            </circle>
          );
        })}

        {/* Network nodes (mining machines on the mesh) */}
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            {/* Outer ring */}
            <circle
              r="1.2"
              fill="none"
              stroke={node.online ? "#22d3ee" : "#475569"}
              strokeWidth="0.15"
              strokeOpacity="0.5"
              className="hash-node-ring"
              style={{ animationDelay: `${node.id * 0.3}s` }}
            />
            {/* Core */}
            <circle
              r="0.55"
              fill={node.online ? "#10b981" : "#64748b"}
              fillOpacity="0.8"
              filter="url(#hashGlow)"
              className="hash-node-core"
              style={{ animationDelay: `${node.id * 0.25}s` }}
            />
            {/* Mini rig icon */}
            <rect x="-0.7" y="-0.35" width="1.4" height="0.7" rx="0.1" fill="#0d1424" stroke="#f5a623" strokeWidth="0.06" strokeOpacity="0.5" />
          </g>
        ))}
      </svg>

      {/* Floating hashrate readouts */}
      {nodes.filter((n) => n.online).slice(0, 8).map((node, i) => (
        <div
          key={node.id}
          className="hash-float-label"
          style={{
            left: `${node.x}%`,
            top: `${node.y * 0.85 + 2}%`,
            animationDelay: `${i * 1.1}s`,
          }}
        >
          <span className="hash-float-dot" />
          {node.hash}
        </div>
      ))}

      {/* Vertical data streams (block/hex feed) */}
      {streams.map((s) => (
        <div
          key={s.id}
          className="hash-data-stream"
          style={{
            left: `${s.left}%`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        >
          {s.text}
        </div>
      ))}

      {/* Mining farm rack row — bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none hash-rig-row"
        viewBox="0 0 960 130"
        preserveAspectRatio="xMidYMax meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rigFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#01050d" stopOpacity="0" />
            <stop offset="100%" stopColor="#01050d" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {Array.from({ length: RIG_COUNT }).map((_, i) => (
          <MiningRig key={i} index={i} />
        ))}
        {/* Network backbone connecting rigs */}
        <line x1="105" y1="18" x2="855" y2="18" stroke="#22d3ee" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 6" className="hash-backbone-line" />
        <rect x="0" y="0" width="960" height="130" fill="url(#rigFade)" />
      </svg>

      {/* Ambient glow pools */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[300px] rounded-full bg-amber-500/[0.05] blur-3xl" />
      <div className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-emerald-500/[0.03] blur-3xl" />

      {/* Horizontal hashrate scan line */}
      <div className="hash-scan-line" />

      {/* Readability scrim — content stays legible */}
      <div className="absolute inset-0 hash-bg-scrim" />
    </div>
  );
}
