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

## Why Blockchain Instead of a Database?

A traditional database could store IoT data. But it can't solve the **trust problem**:

| Problem | Database | Rayls Privacy Node |
|---------|----------|-------------------|
| Farmer claims "organic" | No way to verify | Every reading is an immutable transaction |
| Intermediary alters quality data | DB admin can edit records | Nobody can modify on-chain data |
| Buyer wants proof of conditions | Trust the seller's word | Verify against blockchain transactions |
| Auditor needs history | Export from DB (tamperable) | Full on-chain audit trail |
| Cross-border trade compliance | Each party has own DB | Shared verifiable ledger |

The Privacy Node specifically solves what a public blockchain cannot:
- **Raw IoT data is commercially sensitive** — a competitor could undercut the farmer's pricing if they see real conditions
- **GPS coordinates reveal farm locations** — security risk in regions with land disputes
- **Volume and pricing data** — gives unfair negotiation advantage if public
- **Regulatory compliance** — GDPR-like data protection requirements in some markets

The Rayls Privacy Node is **gasless** (zero transaction cost), making it viable to store thousands of IoT readings that would be prohibitively expensive on Ethereum mainnet.

## How Quality Scoring Works

The AI agent (Cocoa Agent) uses a multi-factor scoring system based on cacao agronomics:

### Grading Criteria

| Grade | Score | Meaning | Typical Use |
|-------|-------|---------|------------|
| **S** | 95-100 | Exceptional — perfect growing conditions across all metrics | Single-origin premium chocolate, auction lots |
| **A** | 85-94 | Excellent — consistently good conditions with minor variations | Fine chocolate, specialty couverture |
| **B** | 70-84 | Good — generally acceptable with some deviations | Quality blends, mid-range chocolate |
| **C** | 50-69 | Fair — notable issues in one or more metrics | Bulk processing, commodity market |
| **D** | 0-49 | Poor — significant problems detected | Requires intervention, not market-ready |

### Scoring Factors

Each factor is weighted based on its impact on cacao quality:

| Factor | Ideal Range | Impact on Score |
|--------|------------|----------------|
| **Temperature** | 20-30°C | High — affects bean development and flavor precursors |
| **Humidity** | 70-90% | High — too low = stress, too high = disease risk |
| **Soil pH** | 5.0-7.5 | Medium — affects nutrient absorption |
| **Rainfall** | 100-200mm/month | Medium — drought or flooding impacts yield |
| **Soil Moisture** | 40-80% | Medium — root health indicator |
| **Light Intensity** | 10K-40K lux | Low — cacao prefers partial shade |
| **Cross-device consistency** | Low variance | High — inconsistency suggests micro-problems |
| **Anomaly count** | Zero | High — spikes indicate equipment failure or events |

The AI analyzes all readings together, computing:
1. **Averages** per metric across all devices
2. **Per-device statistics** to detect inconsistencies
3. **Anomaly detection** — readings outside expected ranges
4. **Temporal patterns** — is quality improving or degrading over time?
5. **Regional benchmarks** — how do conditions compare to known premium cacao regions?

The final score is the AI's holistic assessment considering all factors. Two lots with identical temperature but different soil pH and humidity patterns will score differently.

## Why Buyers Use Blockchain for Harvest Purchases

This isn't just buying chocolate — it's **commodity trading with verifiable quality data**.

### The Buyer's Problem Today

A cacao buyer (chocolate manufacturer, commodity trader, specialty roaster) currently:
1. Receives a sample from a broker
2. Sends it to a lab ($200-500, takes 1-2 weeks)
3. Negotiates price based on the lab report
4. Has no visibility into growing conditions
5. Discovers quality issues only after receiving the full shipment

### What Cocoa Ledger Changes

```
Traditional: Sample → Lab → Negotiate → Ship → Hope for the best
Cocoa Ledger: Browse marketplace → See AI-verified growing data → Buy with confidence
```

**Before purchase (public metadata):**
- Quality grade and score based on real IoT data
- Growing conditions summary (not just a lab test of one sample)
- AI assessment of crop health and recommended use
- On-chain verification that data hasn't been tampered with

**After purchase (private metadata unlocked):**
- Exact farm location for supply chain planning
- Per-device sensor data for due diligence
- Price benchmark per kg based on quality
- Producer recommendations (feedback loop to farmer)
- Full IoT data hash for independent verification

### Why This Works on Blockchain

