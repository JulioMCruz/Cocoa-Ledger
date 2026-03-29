# 🌱 Cocoa Ledger

Bringing transparency and trust to the cacao supply chain through IoT, blockchain privacy, and AI-powered quality analysis.

## The Problem

Cacao farmers in Latin America face critical challenges:
- No traceability — buyers can't verify origin or quality
- Low income — intermediaries capture most of the value
- No technology — manual processes, no data history
- Quality issues — inconsistent fermentation, diseases, no monitoring

Meanwhile, global cacao scarcity is increasing due to climate change, aging crops, and farmer abandonment.

## The Solution

Cocoa Ledger transforms each cacao harvest lot into a verifiable digital asset:

1. **IoT sensors** monitor farm conditions (temperature, humidity, soil, rainfall)
2. **Private blockchain** stores all raw data — only the farmer can see it
3. **AI agent** analyzes the data and scores harvest quality
4. **Confidential NFT** packages the analysis — investors buy to unlock private data

## Architecture

```mermaid
graph TB
    subgraph "App 1 — Farmer Dashboard"
        A[IoT Devices] -->|sensor data| B[Farmer App]
        B -->|store readings| C[Rayls Privacy Node]
        C -->|lot finalized| D[Trigger Agent]
    end

    subgraph "App 2 — AI Oracle Agent"
        D -->|lot ID| E[Read Blockchain]
        E -->|raw IoT data| F[AI Analysis - Gemini]
        F -->|quality metadata| G[Return Results]
    end

    subgraph "App 3 — NFT Marketplace"
        G -->|public + private metadata| H[Mint NFT]
        H -->|list on marketplace| I[Public Chain]
        I -->|buy NFT| J[Reveal Private Data]
    end

    subgraph "Rayls Infrastructure"
        C --- K[Privacy Node - Chain 800000]
        I --- L[Public Chain - Chain 7295799]
        K <-->|bridge / relayer| L
    end

    style A fill:#22c55e,color:#000
    style F fill:#3b82f6,color:#fff
    style H fill:#a855f7,color:#fff
    style K fill:#1e293b,color:#fff
    style L fill:#1e293b,color:#fff
```

## Data Flow

```mermaid
graph LR
    A[🌡️ IoT Sensors] --> B[📱 Farmer App]
    B --> C[🔒 Privacy Node]
    C --> D[🤖 AI Agent]
    D --> E[🎨 NFT Mint]
    E --> F[🏪 Marketplace]
    F --> G[💰 Investor Buys]
    G --> H[🔓 Data Revealed]
```

## Privacy Model

```mermaid
graph TB
    subgraph "Private — Only Farmer Sees"
        A[Raw IoT readings]
        B[GPS coordinates]
        C[Producer identity]
        D[Sale prices]
        E[Lab results]
    end

    subgraph "Public — Everyone Sees"
        F[Quality Grade S/A/B/C/D]
        G[Quality Score 0-100]
        H[Avg Temperature]
        I[Region - general]
        J[Recommended Use]
    end

    subgraph "Post-Purchase — NFT Buyer Sees"
        K[Consolidated IoT report]
        L[Per-device statistics]
        M[Anomaly detection]
        N[Price estimate per kg]
        O[Producer recommendations]
    end

    A --> F
    A --> K
    B --> M
    C --> O
    E --> N
```

## Farmer Journey

```mermaid
sequenceDiagram
    actor Farmer
    participant App as App 1 - Farmer Dashboard
    participant PN as Rayls Privacy Node
    participant Agent as App 2 - AI Oracle
    participant Market as App 3 - Marketplace

    Farmer->>App: Connect wallet
    App-->>Farmer: Show dashboard

    Farmer->>App: Click "Read IoT Farm Devices"
    App->>App: Load sensor data (CSV simulation)
    App-->>Farmer: Display 1000 IoT readings

    Farmer->>App: Click "Store on Privacy Node"
    App->>PN: createLot("Finca Dorada", "Peru")
    PN-->>App: Lot ID created

    loop For each IoT reading
        App->>PN: storeReading(lotId, deviceId, temp, humidity, ...)
        PN-->>App: TX hash confirmed
        App-->>Farmer: Update progress bar + table status
    end

    App->>PN: finalizeLot(lotId)
    PN-->>App: Lot finalized

    App->>Agent: POST /api/analyze-lot {lotId}
    Agent->>PN: Read all readings for lot
    PN-->>Agent: Return IoT data
    Agent->>Agent: AI analysis (Gemini)
    Agent-->>App: Quality metadata (Grade A, Score 93, ...)
    App-->>Farmer: Display AI analysis results

    Agent->>Market: POST metadata for NFT minting
    Market->>PN: Mint confidential NFT
    Market->>Market: List on public marketplace
```

