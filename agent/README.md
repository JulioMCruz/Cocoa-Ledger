# Cocoa Ledger Agent — AI Oracle Service

An autonomous AI agent that reads cacao IoT data from the Rayls Privacy Node, analyzes harvest quality, and produces structured metadata for NFT minting.

## How it works

1. App 1 stores IoT readings on the Privacy Node and finalizes a lot
2. App 1 calls this agent with the lot ID
3. Agent reads all on-chain readings for that lot
4. Agent sends data to AI (Gemini) for quality analysis
5. Agent returns public + private metadata
6. App 3 uses the metadata to mint a confidential NFT

## API

### POST /api/analyze-lot
```json
{ "lotId": 0 }
```

Returns quality grade (S/A/B/C/D), score (0-100), crop health assessment, price estimate, and more.

### GET /api/health
Returns `{ "status": "ok", "version": "1.0.0" }`

## Setup

```bash
cp .env.example .env
# fill in your keys
npm install
npx tsx src/index.ts
```

## Environment Variables

```
PORT=3001
PRIVACY_NODE_RPC=https://privacy-node-0.rayls.com
DATA_CONTRACT_ADDRESS=0x47B1C749cB7f1b48679E872E6DF3d1223cb4c6fC
GEMINI_API_KEY=your_gemini_key
```

## Deployment

The agent runs as a Node.js service. Deploy with Docker or directly:

```bash
# Docker
docker build -t cocoa-ledger-agent .
docker run -p 3001:3001 --env-file .env cocoa-ledger-agent

# Direct
npx tsx src/index.ts
```

## Creating an OpenClaw Agent

To run this as an OpenClaw agent:

1. Install OpenClaw on your server
2. Create a workspace directory for the agent
3. Add the agent source code
4. Configure environment variables in `.env`
5. Create an `AGENTS.md` with the agent personality and instructions
6. Create a `SOUL.md` defining the agent identity
7. Start the agent with `openclaw gateway start`

The agent will read blockchain data and respond to analysis requests autonomously.

## Skills

The `skills/` directory contains ETHSkills used by this agent:
- `ethskills-standards/` — ERC token standards reference
- `ethskills-security/` — Smart contract security patterns
- `ethskills-tools/` — Ethereum tooling reference

See https://ethskills.com for the full catalog.
