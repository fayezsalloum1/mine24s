const LINKS = [
  { name: "CoinMarketCap", url: "https://coinmarketcap.com", domain: "coinmarketcap.com" },
  { name: "CoinGecko", url: "https://coingecko.com", domain: "coingecko.com" },
  { name: "Binance", url: "https://www.binance.com", domain: "binance.com" },
  { name: "MEXC", url: "https://www.mexc.com", domain: "mexc.com" },
  { name: "Etherscan", url: "https://etherscan.io", domain: "etherscan.io" },
  { name: "BscScan", url: "https://bscscan.com", domain: "bscscan.com" },
  { name: "TronScan", url: "https://tronscan.org", domain: "tronscan.org" },
];

function faviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

const ICON_FALLBACK: Record<string, string> = {
  Binance: "/icons/binance.svg",
  MEXC: "/icons/mexc.svg",
  TronScan: "/icons/tronscan.svg",
};

export default function ExternalLinksBar() {
  return (
    <div className="content-card">
      <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wider">Trusted Partners & Explorers</p>
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center items-center">
        {LINKS.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl hover:border-amber-500/30 hover:bg-slate-800 transition-all text-xs sm:text-sm text-slate-300 hover:text-white"
          >
            <img
              src={faviconUrl(link.domain)}
              alt={link.name}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded"
              loading="lazy"
              onError={(e) => {
                const fallback = ICON_FALLBACK[link.name];
                if (fallback) e.currentTarget.src = fallback;
              }}
            />
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}
