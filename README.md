# Fuel Ghost Wallet

A privacy-focused wallet for the Fuel Network that generates unique addresses for each dApp connection. NEVER REVEAL YOUR MAIN WALLET TO ANYONE.

## Features

- PassKey authentication for secure access
- Deterministic ghost wallet generation
- Private key derivation from main wallet
- Privacy-preserving dApp connections
- Simple dApp integration

## How it Works

1. User creates/authenticates with PassKey
2. Main wallet is derived from PassKey
3. Ghost wallets are derived deterministically:
   - Each ghost wallet has a unique index
   - Private key = keccak256(mainPrivateKey + indexHex)
   - All ghost wallets can be recovered using main wallet + index

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

## Security

- Main wallet private key never exposed to dApps
- Each dApp gets a unique ghost wallet
- Ghost wallets are deterministically derived
- All wallets recoverable from PassKey
