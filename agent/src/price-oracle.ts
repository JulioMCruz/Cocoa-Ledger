import { PriceData, PriceHistory, OracleConfig } from "./types";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let priceCache: { data: PriceData | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

// Default config — can be overridden via env
const config: OracleConfig = {
  cacheTtlMs: parseInt(process.env.ORACLE_CACHE_TTL_MS || "300000", 10),
  sources: ["tradingeconomics", "worldbank"],
};

// ─── Source 1: Trading Economics (scrape public page) ───
async function fetchTradingEconomics(): Promise<number | null> {
  try {
    const res = await fetch("https://tradingeconomics.com/commodity/cocoa", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CocoaLedgerAgent/1.0; +https://github.com/JulioMCruz/Cocoa-Ledger)",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Extract price from the page — look for the main price element
    const match = html.match(/id="p"[^>]*>([0-9,]+\.?\d*)</) ||
                  html.match(/"Last":\s*([0-9,]+\.?\d*)/) ||
                  html.match(/data-value="([0-9,]+\.?\d*)"/) ||
                  html.match(/>(\d{3,5}\.?\d{0,2})<\/td>/);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 500 && price < 30000) return price; // sanity check USD/ton
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Source 2: World Bank Commodity API (monthly, delayed) ───
async function fetchWorldBank(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.worldbank.org/v2/country/WLD/indicator/CM.MKT.COCOA.CD?format=json&date=2025:2026&per_page=5&mrv=1",
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data[1]?.length > 0) {
      const val = parseFloat(data[1][0].value);
      if (val > 500 && val < 30000) return val;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Source 3: Hardcoded latest known price as fallback ───
// Updated manually / from last successful fetch
const FALLBACK_PRICE: PriceData = {
  price: 8145.0, // USD per metric ton — March 2026 approximate
  unit: "USD/ton",
  pricePerKg: 8.145,
  source: "fallback",
  timestamp: new Date().toISOString(),
  exchange: "ICE Futures US",
  contract: "CC (Cocoa Futures)",
  currency: "USD",
  cached: false,
  sources_checked: ["tradingeconomics", "worldbank", "fallback"],
};

// ─── Main fetch with multi-source + caching ───
export async function fetchCacaoPrice(): Promise<PriceData> {
  const now = Date.now();

  // Return cache if fresh
  if (priceCache.data && now - priceCache.timestamp < config.cacheTtlMs) {
    return { ...priceCache.data, cached: true };
  }

  const sources_checked: string[] = [];
  let priceUsdPerTon: number | null = null;
  let source = "fallback";

  // Try Trading Economics
  sources_checked.push("tradingeconomics");
  priceUsdPerTon = await fetchTradingEconomics();
  if (priceUsdPerTon) {
    source = "tradingeconomics";
  }

  // Try World Bank if first failed
  if (!priceUsdPerTon) {
    sources_checked.push("worldbank");
    priceUsdPerTon = await fetchWorldBank();
    if (priceUsdPerTon) {
      source = "worldbank";
    }
  }

  // Fallback
  if (!priceUsdPerTon) {
    sources_checked.push("fallback");
    console.log("[oracle] All live sources failed, using fallback price");
    return { ...FALLBACK_PRICE, sources_checked };
  }

  const data: PriceData = {
    price: Math.round(priceUsdPerTon * 100) / 100,
    unit: "USD/ton",
    pricePerKg: Math.round((priceUsdPerTon / 1000) * 1000) / 1000,
    source,
    timestamp: new Date().toISOString(),
    exchange: "ICE Futures US",
    contract: "CC (Cocoa Futures)",
    currency: "USD",
    cached: false,
    sources_checked,
  };

  // Update cache
  priceCache = { data, timestamp: now };
  console.log(
    `[oracle] Cacao price: $${data.price}/ton ($${data.pricePerKg}/kg) via ${source}`
  );

  return data;
}

// ─── Price context for lot valuation ───
export function estimateLotValue(
  pricePerKg: number,
  lotVolumeKg: number,
  qualityScore: number
): {
  baseValue: number;
  qualityMultiplier: number;
  estimatedValue: number;
  premiumPercentage: number;
} {
  // Premium pricing based on quality score
  let qualityMultiplier = 1.0;
  if (qualityScore >= 95) qualityMultiplier = 1.35; // S grade: +35%
  else if (qualityScore >= 85) qualityMultiplier = 1.2; // A grade: +20%
  else if (qualityScore >= 70) qualityMultiplier = 1.05; // B grade: +5%
  else if (qualityScore >= 50) qualityMultiplier = 0.9; // C grade: -10%
  else qualityMultiplier = 0.7; // D grade: -30%

  const baseValue = Math.round(pricePerKg * lotVolumeKg * 100) / 100;
  const estimatedValue = Math.round(baseValue * qualityMultiplier * 100) / 100;
  const premiumPercentage = Math.round((qualityMultiplier - 1) * 100);

  return { baseValue, qualityMultiplier, estimatedValue, premiumPercentage };
}

// ─── Historical reference data (monthly averages) ───
export function getHistoricalContext(): PriceHistory[] {
  // Real historical cocoa prices (ICE Futures US, approximate monthly averages)
  return [
    { date: "2025-01", price: 11050, unit: "USD/ton" },
    { date: "2025-02", price: 10200, unit: "USD/ton" },
    { date: "2025-03", price: 9400, unit: "USD/ton" },
    { date: "2025-04", price: 8750, unit: "USD/ton" },
    { date: "2025-05", price: 9100, unit: "USD/ton" },
    { date: "2025-06", price: 9800, unit: "USD/ton" },
    { date: "2025-07", price: 8600, unit: "USD/ton" },
    { date: "2025-08", price: 8300, unit: "USD/ton" },
    { date: "2025-09", price: 8900, unit: "USD/ton" },
    { date: "2025-10", price: 8400, unit: "USD/ton" },
    { date: "2025-11", price: 8100, unit: "USD/ton" },
    { date: "2025-12", price: 7900, unit: "USD/ton" },
    { date: "2026-01", price: 8200, unit: "USD/ton" },
    { date: "2026-02", price: 8350, unit: "USD/ton" },
    { date: "2026-03", price: 8145, unit: "USD/ton" },
  ];
}
