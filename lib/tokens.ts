// Token interface
export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

// Native token placeholder address
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

// Helper to check if a token is native
export function isNativeToken(address: string): boolean {
  return address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
}

// Curated token lists per chain
export const CHAIN_TOKENS: Record<number, Token[]> = {
  // Ethereum Mainnet (1)
  1: [
    {
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
    },
  ],
  // BNB Chain (56)
  56: [
    {
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
    },
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
    },
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
    },
    {
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      symbol: 'BUSD',
      name: 'BUSD Token',
      decimals: 18,
    },
    {
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      symbol: 'ETH',
      name: 'Ethereum Token',
      decimals: 18,
    },
  ],
  // Polygon (137)
  137: [
    {
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
    },
    {
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
    },
    {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
    },
  ],
  // Arbitrum (42161)
  42161: [
    {
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
    },
    {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
    },
    {
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
    },
  ],
  // Optimism (10)
  10: [
    {
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
    },
    {
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
    },
    {
      address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
    },
  ],
  // Base (8453)
  8453: [
    {
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
    },
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
    },
  ],
  // Avalanche C-Chain (43114)
  43114: [
    {
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18,
    },
    {
      address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
    },
    {
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
    },
    {
      address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
    },
  ],
}

// Default token selections per chain
export const DEFAULT_TOKENS: Record<number, { tokenIn: string; tokenOut: string }> = {
  1: { tokenIn: NATIVE_TOKEN_ADDRESS, tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }, // ETH -> USDC
  56: { tokenIn: NATIVE_TOKEN_ADDRESS, tokenOut: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' }, // BNB -> USDC
  137: { tokenIn: NATIVE_TOKEN_ADDRESS, tokenOut: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' }, // MATIC -> USDC
  42161: { tokenIn: NATIVE_TOKEN_ADDRESS, tokenOut: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' }, // ETH -> USDC
  10: { tokenIn: NATIVE_TOKEN_ADDRESS, tokenOut: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' }, // ETH -> USDC
  8453: { tokenIn: NATIVE_TOKEN_ADDRESS, tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }, // ETH -> USDC
  43114: { tokenIn: NATIVE_TOKEN_ADDRESS, tokenOut: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' }, // AVAX -> USDC
}

// Get tokens for a specific chain
export function getTokensForChain(chainId: number): Token[] {
  return CHAIN_TOKENS[chainId] || []
}

// Get default tokens for a chain
export function getDefaultTokens(chainId: number): { tokenIn: string; tokenOut: string } {
  return DEFAULT_TOKENS[chainId] || { tokenIn: NATIVE_TOKEN_ADDRESS, tokenOut: NATIVE_TOKEN_ADDRESS }
}

// Find a token by address in a chain's token list
export function findToken(chainId: number, address: string): Token | undefined {
  const tokens = getTokensForChain(chainId)
  return tokens.find((token) => token.address.toLowerCase() === address.toLowerCase())
}
