// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CocoaLedgerData
/// @notice Full lifecycle on-chain storage for cacao lots on the Rayls Privacy Node.
///         Covers: IoT readings → AI validation → Harvest → Post-harvest → Logistics → Sale → Reveal
///         Each event generates a transaction — immutable audit trail.
///         All data is PRIVATE — only visible on the Privacy Node.
contract CocoaLedgerData is Ownable {

    // ─── Enums ─────────────────────────────────────────────────────────

    enum LotStatus {
        Created,        // 0 — Lot created, accepting readings
        Finalized,      // 1 — No more IoT readings, ready for AI
        Validated,      // 2 — AI has scored the lot
        Harvested,      // 3 — Cacao harvested from trees
        PostHarvest,    // 4 — Fermentation + drying complete
        InTransit,      // 5 — Being transported
        Stored,         // 6 — In warehouse
        Tokenized,      // 7 — NFT minted
        Listed,         // 8 — On marketplace
        Sold,           // 9 — Purchased by buyer
        Revealed        // 10 — Private data revealed to buyer
    }

    // ─── Structs ───────────────────────────────────────────────────────

    struct IoTReading {
        uint256 deviceId;
        uint256 timestamp;
        int256 temperature;     // °C * 100 (e.g., 2750 = 27.50°C)
        uint256 humidity;       // % * 100 (e.g., 8500 = 85.00%)
        uint256 soilMoisture;   // % * 100
        uint256 soilPH;         // pH * 100 (e.g., 650 = 6.50)
        uint256 rainfall;       // mm * 100
        uint256 lightIntensity; // lux
        string gpsLocation;     // lat,lng — PRIVATE
    }

    struct HarvestLot {
        uint256 lotId;
        string farmName;        // PRIVATE
        string origin;          // PRIVATE
        uint256 createdAt;
        uint256 readingsCount;
        LotStatus status;
        uint256 aiScore;        // 0-100, set by AI validation
        string aiGrade;         // S/A/B/C/D
    }

    struct HarvestData {
        uint256 timestamp;
        uint256 quantityKg;
        string fruitColor;      // yellow / orange / red
        string fruitSize;       // small / medium / large
        string healthStatus;    // healthy / disease_detected / mixed
        string diseaseNotes;    // e.g. "monilia 5%" or "none"
    }

    struct PostHarvestData {
        uint256 fermentStartTime;
        uint256 fermentEndTime;
        string fermentMethod;     // box / heap / basket
        uint256 fermentTempAvg;   // °C * 100
        uint256 dryStartTime;
        uint256 dryEndTime;
        string dryMethod;         // solar / mechanical / hybrid
        uint256 finalMoisturePct; // * 100 (e.g., 720 = 7.20%)
        uint256 finalWeightKg;
    }

    struct LogisticsCheckpoint {
        uint256 timestamp;
        string location;        // PRIVATE
        string status;          // departed / in_transit / arrived / stored
        uint256 temperature;    // °C * 100 (transport conditions)
        uint256 humidity;       // % * 100
        string handler;         // PRIVATE
    }

    struct AIValidation {
        uint256 timestamp;
        uint256 score;           // 0-100
        string grade;            // S/A/B/C/D
        string analysisHash;     // SHA256 of full analysis — proof of integrity
        string notes;
    }

    struct SaleRecord {
        uint256 timestamp;
        address buyer;
        uint256 priceUsd;       // USD cents — PRIVATE
        uint256 nftTokenId;
        bool revealed;
    }

    // ─── Storage ───────────────────────────────────────────────────────

    mapping(uint256 => HarvestLot) public lots;
    mapping(uint256 => mapping(uint256 => IoTReading)) public readings;
    mapping(uint256 => HarvestData) public harvests;
    mapping(uint256 => PostHarvestData) public postHarvests;
    mapping(uint256 => LogisticsCheckpoint[]) public logistics;
    mapping(uint256 => AIValidation[]) public aiValidations;
    mapping(uint256 => SaleRecord) public sales;

    uint256 public nextLotId;

    // ─── Events ────────────────────────────────────────────────────────

    event LotCreated(uint256 indexed lotId, string farmName, string origin);
    event ReadingStored(uint256 indexed lotId, uint256 indexed readingIndex, uint256 deviceId);
    event LotFinalized(uint256 indexed lotId, uint256 totalReadings);
    event StatusChanged(uint256 indexed lotId, LotStatus newStatus);
    event AIValidated(uint256 indexed lotId, uint256 score, string grade);
    event Harvested(uint256 indexed lotId, uint256 quantityKg);
    event PostHarvestComplete(uint256 indexed lotId, uint256 finalWeightKg);
    event LogisticsUpdated(uint256 indexed lotId, string status);
    event LotTokenized(uint256 indexed lotId, uint256 nftTokenId);
    event LotSold(uint256 indexed lotId, address buyer);
    event LotRevealed(uint256 indexed lotId, address buyer);

    // ─── Constructor ───────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Lot Creation & IoT ────────────────────────────────────────────

    function createLot(
        string calldata farmName,
        string calldata origin
    ) external onlyOwner returns (uint256 lotId) {
        lotId = nextLotId++;
        lots[lotId] = HarvestLot({
            lotId: lotId,
            farmName: farmName,
            origin: origin,
            createdAt: block.timestamp,
            readingsCount: 0,
            status: LotStatus.Created,
            aiScore: 0,
            aiGrade: ""
        });
        emit LotCreated(lotId, farmName, origin);
        emit StatusChanged(lotId, LotStatus.Created);
    }

    function storeReading(
        uint256 lotId,
        uint256 deviceId,
        int256 temperature,
        uint256 humidity,
        uint256 soilMoisture,
        uint256 soilPH,
        uint256 rainfall,
        uint256 lightIntensity,
        string calldata gpsLocation
    ) external onlyOwner {
        require(lots[lotId].status == LotStatus.Created, "Lot not accepting readings");
        require(lotId < nextLotId, "Lot does not exist");

        uint256 idx = lots[lotId].readingsCount;
        readings[lotId][idx] = IoTReading({
            deviceId: deviceId,
            timestamp: block.timestamp,
            temperature: temperature,
            humidity: humidity,
            soilMoisture: soilMoisture,
            soilPH: soilPH,
            rainfall: rainfall,
            lightIntensity: lightIntensity,
            gpsLocation: gpsLocation
        });

        lots[lotId].readingsCount++;
        emit ReadingStored(lotId, idx, deviceId);
    }

    function finalizeLot(uint256 lotId) external onlyOwner {
        require(lotId < nextLotId, "Lot does not exist");
        require(lots[lotId].status == LotStatus.Created, "Not in Created status");
        lots[lotId].status = LotStatus.Finalized;
        emit LotFinalized(lotId, lots[lotId].readingsCount);
        emit StatusChanged(lotId, LotStatus.Finalized);
    }

    // ─── AI Validation ─────────────────────────────────────────────────

    function recordAIValidation(
        uint256 lotId,
        uint256 _score,
        string calldata _grade,
        string calldata _analysisHash,
        string calldata _notes
    ) external onlyOwner {
        require(lotId < nextLotId, "Lot does not exist");
        require(_score <= 100, "Score 0-100");
        aiValidations[lotId].push(AIValidation({
            timestamp: block.timestamp,
            score: _score,
            grade: _grade,
            analysisHash: _analysisHash,
            notes: _notes
        }));
        lots[lotId].aiScore = _score;
        lots[lotId].aiGrade = _grade;
        lots[lotId].status = LotStatus.Validated;
        emit AIValidated(lotId, _score, _grade);
        emit StatusChanged(lotId, LotStatus.Validated);
    }

    // ─── Harvest ───────────────────────────────────────────────────────

    function recordHarvest(
        uint256 lotId,
        uint256 _quantityKg,
        string calldata _fruitColor,
        string calldata _fruitSize,
        string calldata _healthStatus,
        string calldata _diseaseNotes
    ) external onlyOwner {
        require(lotId < nextLotId, "Lot does not exist");
        harvests[lotId] = HarvestData({
            timestamp: block.timestamp,
            quantityKg: _quantityKg,
            fruitColor: _fruitColor,
            fruitSize: _fruitSize,
            healthStatus: _healthStatus,
            diseaseNotes: _diseaseNotes
        });
        lots[lotId].status = LotStatus.Harvested;
        emit Harvested(lotId, _quantityKg);
        emit StatusChanged(lotId, LotStatus.Harvested);
    }

    // ─── Post-Harvest ──────────────────────────────────────────────────

    function recordPostHarvest(
        uint256 lotId,
        uint256 _fermentStart,
        uint256 _fermentEnd,
        string calldata _fermentMethod,
        uint256 _fermentTempAvg,
        uint256 _dryStart,
        uint256 _dryEnd,
        string calldata _dryMethod,
        uint256 _finalMoisture,
        uint256 _finalWeight
    ) external onlyOwner {
        require(lotId < nextLotId, "Lot does not exist");
        postHarvests[lotId] = PostHarvestData({
            fermentStartTime: _fermentStart,
            fermentEndTime: _fermentEnd,
            fermentMethod: _fermentMethod,
            fermentTempAvg: _fermentTempAvg,
            dryStartTime: _dryStart,
            dryEndTime: _dryEnd,
            dryMethod: _dryMethod,
            finalMoisturePct: _finalMoisture,
            finalWeightKg: _finalWeight
        });
        lots[lotId].status = LotStatus.PostHarvest;
        emit PostHarvestComplete(lotId, _finalWeight);
        emit StatusChanged(lotId, LotStatus.PostHarvest);
    }

    // ─── Logistics ─────────────────────────────────────────────────────

    function recordLogisticsCheckpoint(
        uint256 lotId,
        string calldata _location,
        string calldata _status,
        uint256 _temperature,
        uint256 _humidity,
        string calldata _handler
    ) external onlyOwner {
        require(lotId < nextLotId, "Lot does not exist");
        logistics[lotId].push(LogisticsCheckpoint({
            timestamp: block.timestamp,
            location: _location,
            status: _status,
            temperature: _temperature,
            humidity: _humidity,
            handler: _handler
        }));
        lots[lotId].status = LotStatus.InTransit;
        emit LogisticsUpdated(lotId, _status);
        emit StatusChanged(lotId, LotStatus.InTransit);
    }

    // ─── Tokenization & Sale ───────────────────────────────────────────

    function recordTokenization(uint256 lotId, uint256 _nftTokenId) external onlyOwner {
        require(lotId < nextLotId, "Lot does not exist");
        sales[lotId].nftTokenId = _nftTokenId;
        lots[lotId].status = LotStatus.Tokenized;
        emit LotTokenized(lotId, _nftTokenId);
        emit StatusChanged(lotId, LotStatus.Tokenized);
    }

    function recordSale(uint256 lotId, address _buyer, uint256 _priceUsd) external onlyOwner {
        require(lotId < nextLotId, "Lot does not exist");
        sales[lotId].timestamp = block.timestamp;
        sales[lotId].buyer = _buyer;
        sales[lotId].priceUsd = _priceUsd;
        lots[lotId].status = LotStatus.Sold;
        emit LotSold(lotId, _buyer);
        emit StatusChanged(lotId, LotStatus.Sold);
    }

    function recordReveal(uint256 lotId) external onlyOwner {
        require(lotId < nextLotId, "Lot does not exist");
        sales[lotId].revealed = true;
        lots[lotId].status = LotStatus.Revealed;
        emit LotRevealed(lotId, sales[lotId].buyer);
        emit StatusChanged(lotId, LotStatus.Revealed);
    }

    // ─── Getters ───────────────────────────────────────────────────────

    function getLot(uint256 lotId) external view returns (HarvestLot memory) {
        return lots[lotId];
    }

    function getReading(uint256 lotId, uint256 index) external view returns (IoTReading memory) {
        return readings[lotId][index];
    }

    function getHarvest(uint256 lotId) external view returns (HarvestData memory) {
        return harvests[lotId];
    }

    function getPostHarvest(uint256 lotId) external view returns (PostHarvestData memory) {
        return postHarvests[lotId];
    }

    function getLogistics(uint256 lotId) external view returns (LogisticsCheckpoint[] memory) {
        return logistics[lotId];
    }

    function getAIValidations(uint256 lotId) external view returns (AIValidation[] memory) {
        return aiValidations[lotId];
    }

    function getSale(uint256 lotId) external view returns (SaleRecord memory) {
        return sales[lotId];
    }
}
