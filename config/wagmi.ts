import { http, createConfig } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'
import { SUPPORTED_CHAINS } from './chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

if (!projectId) {
  console.warn('WalletConnect Project ID is not set. Wallet connection will not work.')
}

// Ankr RPC URLs from environment variables (free public RPCs)
const RPC_URLS: Record<number, string | undefined> = {
  1: process.env.NEXT_PUBLIC_ETH_RPC_URL,
  56: process.env.NEXT_PUBLIC_BSC_RPC_URL,
  137: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
  42161: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
  10: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL,
  8453: process.env.NEXT_PUBLIC_BASE_RPC_URL,
  43114: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL,
}

export const config = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    walletConnect({
      projectId,
      metadata: {
        name: 'Swap Aggregator v2',
        description: 'Non-custodial token swaps across major EVM chains',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://swap-aggregator-v2.vercel.app',
        icons: ['https://avatars.githubusercontent.com/u/37784886'],
      },
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '9999',
        },
      },
    }),
  ],
  transports: SUPPORTED_CHAINS.reduce((acc, chain) => {
    const rpcUrl = RPC_URLS[chain.id]
    acc[chain.id] = http(rpcUrl || undefined)
    return acc
  }, {} as Record<number, ReturnType<typeof http>>),
})
