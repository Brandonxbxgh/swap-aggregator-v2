'use client'

import { Token } from '@/lib/tokens'

interface TokenSelectProps {
  label: string
  tokens: Token[]
  selectedToken: string
  onTokenChange: (address: string) => void
  disabled?: boolean
}

export function TokenSelect({
  label,
  tokens,
  selectedToken,
  onTokenChange,
  disabled = false,
}: TokenSelectProps) {
  const selected = tokens.find((t) => t.address.toLowerCase() === selectedToken.toLowerCase())

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <select
        value={selectedToken}
        onChange={(e) => onTokenChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-base"
      >
        {tokens.map((token) => (
          <option key={token.address} value={token.address}>
            {token.symbol} - {token.name}
          </option>
        ))}
      </select>
      {selected && (
        <p className="text-xs text-gray-500 mt-1">
          Decimals: {selected.decimals} | Address: {selected.address.slice(0, 6)}...{selected.address.slice(-4)}
        </p>
      )}
    </div>
  )
}
