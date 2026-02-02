'use client'

import { SUPPORTED_CHAINS, CHAIN_NAMES } from '@/config/chains'
import { useChainId, useSwitchChain } from 'wagmi'

export function ChainSelector() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">Select Chain</label>
      <select
        value={chainId}
        onChange={(e) => switchChain({ chainId: parseInt(e.target.value) })}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SUPPORTED_CHAINS.map((chain) => (
          <option key={chain.id} value={chain.id}>
            {CHAIN_NAMES[chain.id] || chain.name}
          </option>
        ))}
      </select>
    </div>
  )
}
