import { SwapProvider, QuoteParams, SwapQuote } from './swap-provider'
import { getOpenOceanChainId, getChainById } from '@/config/chains'
import { createPublicClient, http, PublicClient } from 'viem'

const OPENOCEAN_API_BASE = 'https://open-api.openocean.finance/v4'

// Legacy chains that use gasPrice instead of EIP-1559
const LEGACY_CHAINS = [56, 137, 43114] // BNB Chain, Polygon, Avalanche

// Cache public clients per chain ID to avoid recreating them
const clientCache = new Map<number, PublicClient>()

export class OpenOceanAdapter implements SwapProvider {
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  private getOrCreateClient(chainId: number): PublicClient {
    if (!clientCache.has(chainId)) {
      const chain = getChainById(chainId)
      if (!chain) {
        throw new Error(`Chain configuration not found for chain ID: ${chainId}`)
      }

      const client = createPublicClient({
        chain,
        transport: http(),
      })
      clientCache.set(chainId, client)
    }
    return clientCache.get(chainId)!
  }

  async getQuote(params: QuoteParams): Promise<SwapQuote> {
    const chainName = getOpenOceanChainId(params.chainId)
    if (!chainName) {
      throw new Error(`Unsupported chain ID: ${params.chainId}`)
    }

    // Compute gas price to use: prefer provided gasPrice, otherwise compute it
    let gasPriceToUse = params.gasPrice

    if (!gasPriceToUse) {
      const client = this.getOrCreateClient(params.chainId)

      if (LEGACY_CHAINS.includes(params.chainId)) {
        // For legacy chains, fetch gasPrice
        const gasPriceBigInt = await client.getGasPrice()
        gasPriceToUse = gasPriceBigInt.toString()
      } else {
        // For EIP-1559 chains, fetch maxFeePerGas
        // OpenOcean API uses gasPrice parameter for both legacy and EIP-1559 chains
        const feeData = await client.estimateFeesPerGas()
        if (feeData.maxFeePerGas) {
          gasPriceToUse = feeData.maxFeePerGas.toString()
        } else {
          throw new Error(`Failed to fetch gas price for chain ${params.chainId}: maxFeePerGas is not available`)
        }
      }
    }

    const url = new URL(`${OPENOCEAN_API_BASE}/${chainName}/swap`)
    url.searchParams.set('inTokenAddress', params.inTokenAddress)
    url.searchParams.set('outTokenAddress', params.outTokenAddress)
    url.searchParams.set('amount', params.amount)
    url.searchParams.set('slippage', (params.slippage || 1).toString())
    
    // Append gasPrice exactly once if available
    if (gasPriceToUse) {
      url.searchParams.set('gasPrice', gasPriceToUse)
    }
    
    if (params.account) {
      url.searchParams.set('account', params.account)
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
      gasPriceWei: gasPriceToUse, // Include the gas price used
      data: data.data.data,
      to: data.data.to,
      value: data.data.value || '0',
    }
  }
}
