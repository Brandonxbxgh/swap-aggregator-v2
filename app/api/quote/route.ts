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

    // Find token information for detailed logging
    const tokenInInfo = findToken(parsedChainId, inTokenAddress)
    const tokenOutInfo = findToken(parsedChainId, outTokenAddress)

    // Log comprehensive request details for debugging (server-side only, no sensitive data)
    console.log('[Quote API] Request Details:', {
      chainId: parsedChainId,
      chainName: openOceanChain,
      tokenIn: {
        address: inTokenAddress,
        symbol: tokenInInfo?.symbol || 'Unknown',
        decimals: tokenInInfo?.decimals || 'Unknown',
      },
      tokenOut: {
        address: outTokenAddress,
        symbol: tokenOutInfo?.symbol || 'Unknown',
        decimals: tokenOutInfo?.decimals || 'Unknown',
      },
      amountBaseUnits: amount,
      amountHuman: tokenInInfo?.decimals 
        ? formatUnits(BigInt(amount), tokenInInfo.decimals)
        : 'N/A',
      slippageBps,
      slippagePercent,
      hasAccount: !!account,
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

    // Store the original raw outAmount
    const outAmountRaw = quote.outAmount

    // Sanity check: Detect impossible exchange rates
    // If output amount is more than 1000x input amount for similar-value tokens, flag as error
    // This catches issues like getting 19,000 BNB for 5 USDT
    try {
      const inAmountBigInt = BigInt(amount)
      const outAmountBigInt = BigInt(outAmountRaw)
      
      // Only check if both token decimals are known
      if (tokenInInfo?.decimals && tokenOutInfo?.decimals) {
        // Normalize both amounts to 18 decimals for comparison
        // Handle tokens with > 18 decimals by dividing instead of multiplying
        const inAmountNormalized = tokenInInfo.decimals === 18 
          ? inAmountBigInt 
          : tokenInInfo.decimals < 18
            ? inAmountBigInt * BigInt(10 ** (18 - tokenInInfo.decimals))
            : inAmountBigInt / BigInt(10 ** (tokenInInfo.decimals - 18))
        const outAmountNormalized = tokenOutInfo.decimals === 18 
          ? outAmountBigInt 
          : tokenOutInfo.decimals < 18
            ? outAmountBigInt * BigInt(10 ** (18 - tokenOutInfo.decimals))
            : outAmountBigInt / BigInt(10 ** (tokenOutInfo.decimals - 18))
        
        // Check if output is more than 1000x the input (clearly impossible for most token pairs)
        if (outAmountNormalized > inAmountNormalized * BigInt(1000)) {
          // Calculate ratio using floating point for display (multiply by 100 first for precision)
          const ratioBigInt = inAmountNormalized > BigInt(0) 
            ? (outAmountNormalized * BigInt(100)) / inAmountNormalized 
            : BigInt(0)
          const ratioDisplay = (Number(ratioBigInt) / 100).toFixed(2)
          
          console.error('[Quote API] Sanity check failed - impossible exchange rate detected:', {
            tokenIn: { symbol: tokenInInfo.symbol, decimals: tokenInInfo.decimals },
            tokenOut: { symbol: tokenOutInfo.symbol, decimals: tokenOutInfo.decimals },
            amountIn: amount,
            amountInHuman: formatUnits(inAmountBigInt, tokenInInfo.decimals),
            outAmountRaw,
            outAmountHuman: formatUnits(outAmountBigInt, tokenOutInfo.decimals),
            ratio: ratioDisplay + 'x',
          })
          
          return NextResponse.json(
            { 
              error: 'Invalid quote received',
              details: `The quote appears to have an impossible exchange rate. Expected reasonable ratio but got output >> input. This may indicate an API parameter error. Please try again or contact support.`,
            },
            { status: 502 }
          )
        }
      }
    } catch (e) {
      console.warn('[Quote API] Sanity check calculation error (non-fatal):', e)
    }

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
    
    // If error is from RPC rate limiting, use 503 Service Unavailable
    if (errorMessage.includes('RPC rate limited or unavailable')) {
      statusCode = 503
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
