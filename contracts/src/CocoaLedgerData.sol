// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CocoaLedgerData
/// @notice On-chain storage for IoT device readings on the Privacy Node.
///         Each reading from a cacao farm device is stored as a transaction.
///         This data is private — only visible on the Privacy Node.
contract CocoaLedgerData is Ownable {

    struct IoTReading {
        uint256 deviceId;
        uint256 timestamp;
        int256 temperature;     // °C * 100 (e.g., 2750 = 27.50°C)
        uint256 humidity;       // % * 100 (e.g., 8500 = 85.00%)
        uint256 soilMoisture;   // % * 100
        uint256 soilPH;         // pH * 100 (e.g., 650 = 6.50)
        uint256 rainfall;       // mm * 100
        uint256 lightIntensity; // lux
        string gpsLocation;     // lat,lng
    }

    struct HarvestLot {
        uint256 lotId;
        string farmName;
        string origin;
        uint256 createdAt;
        uint256 readingsCount;
        bool finalized;
    }

    // Lot ID => HarvestLot
    mapping(uint256 => HarvestLot) public lots;
    // Lot ID => Reading index => IoTReading
    mapping(uint256 => mapping(uint256 => IoTReading)) public readings;
    // Total lots
    uint256 public nextLotId;

    event LotCreated(uint256 indexed lotId, string farmName, string origin);
    event ReadingStored(uint256 indexed lotId, uint256 indexed readingIndex, uint256 deviceId);
    event LotFinalized(uint256 indexed lotId, uint256 totalReadings);

    constructor() Ownable(msg.sender) {}

    /// @notice Create a new harvest lot
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
            finalized: false
        });
        emit LotCreated(lotId, farmName, origin);
    }

    /// @notice Store a single IoT reading for a lot
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
        require(!lots[lotId].finalized, "Lot is finalized");
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

    /// @notice Finalize a lot — no more readings can be added
    ///         This triggers the AI agent to start analysis
    function finalizeLot(uint256 lotId) external onlyOwner {
        require(lotId < nextLotId, "Lot does not exist");
        require(!lots[lotId].finalized, "Already finalized");
        lots[lotId].finalized = true;
        emit LotFinalized(lotId, lots[lotId].readingsCount);
    }

    /// @notice Get lot info
    function getLot(uint256 lotId) external view returns (HarvestLot memory) {
        return lots[lotId];
    }

    /// @notice Get a specific reading
    function getReading(uint256 lotId, uint256 index) external view returns (IoTReading memory) {
        return readings[lotId][index];
    }
}
