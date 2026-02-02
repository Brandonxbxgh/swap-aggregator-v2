'use client'

import { useState } from 'react'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useSendTransaction, useReadContract } from 'wagmi'
import { parseUnits, Address, erc20Abi, isAddress } from 'viem'
import { ChainSelector } from '@/components/ChainSelector'
import { WalletConnect } from '@/components/WalletConnect'

const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

const isNativeToken = (token: string) => {
  return token.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
}

export function SwapInterface() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: approvalHash, isPending: isApproving } = useWriteContract()
  const { sendTransaction, data: swapHash, isPending: isSwapping } = useSendTransaction()
  const { isLoading: isConfirmingApproval } = useWaitForTransactionReceipt({ hash: approvalHash })
  const { isLoading: isConfirmingSwap } = useWaitForTransactionReceipt({ hash: swapHash })

  const [tokenIn, setTokenIn] = useState<string>('')
  const [tokenOut, setTokenOut] = useState<string>('')
  const [amountIn, setAmountIn] = useState<string>('')
  const [quote, setQuote] = useState<{
    inAmount: string
    outAmount: string
    estimatedGas: string
    data: string
    to: string
    value: string
  } | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [error, setError] = useState<string>('')
  const [needsApproval, setNeedsApproval] = useState(false)

  // Read token decimals
  const { data: tokenDecimals } = useReadContract({
    address: tokenIn as Address,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: isAddress(tokenIn) && !isNativeToken(tokenIn),
    },
  })

  // Read current allowance
  const { data: currentAllowance } = useReadContract({
    address: tokenIn as Address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && quote ? [address, quote.to as Address] : undefined,
    query: {
      enabled: !!address && !!quote && isAddress(tokenIn) && !isNativeToken(tokenIn),
    },
  })

  const fetchQuote = async () => {
    if (!tokenIn || !tokenOut || !amountIn || !isConnected) {
      setError('Please fill in all fields and connect wallet')
      return
    }

    if (!isAddress(tokenIn) && !isNativeToken(tokenIn)) {
      setError('Invalid tokenIn address')
      return
    }

    if (!isAddress(tokenOut) && !isNativeToken(tokenOut)) {
      setError('Invalid tokenOut address')
      return
    }

    setIsLoadingQuote(true)
    setError('')
    setQuote(null)

    try {
      // For native tokens, use the native token address format
      const inAddress = isNativeToken(tokenIn) ? NATIVE_TOKEN_ADDRESS : tokenIn
      const outAddress = isNativeToken(tokenOut) ? NATIVE_TOKEN_ADDRESS : tokenOut
      
      // Use token decimals if available, otherwise default to 18
      const effectiveDecimals = tokenDecimals || 18
      const amountInWei = parseUnits(amountIn, effectiveDecimals).toString()

      const params = new URLSearchParams({
        chainId: chainId.toString(),
        inTokenAddress: inAddress,
        outTokenAddress: outAddress,
        amount: amountInWei,
        account: address || '',
        slippage: '1',
      })

      const response = await fetch(`/api/swap/quote?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quote')
      }

      setQuote(data)

      // Check if approval is needed for ERC20 tokens
      if (!isNativeToken(tokenIn)) {
        // Check if we have sufficient allowance
        const requiredAmount = BigInt(data.inAmount)
        const hasAllowance = currentAllowance && currentAllowance >= requiredAmount
        setNeedsApproval(!hasAllowance)
      } else {
        setNeedsApproval(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quote')
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const approveToken = async () => {
    if (!quote || !address || isNativeToken(tokenIn)) return

    try {
      writeContract({
        address: tokenIn as Address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [quote.to as Address, BigInt(quote.inAmount)],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve token')
    }
  }

  const executeSwap = async () => {
    if (!quote || !address) return

    try {
      sendTransaction({
        to: quote.to as Address,
        value: BigInt(quote.value),
        data: quote.data as `0x${string}`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute swap')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Swap Tokens</h1>

      {/* Wallet Connection */}
      <div className="mb-6">
        <WalletConnect />
      </div>

      {/* Chain Selection */}
      {isConnected && (
        <>
          <div className="mb-6">
            <ChainSelector />
          </div>

          {/* Token Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Token In Address</label>
            <input
              type="text"
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value)}
              placeholder="0x... or 0xEeee...EEeE for native token"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {tokenDecimals && (
              <p className="text-xs text-gray-500 mt-1">Decimals: {tokenDecimals}</p>
            )}
          </div>

          {/* Token Output */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Token Out Address</label>
            <input
              type="text"
              value={tokenOut}
              onChange={(e) => setTokenOut(e.target.value)}
              placeholder="0x... or 0xEeee...EEeE for native token"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="text"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Get Quote Button */}
          <button
            onClick={fetchQuote}
            disabled={isLoadingQuote || !isConnected}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
          >
            {isLoadingQuote ? 'Fetching Quote...' : 'Get Quote'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Quote Display */}
          {quote && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">Quote</h3>
              <div className="text-sm space-y-1">
                <div>Output Amount: {quote.outAmount}</div>
                <div>Estimated Gas: {quote.estimatedGas}</div>
              </div>

              {/* Approval Button (only for ERC20) */}
              {needsApproval && !isNativeToken(tokenIn) && (
                <button
                  onClick={approveToken}
                  disabled={isApproving || isConfirmingApproval}
                  className="w-full mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isApproving ? 'Approving...' : isConfirmingApproval ? 'Confirming...' : 'Approve Token'}
                </button>
              )}

              {/* Swap Button */}
              <button
                onClick={executeSwap}
                disabled={isSwapping || isConfirmingSwap}
                className="w-full mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSwapping || isConfirmingSwap ? 'Processing...' : 'Execute Swap'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
