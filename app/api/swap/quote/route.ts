import { NextRequest, NextResponse } from 'next/server'
import { OpenOceanAdapter } from '@/lib/openocean-adapter'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chainId = searchParams.get('chainId')
    const inTokenAddress = searchParams.get('inTokenAddress')
    const outTokenAddress = searchParams.get('outTokenAddress')
    const amount = searchParams.get('amount')
    const account = searchParams.get('account')
    const slippageBpsParam = searchParams.get('slippageBps')
    const gasPrice = searchParams.get('gasPrice')

    if (!chainId || !inTokenAddress || !outTokenAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Parse slippage in BPS (basis points), default to 100 BPS = 1%
    const slippageBps = slippageBpsParam ? parseInt(slippageBpsParam) : 100
    
    // Validate slippage is within reasonable range (0.01% to 99.99%)
    if (slippageBps <= 0 || slippageBps >= 10000) {
      return NextResponse.json(
        { 
          error: 'Invalid slippage',
          details: 'slippageBps must be between 1 and 9999 (0.01% to 99.99%)'
        },
        { status: 400 }
      )
    }
    
    // Convert BPS to percentage for OpenOcean API (100 BPS = 1%)
    const slippagePercent = slippageBps / 100

    const apiKey = process.env.OPENOCEAN_API_KEY
    const adapter = new OpenOceanAdapter(apiKey)

    const quote = await adapter.getQuote({
      chainId: parseInt(chainId),
      inTokenAddress,
      outTokenAddress,
      amount,
      account: account || undefined,
      slippage: slippagePercent,
      gasPrice: gasPrice || undefined,
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}
