---
name: price-oracle
description: Cacao commodity price oracle — fetches live market data from ICE Futures US (cocoa futures CC=F), provides historical context, and estimates lot valuations based on quality scores.
---

# Cacao Price Oracle

## What This Does

The Cocoa Agent acts as a **price oracle** for the cacao commodity market. It fetches real-time and historical cocoa futures prices and uses them to value cacao harvest lots based on quality analysis.

## Data Sources (Priority Order)

1. **Trading Economics** — Real-time cocoa futures from ICE exchange
2. **World Bank Commodity API** — Monthly commodity prices (delayed)
3. **Fallback** — Last known verified price (updated periodically)

## Endpoints

### GET /api/oracle/price
Returns the current cacao market price.

```json
{
  "price": 8145.00,
  "unit": "USD/ton",
  "pricePerKg": 8.145,
  "source": "tradingeconomics",
  "timestamp": "2026-03-29T04:20:00.000Z",
  "exchange": "ICE Futures US",
  "contract": "CC (Cocoa Futures)",
  "currency": "USD",
  "cached": false,
  "sources_checked": ["tradingeconomics"]
}
```

### GET /api/oracle/history
Returns monthly historical prices (ICE Futures US).

```json
{
  "history": [
    { "date": "2025-01", "price": 11050, "unit": "USD/ton" },
    { "date": "2026-03", "price": 8145, "unit": "USD/ton" }
  ],
  "months": 15
}
```

### POST /api/oracle/valuation
Estimates a lot's market value based on volume, quality score, and current market price.

**Request:**
```json
{
  "lotId": 0,
  "lotVolumeKg": 2500,
  "qualityScore": 93,
  "qualityGrade": "A"
}
```

**Response:**
```json
{
  "lotId": 0,
  "marketPrice": { "price": 8145, "pricePerKg": 8.145 },
  "lotVolumeKg": 2500,
  "qualityScore": 93,
  "qualityGrade": "A",
  "baseValue": 20362.50,
  "qualityMultiplier": 1.2,
  "estimatedValue": 24435.00,
  "premiumPercentage": 20,
  "historicalContext": [...]
}
```

## Quality Premium Model

| Grade | Score   | Multiplier | Premium |
|-------|---------|-----------|---------|
| S     | 95-100  | 1.35x     | +35%    |
| A     | 85-94   | 1.20x     | +20%    |
| B     | 70-84   | 1.05x     | +5%     |
| C     | 50-69   | 0.90x     | -10%    |
| D     | 0-49    | 0.70x     | -30%    |

## Caching

- Prices are cached for 5 minutes (configurable via `ORACLE_CACHE_TTL_MS`)
- Cached responses include `"cached": true`
- Historical data is static reference data (no caching needed)

## Integration with Lot Analysis

When the agent analyzes a lot via `/api/analyze-lot`, the price oracle data can be combined with the quality assessment to produce a full valuation. The `priceEstimatePerKg` in the analysis response uses the oracle's market data adjusted for quality.
