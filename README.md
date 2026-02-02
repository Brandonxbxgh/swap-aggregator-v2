# swap-aggregator-v2

A mobile-first Next.js application for non-custodial token swaps across major EVM chains.

## Features

- 🔗 **Multi-Chain Support**: Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base, and Avalanche C-Chain
- 💼 **WalletConnect Integration**: Secure wallet connection with Ledger compatibility
- 🔄 **Token Swaps**: Seamless token swapping using OpenOcean Swap API v4
- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive UI
- ⚡ **Token Approval**: Automated ERC20 token approval flow
- 🎨 **Modern UI**: Built with TailwindCSS for a beautiful user experience

## Tech Stack

- **Next.js 15.5.11** - App Router with TypeScript
- **TailwindCSS** - Styling
- **wagmi 2.19.5** - Wallet interactions
- **viem 2.45.1** - Ethereum utilities
- **WalletConnect v2** - Wallet connection
- **OpenOcean API v4** - Swap aggregation

## Prerequisites

- Node.js 20
- pnpm 9.15.4
- WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com/))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Brandonxbxgh/swap-aggregator-v2.git
cd swap-aggregator-v2
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# WalletConnect Project ID (required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# OpenOcean API Key (optional)
OPENOCEAN_API_KEY=
```

## Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

Build the production application:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## Usage

### Swap Workflow

1. **Connect Wallet**: Click the "Connect with WalletConnect" button to connect your wallet
2. **Select Chain**: Choose the blockchain network you want to use
3. **Enter Token Details**:
   - Token In Address: The token you want to swap from
   - Token Out Address: The token you want to swap to
   - Amount: The amount you want to swap
4. **Get Quote**: Click "Get Quote" to fetch the swap details
5. **Approve Token** (for ERC20 tokens): If needed, approve the token spending
6. **Execute Swap**: Click "Execute Swap" to complete the transaction

### Native Token Address

For native tokens (ETH, BNB, MATIC, etc.), use the address:
```
0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
```

## Supported Chains

| Chain | Chain ID | Native Token |
|-------|----------|--------------|
| Ethereum | 1 | ETH |
| BNB Chain | 56 | BNB |
| Polygon | 137 | MATIC |
| Arbitrum | 42161 | ETH |
| Optimism | 10 | ETH |
| Base | 8453 | ETH |
| Avalanche C-Chain | 43114 | AVAX |

## Architecture

### Component Structure

```
app/
├── api/
│   └── swap/
│       └── quote/          # API route for fetching quotes
├── layout.tsx              # Root layout with providers
└── page.tsx                # Main page

components/
├── ChainSelector.tsx       # Chain selection component
├── SwapInterface.tsx       # Main swap interface
└── WalletConnect.tsx       # Wallet connection component

config/
├── chains.ts               # Chain configurations
└── wagmi.ts                # Wagmi configuration

lib/
├── openocean-adapter.ts    # OpenOcean API adapter
└── swap-provider.ts        # Swap provider interface
```

### Adapter Pattern

The application uses an adapter pattern for swap providers, making it easy to integrate additional providers in the future:

```typescript
interface SwapProvider {
  getQuote(params: QuoteParams): Promise<SwapQuote>
}
```

## API Integration

### OpenOcean API

The application integrates with OpenOcean Swap API v4 to fetch quotes and build swap transactions. Quotes are fetched server-side via Next.js API routes to keep API keys secure.

**Endpoint**: `/api/swap/quote`

**Parameters**:
- `chainId`: The blockchain network ID
- `inTokenAddress`: Input token address
- `outTokenAddress`: Output token address
- `amount`: Amount to swap (in wei)
- `account`: User's wallet address
- `slippage`: Slippage tolerance (default: 1%)

## Security

- ✅ No private keys stored
- ✅ Non-custodial - you always control your funds
- ✅ WalletConnect v2 for secure wallet connection
- ✅ Server-side API calls to protect API keys
- ✅ Exact dependency versions for deterministic builds

## Build Configuration

The project uses:
- **pnpm** as the package manager
- **Exact versions** for all dependencies (no caret or tilde)
- **Node.js 20** specified in package.json engines
- **Committed pnpm-lock.yaml** for deterministic builds

## Linting

Run ESLint:

```bash
pnpm lint
```

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
 
