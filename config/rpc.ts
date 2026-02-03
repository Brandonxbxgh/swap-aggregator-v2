// Ankr RPC URLs from environment variables (free public RPCs)
export const RPC_URLS: Record<number, string | undefined> = {
  1: process.env.NEXT_PUBLIC_ETH_RPC_URL,
  56: process.env.NEXT_PUBLIC_BSC_RPC_URL,
  137: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
  42161: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
  10: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL,
  8453: process.env.NEXT_PUBLIC_BASE_RPC_URL,
  43114: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL,
}
