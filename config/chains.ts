import { Chain } from 'viem'
import { mainnet, bsc, polygon, arbitrum, optimism, base, avalanche } from 'viem/chains'

export const SUPPORTED_CHAINS = [
  mainnet,
  bsc,
  polygon,
  arbitrum,
  optimism,
  base,
  avalanche,
] as const

export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [bsc.id]: 'BNB Chain',
  [polygon.id]: 'Polygon',
  [arbitrum.id]: 'Arbitrum',
  [optimism.id]: 'Optimism',
  [base.id]: 'Base',
  [avalanche.id]: 'Avalanche C-Chain',
}

export const OPENOCEAN_CHAIN_IDS: Record<number, string> = {
  [mainnet.id]: 'eth',
  [bsc.id]: 'bsc',
  [polygon.id]: 'polygon',
  [arbitrum.id]: 'arbitrum',
  [optimism.id]: 'optimism',
  [base.id]: 'base',
  [avalanche.id]: 'avax',
}

export function getChainById(chainId: number): Chain | undefined {
  return SUPPORTED_CHAINS.find((chain) => chain.id === chainId)
}

export function getOpenOceanChainId(chainId: number): string | undefined {
  return OPENOCEAN_CHAIN_IDS[chainId]
}
