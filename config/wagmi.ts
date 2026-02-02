import { http, createConfig } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'
import { SUPPORTED_CHAINS } from './chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

if (!projectId) {
  console.warn('WalletConnect Project ID is not set. Wallet connection will not work.')
}

export const config = createConfig({
  chains: SUPPORTED_CHAINS as any,
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
    acc[chain.id] = http()
    return acc
  }, {} as Record<number, ReturnType<typeof http>>),
})
