export interface IoTReading {
  device_id: string;
  timestamp: string;
  cacao_type: string;
  region: string;
  altitude: string;
  temperature: string;
  humidity: string;
  precipitation: string;
  soil_moisture: string;
  soil_ph: string;
  soil_type: string;
  crop_age: string;
  crop_status: string;
  fruit_color: string;
  fruit_size: string;
  harvest_season: string;
  cultivation_method: string;
  pesticide_use: string;
  fermentation_type: string;
  light_intensity: string;
  gps_lat: string;
  gps_lng: string;
  producer_id: string;
  lot_volume_kg: string;
  sale_price_usd: string;
  lab_quality_score: string;
  certification: string;
}

export type StorageStatus = "idle" | "creating-lot" | "creating_lot" | "storing" | "finalizing" | "done" | "error";
