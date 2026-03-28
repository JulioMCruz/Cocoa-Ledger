export const COCOA_LEDGER_DATA_ADDRESS =
  (process.env.NEXT_PUBLIC_DATA_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x47B1C749cB7f1b48679E872E6DF3d1223cb4c6fC";

export const cocoaLedgerDataAbi = [
  {
    name: "createLot",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "farmName", type: "string" },
      { name: "origin", type: "string" },
    ],
    outputs: [{ name: "lotId", type: "uint256" }],
  },
  {
    name: "storeReading",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "lotId", type: "uint256" },
      { name: "deviceId", type: "uint256" },
      { name: "temperature", type: "int256" },
      { name: "humidity", type: "uint256" },
      { name: "soilMoisture", type: "uint256" },
      { name: "soilPH", type: "uint256" },
      { name: "rainfall", type: "uint256" },
      { name: "lightIntensity", type: "uint256" },
      { name: "gpsLocation", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "finalizeLot",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "lotId", type: "uint256" }],
    outputs: [],
  },
] as const;
