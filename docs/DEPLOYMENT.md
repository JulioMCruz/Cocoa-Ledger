# Deployment Guide

## App (Netlify)

1. Connect repo to Netlify
2. Set build command: `cd app && npm run build`
3. Set publish directory: `app/.next`
4. Add environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_DATA_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_PRIVACY_NODE_RPC`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_AGENT_URL`
   - `PRIVACY_NODE_RPC`
   - `DATA_CONTRACT_ADDRESS`
   - `DEPLOYER_PRIVATE_KEY`
   - `AGENT_URL`

## Agent (VPS / Docker)

### Direct deployment

```bash
cd agent
cp .env.example .env
# fill in values
npm install
npx tsx src/index.ts
```

### Docker

```bash
cd agent
docker build -t cocoa-agent .
docker run -p 3001:3001 --env-file .env cocoa-agent
```

### PM2 (production)

```bash
pm2 start "npx tsx src/index.ts" --name cocoa-agent
```

## Contracts (Foundry)

```bash
cd contracts
cp ../.env.example ../.env
# fill in values
source ../.env
forge script script/DeployCocoaLedger.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
```
