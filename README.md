# Fuel Ghost Wallet

A privacy-focused wallet for the Fuel Network that generates unique addresses for each dApp connection.

## Features

- PassKey authentication
- Unique ghost wallet per dApp
- Privacy-preserving connections
- Simple dApp integration

## Development

1. Install dependencies:

```bash
npm install
```

2. Start the wallet:

```bash
npm run dev
```

3. Start the example dApp:

```bash
cd dapp-example
npm install
npm run dev
```

The wallet runs on `localhost:5173` and the example dApp on `localhost:5174`.

## How it Works

1. User authenticates with PassKey
2. Each dApp gets a unique "ghost" wallet address
3. Main wallet never exposed to dApps
4. All transactions use the ghost wallets
