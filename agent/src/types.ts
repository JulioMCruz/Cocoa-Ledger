// === Blockchain Data Types ===

export interface LotData {
  lotId: bigint;
  farmName: string;
  origin: string;
  createdAt: bigint;
  readingsCount: bigint;
  finalized: boolean;
}

export interface ReadingData {
  deviceId: bigint;
  timestamp: bigint;
  temperature: bigint; // int256 — stored as centidegrees (e.g., 2750 = 27.50°C)
  humidity: bigint;
  soilMoisture: bigint;
  soilPH: bigint;
  rainfall: bigint;
  lightIntensity: bigint;
  gpsLocation: string;
}

// === Parsed / Normalized Types ===

export interface ParsedReading {
  deviceId: number;
  timestamp: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  soilPH: number;
  rainfall: number;
  lightIntensity: number;
  gpsLocation: string;
}

export interface ParsedLot {
  lotId: number;
  farmName: string;
  origin: string;
  createdAt: number;
  readingsCount: number;
  finalized: boolean;
}

// === Analysis Response Types ===

export interface DeviceStat {
  deviceId: number;
  readingCount: number;
  avgTemperature: number;
  avgHumidity: number;
  avgSoilPH: number;
  temperatureRange: { min: number; max: number };
  humidityRange: { min: number; max: number };
}

export interface Anomaly {
  type: string;
  deviceId: number;
  timestamp: number;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface PublicMetadata {
  qualityGrade: "S" | "A" | "B" | "C" | "D";
  qualityScore: number;
  avgTemperature: number;
  avgHumidity: number;
  avgSoilPH: number;
  avgRainfall: number;
  cropHealthAssessment: string;
  regionSummary: string;
  harvestAssessment: string;
  recommendedUse: string;
  totalReadings: number;
  farmName: string;
  origin: string;
}

export interface PrivateMetadata {
  deviceStats: DeviceStat[];
  gpsAreaCoverage: string;
  anomalies: Anomaly[];
  priceEstimatePerKg: number;
  labQualityAnalysis: string;
  iotDataHash: string;
  producerRecommendations: string;
}

export interface AnalysisResponse {
  lotId: number;
  farmName: string;
  origin: string;
  readingsCount: number;
  analyzedAt: string;
  publicMetadata: PublicMetadata;
  privateMetadata: PrivateMetadata;
}

// === Price Oracle Types ===

export interface PriceData {
  price: number;            // USD per metric ton
  unit: string;             // "USD/ton"
  pricePerKg: number;       // USD per kg
  source: string;           // data source name
  timestamp: string;        // ISO 8601
  exchange: string;         // exchange name
  contract: string;         // futures contract identifier
  currency: string;         // "USD"
  cached: boolean;          // whether this was served from cache
  sources_checked: string[];// which sources were attempted
}

export interface PriceHistory {
  date: string;             // "YYYY-MM"
  price: number;            // USD per metric ton
  unit: string;
}

export interface OracleConfig {
  cacheTtlMs: number;
  sources: string[];
}

export interface LotValuation {
  lotId: number;
  marketPrice: PriceData;
  lotVolumeKg: number;
  qualityScore: number;
  qualityGrade: string;
  baseValue: number;
  qualityMultiplier: number;
  estimatedValue: number;
  premiumPercentage: number;
  historicalContext: PriceHistory[];
  valuedAt: string;
}
