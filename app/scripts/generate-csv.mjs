import { writeFileSync } from "fs";

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const cacaoTypes = ["Criollo", "Criollo", "Criollo", "Trinitario", "Trinitario", "Forastero"];
const regions = ["Cusco", "San Martin", "Amazonas", "Junin"];
const soilTypes = ["clay_loam", "sandy_loam", "volcanic"];
const cropStatuses = ["healthy", "growing", "flowering", "fruiting"];
const fruitColors = ["yellow", "red", "purple", "orange"];
const fruitSizes = ["small", "medium", "large"];
const harvestSeasons = ["main", "mid-crop"];
const cultivationMethods = ["organic", "organic", "traditional", "agroforestry"];
const pesticideUses = ["none", "none", "limited", "controlled"];
const fermentationTypes = ["box", "heap", "basket"];
const certifications = ["organic", "fair_trade", "rainforest_alliance", "none"];

const header = "device_id,timestamp,cacao_type,region,altitude,temperature,humidity,precipitation,soil_moisture,soil_ph,soil_type,crop_age,crop_status,fruit_color,fruit_size,harvest_season,cultivation_method,pesticide_use,fermentation_type,light_intensity,gps_lat,gps_lng,producer_id,lot_volume_kg,sale_price_usd,lab_quality_score,certification";

const rows = [header];

for (let i = 0; i < 1000; i++) {
  const deviceId = rand(1, 8);
  const day = rand(1, 28);
  const hour = rand(0, 23);
  const min = rand(0, 59);
  const sec = rand(0, 59);
  const ts = `2026-03-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}Z`;

  const region = pick(regions);
  let latBase, lngBase;
  switch (region) {
    case "Cusco": latBase = -13.5; lngBase = -72.0; break;
    case "San Martin": latBase = -6.5; lngBase = -76.3; break;
    case "Amazonas": latBase = -6.2; lngBase = -77.8; break;
    case "Junin": latBase = -11.1; lngBase = -75.3; break;
    default: latBase = -10.0; lngBase = -75.0;
  }

  const lat = (latBase + (Math.random() - 0.5) * 1.5).toFixed(6);
  const lng = (lngBase + (Math.random() - 0.5) * 1.5).toFixed(6);
  const producerId = `PROD-${String(rand(1, 20)).padStart(3, "0")}`;

  const row = [
    deviceId,
    ts,
    pick(cacaoTypes),
    region,
    rand(400, 1200),
    rand(2200, 3000),
    rand(7000, 9500),
    rand(8000, 20000),
    rand(4000, 8000),
    rand(550, 700),
    pick(soilTypes),
    rand(3, 25),
    pick(cropStatuses),
    pick(fruitColors),
    pick(fruitSizes),
    pick(harvestSeasons),
    pick(cultivationMethods),
    pick(pesticideUses),
    pick(fermentationTypes),
    rand(5000, 50000),
    lat,
    lng,
    producerId,
    rand(100, 5000),
    rand(2000, 15000),
    rand(60, 98),
    pick(certifications),
  ].join(",");

  rows.push(row);
}

writeFileSync("public/iot-data.csv", rows.join("\n") + "\n");
console.log(`Generated ${rows.length - 1} rows → public/iot-data.csv`);
