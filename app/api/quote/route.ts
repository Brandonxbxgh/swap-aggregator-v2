import { NextRequest, NextResponse } from 'next/server'
import { OpenOceanAdapter } from '@/lib/openocean-adapter'
import { getOpenOceanChainId } from '@/config/chains'
import { findToken } from '@/lib/tokens'
import { formatUnits } from 'viem'

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

    // Parse slippage in BPS (basis points), default to 100 BPS = 1%
    const slippageBps = slippageBpsParam ? parseInt(slippageBpsParam) : 100
    // Convert BPS to percentage for OpenOcean API (100 BPS = 1%)
    const slippagePercent = slippageBps / 100

    // Log request for debugging (without exposing sensitive data)
    console.log('[Quote API] Request:', {
      chainId: parsedChainId,
      chain: openOceanChain,
      inToken: inTokenAddress.substring(0, 10) + '...',
      outToken: outTokenAddress.substring(0, 10) + '...',
      hasAccount: !!account,
      slippageBps,
      slippagePercent,
    })

    const apiKey = process.env.OPENOCEAN_API_KEY
    const adapter = new OpenOceanAdapter(apiKey)

    const quote = await adapter.getQuote({
      chainId: parsedChainId,
      inTokenAddress,
      outTokenAddress,
      amount,
      account: account || undefined,
      slippage: slippagePercent,
      gasPrice: gasPrice || undefined,
    })

    // Find token information
    const tokenInInfo = findToken(parsedChainId, inTokenAddress)
    const tokenOutInfo = findToken(parsedChainId, outTokenAddress)

    // Store the original raw outAmount
    const outAmountRaw = quote.outAmount

    // Format human-readable outAmount if tokenOut decimals are available
    let outAmount = outAmountRaw
    if (tokenOutInfo?.decimals) {
      try {
        outAmount = formatUnits(BigInt(outAmountRaw), tokenOutInfo.decimals)
      } catch (e) {
        console.warn('[Quote API] Failed to format outAmount:', e)
      }
    }

    // Calculate min received after slippage
    // minReceivedRaw = outAmountRaw * (10000 - slippageBps) / 10000
    let minReceivedRaw = '0'
    let minReceived = '0'
    try {
      const outAmountBigInt = BigInt(outAmountRaw)
      const minReceivedBigInt = (outAmountBigInt * BigInt(10000 - slippageBps)) / BigInt(10000)
      minReceivedRaw = minReceivedBigInt.toString()
      
      // Format human-readable minReceived if tokenOut decimals are available
      if (tokenOutInfo?.decimals) {
        minReceived = formatUnits(minReceivedBigInt, tokenOutInfo.decimals)
      } else {
        minReceived = minReceivedRaw
      }
    } catch (e) {
      console.warn('[Quote API] Failed to calculate minReceived:', e)
    }

    // Get gas price from quote response
    const gasPriceWei = quote.gasPriceWei || '0'
    
    // Calculate gas cost
    let gasCostWei = '0'
    let gasCostNative = '0'
    try {
      if (gasPriceWei && quote.estimatedGas) {
        const estimatedGasUnits = BigInt(quote.estimatedGas)
        const gasPriceBigInt = BigInt(gasPriceWei)
        const gasCostBigInt = estimatedGasUnits * gasPriceBigInt
        gasCostWei = gasCostBigInt.toString()
        gasCostNative = formatUnits(gasCostBigInt, 18)
      }
    } catch (e) {
      console.warn('[Quote API] Failed to calculate gas cost:', e)
    }

    console.log('[Quote API] Success:', {
      outAmountRaw,
      outAmount,
      minReceivedRaw,
      minReceived,
      estimatedGas: quote.estimatedGas,
    })

    // Build enhanced response
    const enhancedQuote = {
      ...quote,
      outAmountRaw,
      outAmount,
      minReceivedRaw,
      minReceived,
      gasPriceWei,
      gasCostWei,
      gasCostNative,
      tokenIn: tokenInInfo ? {
        address: tokenInInfo.address,
        symbol: tokenInInfo.symbol,
        decimals: tokenInInfo.decimals,
      } : undefined,
      tokenOut: tokenOutInfo ? {
        address: tokenOutInfo.address,
        symbol: tokenOutInfo.symbol,
        decimals: tokenOutInfo.decimals,
      } : undefined,
    }

    return NextResponse.json(enhancedQuote)
  } catch (error) {
    // Log error for debugging
    console.error('[Quote API] Error:', error)

    // Determine appropriate status code
    let statusCode = 500
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quote'
    
    // If error is from OpenOcean API, use 502 Bad Gateway
    if (errorMessage.includes('OpenOcean API')) {
      statusCode = 502
    }

    // Return detailed error to client
    const errorDetails = {
      error: errorMessage,
      details: error instanceof Error ? error.message : undefined,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorDetails, { status: statusCode })
  }
}
