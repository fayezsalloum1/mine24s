"use client";

import { useEffect, useState } from "react";

interface CoinPrice {
  id: string;
  symbol: string;
  price: number;
  change: number;
}

const COIN_LABELS: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  binancecoin: "BNB",
  tether: "USDT",
  solana: "SOL",
  dogecoin: "DOGE",
  tron: "TRX",
};

export default function CryptoTicker() {
  const [coins, setCoins] = useState<CoinPrice[]>([]);

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/crypto/prices");
      const data = await res.json();
      if (data.coins) setCoins(data.coins);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (coins.length === 0) return null;

  const items = [...coins, ...coins];

  return (
    <div className="bg-gray-950/90 backdrop-blur-sm border-b border-gray-800/80 overflow-hidden h-10 flex items-center">
      <div className="animate-ticker flex whitespace-nowrap gap-8">
        {items.map((coin, i) => (
          <span key={`${coin.id}-${i}`} className="inline-flex items-center gap-2 text-sm px-4">
            <span className="font-bold text-yellow-500">
              {COIN_LABELS[coin.id] || coin.symbol}
            </span>
            <span className="text-white">${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: coin.price < 1 ? 4 : 2 })}</span>
            <span className={coin.change >= 0 ? "text-green-400" : "text-red-400"}>
              {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
