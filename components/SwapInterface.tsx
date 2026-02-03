'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useSendTransaction, useReadContract } from 'wagmi'
import { parseUnits, Address, erc20Abi, isAddress } from 'viem'
import { ChainSelector } from '@/components/ChainSelector'
import { WalletConnect } from '@/components/WalletConnect'
import { TokenSelect } from '@/components/TokenSelect'
import { getTokensForChain, getDefaultTokens, findToken, isNativeToken, NATIVE_TOKEN_ADDRESS } from '@/lib/tokens'

// Helper function to get native symbol for a chain
function getNativeSymbol(chainId: number): string {
  const nativeSymbols: Record<number, string> = {
    1: 'ETH',      // Ethereum
    56: 'BNB',     // BNB Chain
    137: 'MATIC',  // Polygon
    42161: 'ETH',  // Arbitrum
    10: 'ETH',     // Optimism
    8453: 'ETH',   // Base
    43114: 'AVAX', // Avalanche
  }
  return nativeSymbols[chainId] || 'ETH'
}

export function SwapInterface() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: approvalHash, isPending: isApproving } = useWriteContract()
  const { sendTransaction, data: swapHash, isPending: isSwapping } = useSendTransaction()
  const { isLoading: isConfirmingApproval } = useWaitForTransactionReceipt({ hash: approvalHash })
  const { isLoading: isConfirmingSwap } = useWaitForTransactionReceipt({ hash: swapHash })

  // Get available tokens for current chain
  const availableTokens = getTokensForChain(chainId)

  // Initialize token selections with defaults for current chain
  const [tokenIn, setTokenIn] = useState<string>('')
  const [tokenOut, setTokenOut] = useState<string>('')
  
  // Update token selections when chain changes
  useEffect(() => {
    const defaults = getDefaultTokens(chainId)
    const tokens = getTokensForChain(chainId)
    
    // Use functional updates to access latest state values
    setTokenIn((currentTokenIn) => {
      const tokenInExists = currentTokenIn && tokens.some((t) => t.address.toLowerCase() === currentTokenIn.toLowerCase())
      return tokenInExists ? currentTokenIn : defaults.tokenIn
    })
    
    setTokenOut((currentTokenOut) => {
      const tokenOutExists = currentTokenOut && tokens.some((t) => t.address.toLowerCase() === currentTokenOut.toLowerCase())
      return tokenOutExists ? currentTokenOut : defaults.tokenOut
    })
  }, [chainId])

  const [amountIn, setAmountIn] = useState<string>('')
  const [quote, setQuote] = useState<{
    inAmount: string
    outAmount: string
    outAmountRaw?: string
    minReceivedRaw?: string
    minReceived?: string
    estimatedGas: string
    gasPriceWei?: string
    gasCostWei?: string
    gasCostNative?: string
    data: string
    to: string
    value: string
    tokenIn?: {
      address: string
      symbol: string
      decimals: number
    }
    tokenOut?: {
      address: string
      symbol: string
      decimals: number
    }
  } | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [error, setError] = useState<string>('')
  const [errorDetails, setErrorDetails] = useState<string>('')
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [slippageBps, setSlippageBps] = useState<number>(100) // Default 100 BPS = 1%

  // Get token decimals from token data
  const selectedTokenIn = findToken(chainId, tokenIn)

  // Read token decimals (fallback for tokens not in our list)
  const { data: tokenDecimals } = useReadContract({
    address: tokenIn as Address,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: isAddress(tokenIn) && !isNativeToken(tokenIn) && !selectedTokenIn,
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
    setErrorDetails('')
    setShowErrorDetails(false)
    setQuote(null)

    try {
      // For native tokens, use the native token address format
      const inAddress = isNativeToken(tokenIn) ? NATIVE_TOKEN_ADDRESS : tokenIn
      const outAddress = isNativeToken(tokenOut) ? NATIVE_TOKEN_ADDRESS : tokenOut
      
      // Use token decimals if available, otherwise default to 18
      const finalDecimals = selectedTokenIn?.decimals || tokenDecimals || 18
      const amountInWei = parseUnits(amountIn, finalDecimals).toString()

      const params = new URLSearchParams({
        chainId: chainId.toString(),
        inTokenAddress: inAddress,
        outTokenAddress: outAddress,
        amount: amountInWei,
        account: address || '',
        slippageBps: slippageBps.toString(),
      })

      const response = await fetch(`/api/quote?${params}`)
      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to fetch quote'
        const details = data.details || data.timestamp ? 
          `${data.details || ''}\n${data.timestamp ? `Time: ${data.timestamp}` : ''}`.trim() : 
          ''
        setError(errorMsg)
        setErrorDetails(details)
        return
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
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch quote'
      setError(errorMsg)
      // Don't expose stack traces to users for security reasons
      setErrorDetails('')
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const swapTokens = () => {
    // Swap tokenIn and tokenOut
    const temp = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(temp)
    // Clear quote, error, and amount when swapping
    setQuote(null)
    setError('')
    setErrorDetails('')
    setShowErrorDetails(false)
    setAmountIn('')
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
            <TokenSelect
              label="From"
              tokens={availableTokens}
              selectedToken={tokenIn}
              onTokenChange={setTokenIn}
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={swapTokens}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Swap tokens"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          {/* Token Output */}
          <div className="mb-4">
            <TokenSelect
              label="To"
              tokens={availableTokens}
              selectedToken={tokenOut}
              onTokenChange={setTokenOut}
            />
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="text"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Slippage Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Slippage Tolerance (%)
            </label>
            <input
              type="number"
              value={slippageBps / 100}
              onChange={(e) => {
                const percent = parseFloat(e.target.value)
                // Ensure valid range: 0.1% to 50%
                if (!isNaN(percent) && percent >= 0.1 && percent <= 50) {
                  setSlippageBps(Math.round(percent * 100))
                } else if (percent < 0.1) {
                  setSlippageBps(10) // Minimum 0.1%
                }
              }}
              step="0.1"
              min="0.1"
              max="50"
              placeholder="1.0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current: {slippageBps / 100}% ({slippageBps} basis points)
            </p>
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
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <svg 
                  className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {error}
                  </p>
                  {errorDetails && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="text-xs text-red-700 dark:text-red-300 hover:underline focus:outline-none"
                      >
                        {showErrorDetails ? '▼ Hide details' : '▶ Show details'}
                      </button>
                      {showErrorDetails && (
                        <pre className="mt-2 text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words">
                          {errorDetails}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quote Display */}
          {quote && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-3">Quote</h3>
              <div className="text-sm space-y-2">
                {/* Input Amount (Human-readable) */}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Input amount:</span>
                  <span className="font-medium">
                    {amountIn} {quote.tokenIn?.symbol || ''}
                  </span>
                </div>
                
                {/* Output Amount */}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Output amount:</span>
                  <span className="font-medium">
                    ~ {quote.outAmount} {quote.tokenOut?.symbol || ''}
                  </span>
                </div>
                
                {/* Min Received */}
                {quote.minReceived && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Min received ({slippageBps / 100}% slippage):</span>
                    <span className="font-medium">
                      {quote.minReceived} {quote.tokenOut?.symbol || ''}
                    </span>
                  </div>
                )}
                
                {/* Estimated Gas Units */}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Estimated gas:</span>
                  <span className="font-medium">
                    {parseInt(quote.estimatedGas).toLocaleString()} units
                  </span>
                </div>
                
                {/* Estimated Gas Cost */}
                {quote.gasCostNative && parseFloat(quote.gasCostNative) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gas cost:</span>
                    <span className="font-medium">
                      ~ {parseFloat(quote.gasCostNative).toFixed(6)} {getNativeSymbol(chainId)}
                    </span>
                  </div>
                )}
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