1. **Trust without intermediaries** — The buyer trusts the data because it's on-chain and AI-verified, not because a broker says it's good
2. **Instant settlement** — Buy the NFT, receive the data. No weeks of negotiation
3. **Provenance is permanent** — The entire history of that lot (from seed to sale) is immutable
4. **Secondary market** — Buyers can resell harvest rights to other manufacturers
5. **DeFi integration** — Harvest NFTs can be used as collateral for trade financing

### The NFT Represents a Real Asset

The NFT is not speculative art — it's a **digital deed to a cacao harvest lot** with:
- Verifiable growing conditions (thousands of IoT readings)
- AI quality certification
- Private data access rights
- Transferable ownership

When a chocolate manufacturer buys this NFT, they're buying **verified, data-backed access to a specific harvest** — something that doesn't exist in today's cacao market.

## Architecture

```mermaid
graph TB
    subgraph "App 1 — Farmer Dashboard (Netlify)"
        A[IoT Devices - simulated CSV] -->|sensor data| B[NextJS Frontend]
        B -->|chunked API calls| C[Netlify Server Functions]
        C -->|auto-signed TX, gasless| D[Rayls Privacy Node]
        D -->|lot finalized| E[Trigger Agent via proxy]
    end

    subgraph "App 2 — Cocoa Agent (VPS)"
        E -->|POST /api/analyze-lot| F[Read all TX from blockchain]
        F -->|raw IoT data| G[Google Gemini 2.5 AI]
        G -->|quality metadata| H[Return public + private data]
    end

    subgraph "App 3 — NFT Marketplace"
        H -->|metadata| I[Mint Confidential NFT]
        I -->|bridge to public| J[Public Chain Marketplace]
        J -->|investor buys| K[Reveal Private Data]
    end

    subgraph "Rayls Infrastructure"
        D --- L[Privacy Node - Chain 800000 - Gasless]
        J --- M[Public Chain - Chain 7295799 - USDr gas]
        L <-->|relayer - lock/mint| M
    end

    style A fill:#22c55e,color:#000
    style G fill:#3b82f6,color:#fff
    style I fill:#a855f7,color:#fff
    style L fill:#1e293b,color:#fff
    style M fill:#1e293b,color:#fff
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
    participant API as Netlify API (server-side)
    participant PN as Rayls Privacy Node
    participant Agent as App 2 - Cocoa Agent
    participant Market as App 3 - Marketplace

    Farmer->>App: Connect wallet (RainbowKit)
    App-->>Farmer: Redirect to dashboard

    Farmer->>App: Select dataset (10/50/100/1000 readings)
    Farmer->>App: Click "Read IoT Farm Devices"
    App->>App: Load CSV, generate Job ID
    App-->>Farmer: Display IoT readings in table

    Farmer->>App: Click "Store on Privacy Node"
    App->>API: POST /api/store-chunk {action: create_lot}
    API->>PN: createLot("Finca El Llano", "Colombia")
    PN-->>API: Lot ID + TX hash
    API-->>App: Lot created
    App-->>Farmer: Show lot ID in progress panel

    loop Chunks of 5 readings
        App->>API: POST /api/store-chunk {action: store_readings, chunk}
        API->>PN: storeReading() x5 (auto-signed, gasless)
        PN-->>API: TX hashes confirmed
        API-->>App: Chunk results
        App-->>Farmer: Update progress bar + table row status (green checkmarks)
    end

    App->>API: POST /api/store-chunk {action: finalize}
    API->>PN: finalizeLot(lotId)
    PN-->>API: TX hash
    API-->>App: Lot finalized
    App-->>Farmer: Show "Lot finalized" in process log

    Note over App,Agent: Agent Interaction Phase
    App->>API: POST /api/analyze-lot {lotId}
    API->>Agent: Forward to Cocoa Agent
    Agent->>PN: Read all readings for lot
    PN-->>Agent: Return IoT data (all readings)
    Agent->>Agent: Compute averages, per-device stats
    Agent->>Agent: AI analysis (Google Gemini 2.5)
    Agent-->>API: Quality metadata (public + private)
    API-->>App: Analysis results
    App-->>Farmer: Display Cocoa Agent log + AI Quality Analysis card

    Note over Agent,Market: NFT Phase (App 3)
    Agent->>Market: POST metadata for NFT minting
    Market->>PN: Mint confidential NFT with private metadata
    Market->>Market: Bridge to public chain + list on marketplace
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
    Market-->>Investor: Avg Temp: 27.5°C | Region: Colombia
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
    participant Client as Browser Client
    participant API as Netlify API
    participant Data as CocoaLedgerData.sol
    participant Agent as Cocoa Agent
    participant Attest as Attestation.sol
    participant NFT as CocoaLedgerNFT.sol
    participant Market as Marketplace.sol

    Note over Client,Data: Phase 1 — Store IoT Data (Privacy Node, gasless)
    Client->>API: POST /api/store-chunk {create_lot}
    API->>Data: createLot(farmName, origin)
    Data-->>API: lotId

    loop Chunks of 5 readings (no timeout)
        Client->>API: POST /api/store-chunk {store_readings, chunk}
        API->>Data: storeReading() x5 (auto-signed)
        Data-->>API: TX hashes
        API-->>Client: chunk results + progress
    end

    Client->>API: POST /api/store-chunk {finalize}
    API->>Data: finalizeLot(lotId)

    Note over Client,Agent: Phase 2 — AI Analysis (Cocoa Agent)
    Client->>API: POST /api/analyze-lot {lotId}
    API->>Agent: Forward request
    Agent->>Data: Read all readings from blockchain
    Agent->>Agent: AI quality analysis (Gemini 2.5)
    Agent-->>API: Public + Private metadata
    API-->>Client: Display analysis results

    Note over Agent,Attest: Phase 3 — On-chain Attestation (Public Chain)
    Agent->>Attest: attest(token, approved, reason, score)

    Note over Agent,NFT: Phase 4 — Mint & Bridge (Privacy → Public)
    Agent->>NFT: mint(to, tokenId)
    NFT->>NFT: teleportToPublicChain(to, tokenId, chainId)

    Note over NFT,Market: Phase 5 — List & Trade (Public Chain)
    Market->>Market: list(token, assetType, tokenId, amount, price)
    Market->>Market: buy(listingId) → reveal private data
```

