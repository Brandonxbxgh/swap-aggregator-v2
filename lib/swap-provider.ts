export interface SwapQuote {
  inAmount: string
  outAmount: string
  outAmountRaw?: string // Original raw output amount
  minReceivedRaw?: string // Min received after slippage (raw)
  minReceived?: string // Min received after slippage (human-readable)
  estimatedGas: string
  gasPriceWei?: string // Gas price used in the request
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
}

export interface QuoteParams {
  chainId: number
  inTokenAddress: string
  outTokenAddress: string
  amount: string
  gasPrice?: string
  slippage?: number
  slippageBps?: number // Slippage in basis points (100 = 1%)
  account?: string
}

export interface SwapProvider {
  getQuote(params: QuoteParams): Promise<SwapQuote>
}
