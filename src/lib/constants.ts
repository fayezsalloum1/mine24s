export const BRAND_NAME = "Cloud Mining";

export const USDT = {
  ERC20: {
    contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    rpc: process.env.ETH_RPC_URL || "https://eth.llamarpc.com",
  },
  BEP20: {
    contract: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    rpc: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
  },
  TRC20: {
    contract: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    decimals: 6,
  },
} as const;

export const SCAN_BLOCKS = 2000;
