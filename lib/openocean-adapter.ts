import { SwapProvider, QuoteParams, SwapQuote } from './swap-provider'
import { getOpenOceanChainId } from '@/config/chains'

const OPENOCEAN_API_BASE = 'https://open-api.openocean.finance/v4'

export class OpenOceanAdapter implements SwapProvider {
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  async getQuote(params: QuoteParams): Promise<SwapQuote> {
    const chainName = getOpenOceanChainId(params.chainId)
    if (!chainName) {
      throw new Error(`Unsupported chain ID: ${params.chainId}`)
    }

    const url = new URL(`${OPENOCEAN_API_BASE}/${chainName}/swap`)
    url.searchParams.append('inTokenAddress', params.inTokenAddress)
    url.searchParams.append('outTokenAddress', params.outTokenAddress)
    url.searchParams.append('amount', params.amount)
    url.searchParams.append('slippage', (params.slippage || 1).toString())
    
    if (params.gasPrice) {
      url.searchParams.append('gasPrice', params.gasPrice)
    }
    
    if (params.account) {
      url.searchParams.append('account', params.account)
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(url.toString(), { headers })

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch {
        errorText = 'Unable to read error response'
      }
      throw new Error(`OpenOcean API returned ${response.status}: ${errorText || response.statusText}`)
    }

    const data = await response.json()

    if (data.code !== 200) {
      const errorMessage = data.message || data.error || 'Request failed'
      const errorDetail = data.data ? ` - ${JSON.stringify(data.data)}` : ''
      throw new Error(`OpenOcean API error (code ${data.code}): ${errorMessage}${errorDetail}`)
    }

    return {
      inAmount: data.data.inAmount,
      outAmount: data.data.outAmount,
      estimatedGas: data.data.estimatedGas,
      data: data.data.data,
      to: data.data.to,
      value: data.data.value || '0',
    }
  }
}
