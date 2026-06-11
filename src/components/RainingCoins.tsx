"use client";

import { useEffect, useState } from "react";

const COINS = [
  {
    name: "bitcoin",
    src: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  },
  {
    name: "usdt",
    src: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  },
  {
    name: "solana",
    src: "https://cryptologos.cc/logos/solana-sol-logo.png",
  },
];

interface Coin {
  id: number;
  src: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

export default function RainingCoins() {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    const generated: Coin[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      src: COINS[i % COINS.length].src,
      left: Math.random() * 100,
      size: Math.floor(Math.random() * 20) + 28,
      duration: Math.random() * 6 + 5,
      delay: Math.random() * 10,
    }));
    setCoins(generated);
  }, []);

  return (
    <>
      <style>{`
        @keyframes rainFall {
          0% {
            transform: translateY(-80px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.45;
          }
          85% {
            opacity: 0.45;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }

        .rain-coins-root {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .rain-coin {
          position: absolute;
          top: 0;
          pointer-events: none;
          animation: rainFall linear infinite;
          filter: drop-shadow(0 0 4px rgba(247, 147, 26, 0.2));
        }

        @media (prefers-reduced-motion: reduce) {
          .rain-coins-root {
            display: none;
          }
        }
      `}</style>

      <div aria-hidden="true" className="rain-coins-root">
        {coins.map((coin) => (
          <img
            key={coin.id}
            src={coin.src}
            alt=""
            className="rain-coin"
            style={{
              left: `${coin.left}%`,
              width: `${coin.size}px`,
              height: `${coin.size}px`,
              animationDuration: `${coin.duration}s`,
              animationDelay: `${coin.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
