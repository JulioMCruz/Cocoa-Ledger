// Cocoa Ledger constants

export const APP_VERSION = "0.6.0";

export const EXPLORER_URLS = {
  privacyNode: "https://blockscout-privacy-node-0.rayls.com",
  publicChain: "https://testnet-explorer.rayls.com",
} as const;

export const CHAIN_IDS = {
  privacyNode: 800000,
  publicChain: 7295799,
} as const;

export const QUALITY_GRADES = {
  S: { min: 95, max: 100, label: "Exceptional", color: "#f59e0b" },
  A: { min: 85, max: 94, label: "Excellent", color: "#22c55e" },
  B: { min: 70, max: 84, label: "Good", color: "#3b82f6" },
  C: { min: 50, max: 69, label: "Fair", color: "#f97316" },
  D: { min: 0, max: 49, label: "Poor", color: "#ef4444" },
} as const;
