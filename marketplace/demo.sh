#!/bin/bash
# ═══════════════════════════════════════════════════════
# CocoaLedger — Full Pipeline Demo Script
# IoT data → AI analysis → Marketplace → Mint NFT → Reveal
# Outputs explorer URLs for verification
# ═══════════════════════════════════════════════════════

API="${MARKETPLACE_URL:-http://localhost:3000}"
EXPLORER_PRIVACY="https://blockscout-privacy-node-0.rayls.com"
EXPLORER_PUBLIC="https://testnet-explorer.rayls.com"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🌱 CocoaLedger — Full Pipeline Demo"
echo "═══════════════════════════════════════════════════════"
echo ""

# Step 1: Agent sends analyzed lot to marketplace
echo "[$(date +%H:%M:%S)] 📡 Agent sending analyzed lot to marketplace..."
echo "  POST $API/api/cacao-market/lot"

REGISTER=$(curl -s -X POST "$API/api/cacao-market/lot" \
  -H "Content-Type: application/json" \
  -d '{
    "lotId": '$((RANDOM % 1000))',
    "farmName": "Finca La Esperanza",
    "origin": "Tumaco, Nariño, Colombia",
    "readingsCount": 15,
    "analyzedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "publicMetadata": {
      "qualityGrade": "A",
      "qualityScore": 89,
      "scoreBreakdown": {"flavorScore": 92, "processingScore": 88, "iotScore": 86, "farmScore": 90, "diseaseScore": 85},
      "premiumRecommendation": "50-65%",
      "originVerified": true,
      "avgTemperature": 25.8,
      "avgHumidity": 83.2,
      "avgSoilPH": 6.3,
      "avgRainfall": 9.5,
      "cropHealthAssessment": "Excellent crop health. IoT sensors confirm optimal microclimate.",
      "regionSummary": "Pacific coast Colombian cacao region.",
      "harvestAssessment": "Ready for harvest.",
      "recommendedUse": "Premium single-origin dark chocolate (72%+)",
      "totalReadings": 15,
      "farmName": "Finca La Esperanza",
      "origin": "Tumaco, Nariño, Colombia"
    },
    "privateMetadata": {
      "gpsAreaCoverage": "1.7820N, 78.8900W — 4.5 hectares",
      "priceEstimatePerKg": 4.80,
      "iotDataHash": "0x7a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
      "labQualityAnalysis": "High floral notes with pronounced fruity acidity.",
      "anomalies": [],
      "producerRecommendations": "Maintain current 6-day fermentation protocol."
    }
  }')

LOT_ID=$(echo "$REGISTER" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
GRADE=$(echo "$REGISTER" | python3 -c "import sys,json; print(json.load(sys.stdin)['grade'])" 2>/dev/null)
SCORE=$(echo "$REGISTER" | python3 -c "import sys,json; print(json.load(sys.stdin)['score'])" 2>/dev/null)

echo "[$(date +%H:%M:%S)] ✅ Lot #$LOT_ID registered — Grade $GRADE ($SCORE/100)"
echo ""

# Step 2: Show marketplace listing (private data hidden)
echo "[$(date +%H:%M:%S)] 🏪 Marketplace listing (buyer view):"
curl -s "$API/api/cacao-market/lot/$LOT_ID" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'  Variety:     {d.get(\"variety\",\"?\")}')
print(f'  Region:      {d.get(\"region\",\"?\")}')
print(f'  GPS:         🔒 PRIVATE')
print(f'  Price/kg:    🔒 PRIVATE')
print(f'  Cooperative: 🔒 PRIVATE')
" 2>/dev/null
echo ""

# Step 3: Purchase — Mint NFT + Bridge
echo "[$(date +%H:%M:%S)] 💰 Buyer purchasing lot #$LOT_ID..."
echo "[$(date +%H:%M:%S)] ⏳ Minting NFT on Privacy Node..."

PURCHASE=$(curl -s --max-time 30 -X POST "$API/api/cacao-market/lot/$LOT_ID/purchase" \
  -H "Content-Type: application/json" \
  -d '{"buyerAddress": "0x026214C977E0C1B3b1Fa6AF71B79CDe41cD87C5d"}')

NFT_ID=$(echo "$PURCHASE" | python3 -c "import sys,json; print(json.load(sys.stdin)['nftTokenId'])" 2>/dev/null)
MINT_TX=$(echo "$PURCHASE" | python3 -c "import sys,json; print(json.load(sys.stdin)['mintTxHash'])" 2>/dev/null)
BRIDGE_TX=$(echo "$PURCHASE" | python3 -c "import sys,json; print(json.load(sys.stdin)['bridgeTxHash'])" 2>/dev/null)

echo "[$(date +%H:%M:%S)] ✅ NFT #$NFT_ID minted on Privacy Node"
echo "[$(date +%H:%M:%S)] ✅ NFT #$NFT_ID bridged to Public Chain"
echo "[$(date +%H:%M:%S)] 🔓 Private data REVEALED"
echo ""

# Step 4: Show revealed data
echo "[$(date +%H:%M:%S)] 📋 Revealed provenance:"
curl -s "$API/api/cacao-market/lot/$LOT_ID" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'  Region:       {d.get(\"region\",\"?\")}')
print(f'  Cooperative:  {d.get(\"cooperativeName\",\"?\")}')
print(f'  GPS:          {d.get(\"gps\",\"?\")}')
print(f'  Price/kg:     {d.get(\"purchasePricePerKg\",\"?\")}')
print(f'  IoT Hash:     {d.get(\"iotDataHash\",\"?\")}')
" 2>/dev/null
echo ""

# Step 5: Output URLs
echo "═══════════════════════════════════════════════════════"
echo "  📎 VERIFICATION URLS"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Mint TX:    $EXPLORER_PRIVACY/tx/$MINT_TX"
echo "  Bridge TX:  $EXPLORER_PRIVACY/tx/$BRIDGE_TX"
echo "  NFT:        $EXPLORER_PRIVACY/token/$NFT_ADDRESS/instance/$NFT_ID"
echo "  Marketplace: $API"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Demo Complete"
echo "═══════════════════════════════════════════════════════"
echo ""
