import { NextResponse } from "next/server";

const COIN_IDS = [
  "bitcoin",
  "ethereum",
  "binancecoin",
  "tether",
  "solana",
  "dogecoin",
  "tron",
];

export async function GET() {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS.join(",")}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();

    const coins = COIN_IDS.map((id) => ({
      id,
      symbol: id,
      price: data[id]?.usd ?? 0,
      change: data[id]?.usd_24h_change ?? 0,
    }));

    return NextResponse.json({ coins });
  } catch {
    return NextResponse.json({ coins: [] });
  }
}
