export interface SwapQuote {
  inAmount: string
  outAmount: string
  estimatedGas: string
  data: string
  to: string
  value: string
}

export interface QuoteParams {
  chainId: number
  inTokenAddress: string
  outTokenAddress: string
  amount: string
  gasPrice?: string
  slippage?: number
  account?: string
}

export interface SwapProvider {
  getQuote(params: QuoteParams): Promise<SwapQuote>
}
