import { NextRequest, NextResponse } from 'next/server'
import { OpenOceanAdapter } from '@/lib/openocean-adapter'
import { getOpenOceanChainId } from '@/config/chains'

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

    // Validation
    if (!chainId || !inTokenAddress || !outTokenAddress || !amount) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          details: 'chainId, inTokenAddress, outTokenAddress, and amount are required'
        },
        { status: 400 }
      )
    }

    const parsedChainId = parseInt(chainId)
    if (isNaN(parsedChainId)) {
      return NextResponse.json(
        { error: 'Invalid chainId', details: 'chainId must be a valid number' },
        { status: 400 }
      )
    }

    // Check if chain is supported
    const openOceanChain = getOpenOceanChainId(parsedChainId)
    if (!openOceanChain) {
      return NextResponse.json(
        { 
          error: 'Unsupported chain',
          details: `Chain ID ${parsedChainId} is not supported by OpenOcean`
        },
        { status: 400 }
      )
    }

    // Log request for debugging (without exposing sensitive data)
    console.log('[Quote API] Request:', {
      chainId: parsedChainId,
      chain: openOceanChain,
      inToken: inTokenAddress.substring(0, 10) + '...',
      outToken: outTokenAddress.substring(0, 10) + '...',
      hasAccount: !!account,
      slippage: slippage || 'default',
    })

    const apiKey = process.env.OPENOCEAN_API_KEY
    const adapter = new OpenOceanAdapter(apiKey)

    const quote = await adapter.getQuote({
      chainId: parsedChainId,
      inTokenAddress,
      outTokenAddress,
      amount,
      account: account || undefined,
      slippage: slippage ? parseFloat(slippage) : undefined,
      gasPrice: gasPrice || undefined,
    })

    console.log('[Quote API] Success:', {
      outAmount: quote.outAmount,
      estimatedGas: quote.estimatedGas,
    })

    return NextResponse.json(quote)
  } catch (error) {
    // Log error for debugging
    console.error('[Quote API] Error:', error)

    // Return detailed error to client
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quote'
    const errorDetails = {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorDetails, { status: 500 })
  }
}
