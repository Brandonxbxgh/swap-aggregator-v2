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
    const slippage = searchParams.get('slippage')
    const gasPrice = searchParams.get('gasPrice')

    if (!chainId || !inTokenAddress || !outTokenAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENOCEAN_API_KEY
    const adapter = new OpenOceanAdapter(apiKey)

    const quote = await adapter.getQuote({
      chainId: parseInt(chainId),
      inTokenAddress,
      outTokenAddress,
      amount,
      account: account || undefined,
      slippage: slippage ? parseFloat(slippage) : undefined,
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