## Technical Details

### Chunked Transaction Processing
The app stores IoT readings in **chunks of 5** to avoid serverless function timeouts:
- Each chunk is a separate API call (~5-8 seconds)
- Server-side auto-signing (no MetaMask popups for 1000 transactions)
- Privacy Node is gasless — zero transaction fees
- Progress updates after each chunk completes
- Cancel support between chunks

### Three Log Sections
1. **Process Log** — Every blockchain transaction with clickable Blockscout links
2. **Cocoa Agent Interaction** — AI agent connection, analysis steps, scoring details
3. **AI Quality Analysis Card** — Grade, score, price estimate, recommendations

### Browser Console Logs
Detailed colored console output for judges — every step is logged with emojis and clickable explorer links.

## Project Structure

```
cocoa-ledger/
├── app/                         ← NextJS farmer dashboard (Netlify)
│   ├── src/app/page.tsx         ← Landing page (hero, CTA)
│   ├── src/app/dashboard/       ← Authenticated dashboard
│   ├── src/app/api/             ← Server API routes
│   │   ├── store-chunk/         ← Chunked blockchain storage
│   │   ├── store-stream/        ← SSE streaming (fallback)
│   │   └── analyze-lot/         ← Agent proxy (HTTPS → HTTP)
│   ├── src/components/          ← UI: table, storage panel, logs
│   ├── src/lib/                 ← Chain config, contract ABI, types
│   └── public/                  ← IoT CSV datasets (10/50/100/1000)
├── agent/                       ← Cocoa Agent — AI oracle (VPS)
│   ├── src/index.ts             ← Express server
│   ├── src/blockchain.ts        ← Read from Privacy Node
│   ├── src/analyzer.ts          ← Gemini AI analysis
│   ├── src/types.ts             ← TypeScript types
│   ├── skills/                  ← ETHSkills (standards, security)
│   ├── Dockerfile               ← Container deployment
│   └── README.md                ← OpenClaw agent setup guide
├── contracts/                   ← Foundry smart contracts
│   ├── src/CocoaLedgerData.sol  ← IoT storage (lots, readings)
│   ├── src/CocoaLedgerToken.sol ← Bridgeable ERC20
│   ├── src/CocoaLedgerNFT.sol   ← Bridgeable ERC721
│   ├── src/Attestation.sol      ← AI attestation registry
│   ├── src/Marketplace.sol      ← Escrow marketplace
│   └── script/                  ← Deploy scripts
└── docs/                        ← Deployment and technical guides
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
