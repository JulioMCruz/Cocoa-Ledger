# Cocoa Ledger — Marketplace

NFT marketplace for purchasing AI-verified cacao lots. Buyers see quality scores but private data (GPS, prices, farm identity) is hidden until purchase.

## Quick Start

```bash
cd marketplace
npm install
cp .env.example .env  # Fill with credentials
DEMO_MODE=true node server.js
# Open http://localhost:3000
```

## API Endpoints

All under `/api/cacao-market/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/lot` | Register lot (from Agent analysis) |
| `GET` | `/lots` | List all lots with public AI scores |
| `GET` | `/lot/:id` | Get lot (private fields hidden until purchased) |
| `GET` | `/lot/:id/purchase-stream` | SSE: mint NFT + bridge + reveal with live logs |
| `POST` | `/lot/:id/purchase` | JSON: mint NFT + bridge + reveal |
| `POST` | `/lot/:id/confirm-purchase` | Confirm after on-chain buy |
| `GET` | `/attestations` | AI attestations from public chain |
| `GET` | `/listings` | Active marketplace listings |

## Agent Integration

After the Cocoa Agent analyzes a lot, POST the result:

```bash
curl -X POST http://localhost:3000/api/cacao-market/lot \
  -H "Content-Type: application/json" \
  -d '{ "lotId": 11, "publicMetadata": { ... }, "privateMetadata": { ... } }'
```
