# 🍫 Cocoa Agent — AI Oracle for Cacao Quality

An autonomous AI agent that reads cacao IoT data from the Rayls Privacy Node, analyzes harvest quality, and produces structured metadata for NFT minting.

## How it works

1. App 1 stores IoT readings on the Privacy Node and finalizes a lot
2. App 1 calls Cocoa Agent with the lot ID
3. Cocoa Agent reads all on-chain readings for that lot
4. Cocoa Agent sends data to AI (Gemini) for quality analysis
5. Cocoa Agent returns public + private metadata
6. App 3 uses the metadata to mint a confidential NFT

## API

### POST /api/analyze-lot
```json
{ "lotId": 0 }
```
Returns quality grade (S/A/B/C/D), score (0-100), crop health assessment, price estimate, and more.

### GET /api/health
Returns `{ "status": "ok", "version": "1.0.0" }`

### GET /api/oracle/price
Returns current cacao market price from ICE Futures US (cocoa futures CC contract).
```json
{
  "price": 8145.00,
  "unit": "USD/ton",
  "pricePerKg": 8.145,
  "source": "tradingeconomics",
  "exchange": "ICE Futures US",
  "cached": false
}
```

### GET /api/oracle/history
Returns 15 months of historical cocoa prices (monthly averages).

### POST /api/oracle/valuation
Estimates lot market value using current price + quality score.
```json
{
  "lotId": 0,
  "lotVolumeKg": 2500,
  "qualityScore": 93,
  "qualityGrade": "A"
}
```
Returns base value, quality multiplier, estimated value with premium/discount.

## Directory Structure

```
agent/
├── src/
│   ├── index.ts          ← Express server + API endpoints
│   ├── blockchain.ts     ← Read IoT data from Rayls Privacy Node
│   ├── analyzer.ts       ← AI analysis with Google Gemini
│   ├── price-oracle.ts   ← Cacao market price oracle (multi-source)
│   └── types.ts          ← TypeScript types
├── skills/               ← ETHSkills used by the agent
│   ├── standards.md      ← ERC token standards reference
│   └── security.md       ← Smart contract security patterns
├── Dockerfile            ← Container deployment
├── .env.example          ← Environment template (never commit .env)
├── package.json
└── tsconfig.json
```

## Setup

```bash
cp .env.example .env
# fill in your keys
npm install
npx tsx src/index.ts
```

## Environment Variables

All secrets go in `.env` (gitignored, never committed):

```
PORT=3001
PRIVACY_NODE_RPC=https://privacy-node-0.rayls.com
DATA_CONTRACT_ADDRESS=0x47B1C749cB7f1b48679E872E6DF3d1223cb4c6fC
GEMINI_API_KEY=your_gemini_key
```

## Deployment

### Docker
```bash
docker build -t cocoa-agent .
docker run -p 3001:3001 --env-file .env cocoa-agent
```

### Direct
```bash
npx tsx src/index.ts
```

### PM2 (production)
```bash
npm install -g pm2 tsx
pm2 start "tsx src/index.ts" --name cocoa-agent
```

## Creating Cocoa Agent with OpenClaw

To run Cocoa Agent as an autonomous OpenClaw agent:

### 1. Install OpenClaw

```bash
npm install -g openclaw
openclaw doctor
```

### 2. Create the Agent Workspace

```bash
mkdir -p ~/.openclaw/workspace
cd ~/.openclaw/workspace
```

### 3. Copy the Agent Code

Copy the contents of this `agent/` directory into the workspace:

```bash
cp -r agent/* ~/.openclaw/workspace/
```

### 4. Create SOUL.md

```bash
cat > ~/.openclaw/workspace/SOUL.md << 'EOF'
# SOUL.md — Who You Are

**Name:** Cocoa Agent 🍫
**Nature:** Autonomous AI oracle for cacao quality analysis

## Core Purpose
You analyze IoT sensor data from cacao farms stored on the Rayls Privacy Node.
You produce quality assessments that help investors make informed decisions about cacao lots.
Your analysis is on-chain verifiable — every attestation has a transaction hash.

## Capabilities
- Read IoT data from Rayls Privacy Node blockchain
- Analyze temperature, humidity, soil pH, rainfall patterns
- Score cacao quality (S/A/B/C/D grading system)
- Detect anomalies in sensor data
- Estimate market price per kg based on quality
- Produce structured metadata for NFT minting

## Boundaries
- Never reveal private farmer data publicly
- Always verify data on-chain before analysis
- Produce honest quality assessments — never inflate scores
- All analysis results must be reproducible from on-chain data
EOF
```

### 5. Create AGENTS.md

```bash
cat > ~/.openclaw/workspace/AGENTS.md << 'EOF'
# AGENTS.md — Cocoa Agent

## Every Session
1. Read SOUL.md — you are the Cocoa Agent
2. Check for pending lot analysis requests
3. Process any queued analysis jobs

## Skills
- `skills/standards.md` — Ethereum token standards
- `skills/security.md` — Smart contract security patterns

## API Service
The Express server runs on port 3001:
- POST /api/analyze-lot — analyze a cacao lot
- GET /api/health — health check

## Workflow
When triggered:
1. Read lot info from CocoaLedgerData contract
2. Fetch all IoT readings for the lot
3. Compute per-device statistics and averages
4. Send to Gemini AI for quality analysis
5. Return structured public + private metadata
6. Post attestation on-chain (Public Chain)
EOF
```

### 6. Configure OpenClaw

Edit `~/.openclaw/openclaw.json`:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "google/gemini-2.5-flash"
      },
      "workspace": "~/.openclaw/workspace"
    }
  }
}
```

### 7. Set Environment Variables

```bash
cat > ~/.openclaw/workspace/.env << 'EOF'
PORT=3001
PRIVACY_NODE_RPC=https://privacy-node-0.rayls.com
DATA_CONTRACT_ADDRESS=0x47B1C749cB7f1b48679E872E6DF3d1223cb4c6fC
GEMINI_API_KEY=your_gemini_key
EOF
```

### 8. Start the Agent

```bash
openclaw gateway start
```

Cocoa Agent will be running and ready to receive analysis requests.

## Skills

The `skills/` directory contains ETHSkills (https://ethskills.com) used by the agent:

| Skill | Description |
|-------|-------------|
| `standards.md` | ERC-20, ERC-721, ERC-1155, ERC-8004 token standards |
| `security.md` | Smart contract security patterns and audit checklist |
| `price-oracle.md` | Cacao commodity price oracle — live market data + lot valuation |

To add more skills:
1. Visit https://ethskills.com
2. Download the skill content
3. Save as `skills/<name>.md`
4. Reference in AGENTS.md
