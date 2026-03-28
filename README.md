# 🌱 Cacao Origin — IoT to NFT on Rayls

An autonomous pipeline that takes raw cacao farm IoT data, stores it privately on Rayls, AI-scores the harvest quality and pricing, then mints a confidential NFT for investors to purchase and unlock the private data.

## Architecture

```
IoT Devices (simulated)
    ↓
[System 1] Farmer App — reads IoT data & stores on Privacy Node
    ↓ (trigger when done)
[System 2] AI Agent — reads TX, scores quality, prices lot
    ↓ (POST metadata)
[System 3] Marketplace — mints NFT with private metadata, lists for sale
    ↓
Investor buys NFT → unlocks private consolidated data
```

## Project Structure

```
rayls-cacao/
├── app/                    ← NextJS (App Router + Tailwind + shadcn)
├── contracts/              ← Foundry (Solidity contracts + scripts)
└── agent/                  ← AI Agent (TypeScript)
```

## Quick Start

```bash
# Install
cd contracts && forge install
cd ../app && npm install
cd ../agent && npm install

# Configure
cp .env.example .env
# Fill in your values

# Deploy
cd contracts
source ../.env
forge script script/Deploy.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
```

## Tech Stack

- **Frontend:** Next.js 15, Tailwind CSS, shadcn/ui
- **Contracts:** Solidity 0.8.24, Foundry, Rayls Protocol SDK
- **Agent:** TypeScript, ethers.js, multi-provider LLM
- **Chains:** Rayls Privacy Node (gasless) + Rayls Public Chain

## Built for EthCC 26 — Rayls Hackathon #2

Challenge: Autonomous Institution Agent + Confidential NFT Reveal