## Investor Journey

```mermaid
sequenceDiagram
    actor Investor
    participant Market as App 3 - Marketplace
    participant PC as Rayls Public Chain
    participant PN as Rayls Privacy Node

    Investor->>Market: Browse marketplace
    Market-->>Investor: Show available cacao lots

    Note over Investor,Market: Investor sees PUBLIC metadata only
    Market-->>Investor: Grade: A | Score: 93/100
    Market-->>Investor: Avg Temp: 27.5°C | Region: Peru
    Market-->>Investor: Recommended: Fine chocolate

    Investor->>Market: Buy NFT (pay with USDr)
    Market->>PC: Transfer USDr to seller
    PC-->>Market: Payment confirmed

    Market->>PN: Grant access to private data
    PN-->>Investor: Reveal private metadata

    Note over Investor,PN: Investor now sees PRIVATE metadata
    Investor-->>Investor: Per-device IoT statistics
    Investor-->>Investor: GPS coordinates & area coverage
    Investor-->>Investor: Anomaly detection report
    Investor-->>Investor: Price estimate: $4.50/kg
    Investor-->>Investor: Lab quality analysis
    Investor-->>Investor: Producer recommendations
```

## Smart Contract Interaction

```mermaid
sequenceDiagram
    participant App as Farmer App
    participant Data as CocoaLedgerData.sol
    participant Token as CocoaLedgerToken.sol
    participant NFT as CocoaLedgerNFT.sol
    participant Attest as Attestation.sol
    participant Market as Marketplace.sol

    Note over App,Data: Phase 1 — Store IoT Data (Privacy Node)
    App->>Data: createLot(farmName, origin)
    loop 1000 readings
        App->>Data: storeReading(lotId, deviceId, temp, ...)
    end
    App->>Data: finalizeLot(lotId)

    Note over App,Attest: Phase 2 — AI Attestation (Public Chain)
    App->>Attest: attest(token, approved, reason, score)

    Note over App,NFT: Phase 3 — Mint & Bridge (Privacy → Public)
    App->>NFT: mint(to, tokenId)
    App->>NFT: teleportToPublicChain(to, tokenId, chainId)

    Note over App,Market: Phase 4 — List & Trade (Public Chain)
    App->>Market: list(token, assetType, tokenId, amount, price)
    App->>Market: buy(listingId)
```

## Project Structure

```
cocoa-ledger/
├── app/                    ← NextJS farmer dashboard
│   ├── src/app/            ← Landing page + dashboard
│   ├── src/components/     ← UI components
│   └── public/             ← IoT CSV data
├── agent/                  ← AI oracle service
│   ├── src/                ← Express API + Gemini analysis
│   ├── skills/             ← ETHSkills references
│   └── Dockerfile          ← Container deployment
└── contracts/              ← Foundry smart contracts
    ├── src/                ← CocoaLedger contracts
    └── script/             ← Deploy and interaction scripts
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, Tailwind, shadcn/ui, RainbowKit |
| Contracts | Solidity 0.8.24, Foundry, Rayls Protocol SDK |
| Agent | TypeScript, Express, Google Gemini |
| Privacy Chain | Rayls Privacy Node (gasless, EVM) |
| Public Chain | Rayls Public Chain (reth-based) |
| Deploy | Netlify (app), Hetzner VPS (agent) |

## Quick Start

```bash
# Contracts
cd contracts && forge install && npm install
forge script script/DeployCocoaLedger.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy

# App
cd app && npm install
cp .env.local.example .env.local  # fill in values
npm run dev

# Agent
cd agent && npm install
cp .env.example .env  # fill in keys
npx tsx src/index.ts
```

## Built for EthCC 26 — Rayls Hackathon #2

Challenge: Autonomous Institution Agent + Confidential NFT Reveal
