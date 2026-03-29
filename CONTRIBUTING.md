# Contributing to Cocoa Ledger

## Project Structure

```
app/        → NextJS frontend (farmer dashboard)
agent/      → AI oracle service (Cocoa Agent)
contracts/  → Solidity smart contracts (Foundry)
```

## Git Workflow

1. Create a feature branch from main
2. Make changes
3. Push and create a Pull Request
4. Merge to main after review

Never commit directly to main.

## Environment

All secrets go in `.env` files (gitignored). See `.env.example` in each directory.

Never commit API keys, private keys, or tokens.

## Development

```bash
# Frontend
cd app && npm install && npm run dev

# Agent
cd agent && npm install && npx tsx src/index.ts

# Contracts
cd contracts && forge install && npm install
```
