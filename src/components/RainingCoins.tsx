"use client";

type CoinConfig = {
  symbol: "₿" | "₮";
  type: "btc" | "usdt";
  left: string;
  duration: string;
  delay: string;
  size: number;
};

/** Static configs — avoids hydration mismatch and keeps render cheap. */
const COINS: CoinConfig[] = [
  { symbol: "₿", type: "btc", left: "4%", duration: "6.2s", delay: "0s", size: 22 },
  { symbol: "₮", type: "usdt", left: "11%", duration: "4.5s", delay: "1.1s", size: 18 },
  { symbol: "₿", type: "btc", left: "18%", duration: "7.8s", delay: "2.4s", size: 28 },
  { symbol: "₮", type: "usdt", left: "25%", duration: "5.1s", delay: "0.6s", size: 24 },
  { symbol: "₿", type: "btc", left: "32%", duration: "3.4s", delay: "3.2s", size: 16 },
  { symbol: "₮", type: "usdt", left: "39%", duration: "6.7s", delay: "1.8s", size: 30 },
  { symbol: "₿", type: "btc", left: "46%", duration: "4.9s", delay: "4.1s", size: 20 },
  { symbol: "₮", type: "usdt", left: "53%", duration: "8s", delay: "0.3s", size: 26 },
  { symbol: "₿", type: "btc", left: "60%", duration: "5.6s", delay: "2.9s", size: 32 },
  { symbol: "₮", type: "usdt", left: "67%", duration: "3.8s", delay: "5.2s", size: 19 },
  { symbol: "₿", type: "btc", left: "74%", duration: "7.1s", delay: "1.4s", size: 24 },
  { symbol: "₮", type: "usdt", left: "81%", duration: "4.2s", delay: "3.7s", size: 28 },
  { symbol: "₿", type: "btc", left: "88%", duration: "6.4s", delay: "0.9s", size: 17 },
  { symbol: "₮", type: "usdt", left: "95%", duration: "5.3s", delay: "2.1s", size: 22 },
  { symbol: "₿", type: "btc", left: "8%", duration: "7.5s", delay: "4.6s", size: 30 },
  { symbol: "₮", type: "usdt", left: "15%", duration: "3.6s", delay: "6.1s", size: 16 },
  { symbol: "₿", type: "btc", left: "22%", duration: "5.9s", delay: "1.2s", size: 26 },
  { symbol: "₮", type: "usdt", left: "29%", duration: "6.8s", delay: "3.5s", size: 21 },
  { symbol: "₿", type: "btc", left: "36%", duration: "4.1s", delay: "5.8s", size: 18 },
  { symbol: "₮", type: "usdt", left: "43%", duration: "7.3s", delay: "0.7s", size: 32 },
  { symbol: "₿", type: "btc", left: "50%", duration: "3.2s", delay: "2.6s", size: 24 },
  { symbol: "₮", type: "usdt", left: "57%", duration: "5.7s", delay: "4.3s", size: 20 },
  { symbol: "₿", type: "btc", left: "64%", duration: "8s", delay: "1.6s", size: 28 },
  { symbol: "₮", type: "usdt", left: "71%", duration: "4.7s", delay: "3.9s", size: 17 },
  { symbol: "₿", type: "btc", left: "78%", duration: "6.1s", delay: "5.5s", size: 22 },
  { symbol: "₮", type: "usdt", left: "85%", duration: "3.9s", delay: "0.4s", size: 25 },
  { symbol: "₿", type: "btc", left: "92%", duration: "7.6s", delay: "2.8s", size: 19 },
  { symbol: "₮", type: "usdt", left: "48%", duration: "5.4s", delay: "6.4s", size: 31 },
];

const COLORS = {
  btc: "#F7931A",
  usdt: "#26A17B",
} as const;

export default function RainingCoins() {
  return (
    <div className="raining-coins-layer" aria-hidden>
      {COINS.map((coin, i) => (
        <span
          key={i}
          className="raining-coin"
          style={{
            left: coin.left,
            fontSize: `${coin.size}px`,
            color: COLORS[coin.type],
            animationDuration: coin.duration,
            animationDelay: coin.delay,
          }}
        >
          {coin.symbol}
        </span>
      ))}
    </div>
  );
}
