import { ethers } from "ethers";
import { LotData, ReadingData, ParsedLot, ParsedReading } from "./types";

// ABI for CocoaLedgerData contract
const CONTRACT_ABI = [
  "function getLot(uint256 lotId) view returns (tuple(uint256 lotId, string farmName, string origin, uint256 createdAt, uint256 readingsCount, bool finalized))",
  "function getReading(uint256 lotId, uint256 index) view returns (tuple(uint256 deviceId, uint256 timestamp, int256 temperature, uint256 humidity, uint256 soilMoisture, uint256 soilPH, uint256 rainfall, uint256 lightIntensity, string gpsLocation))",
  "function nextLotId() view returns (uint256)",
];

let provider: ethers.JsonRpcProvider;
let contract: ethers.Contract;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    const rpc = process.env.PRIVACY_NODE_RPC;
    if (!rpc) throw new Error("PRIVACY_NODE_RPC not set");
    provider = new ethers.JsonRpcProvider(rpc);
  }
  return provider;
}

function getContract(): ethers.Contract {
  if (!contract) {
    const address = process.env.DATA_CONTRACT_ADDRESS;
    if (!address) throw new Error("DATA_CONTRACT_ADDRESS not set");
    contract = new ethers.Contract(address, CONTRACT_ABI, getProvider());
  }
  return contract;
}

/**
 * Parse raw lot data from the contract into a friendly format
 */
function parseLot(raw: LotData): ParsedLot {
  return {
    lotId: Number(raw.lotId),
    farmName: raw.farmName,
    origin: raw.origin,
    createdAt: Number(raw.createdAt),
    readingsCount: Number(raw.readingsCount),
    finalized: raw.finalized,
  };
}

/**
 * Parse raw reading data — values are stored as integers with implied decimals:
 * - temperature: centidegrees (2750 = 27.50°C), signed
 * - humidity: basis points (8200 = 82.00%)
 * - soilMoisture: basis points
 * - soilPH: centiunits (650 = 6.50)
 * - rainfall: centimeters in hundredths (14200 = 142.00mm)
 * - lightIntensity: raw lux value
 */
function parseReading(raw: ReadingData): ParsedReading {
  return {
    deviceId: Number(raw.deviceId),
    timestamp: Number(raw.timestamp),
    temperature: Number(raw.temperature) / 100,
    humidity: Number(raw.humidity) / 100,
    soilMoisture: Number(raw.soilMoisture) / 100,
    soilPH: Number(raw.soilPH) / 100,
    rainfall: Number(raw.rainfall) / 100,
    lightIntensity: Number(raw.lightIntensity),
    gpsLocation: raw.gpsLocation,
  };
}

/**
 * Get the next lot ID (total lots created)
 */
export async function getNextLotId(): Promise<number> {
  const c = getContract();
  const nextId = await c.nextLotId();
  return Number(nextId);
}

/**
 * Fetch lot metadata from the blockchain
 */
export async function getLot(lotId: number): Promise<ParsedLot> {
  const c = getContract();
  const raw = await c.getLot(lotId);
  return parseLot(raw);
}

/**
 * Fetch a single reading for a lot
 */
export async function getReading(
  lotId: number,
  index: number
): Promise<ParsedReading> {
  const c = getContract();
  const raw = await c.getReading(lotId, index);
  return parseReading(raw);
}

/**
 * Fetch all readings for a lot
 */
export async function getAllReadings(
  lotId: number,
  readingsCount: number
): Promise<ParsedReading[]> {
  const c = getContract();

  // Fetch all readings in parallel
  const promises = Array.from({ length: readingsCount }, (_, i) =>
    c.getReading(lotId, i).then(parseReading)
  );

  return Promise.all(promises);
}
