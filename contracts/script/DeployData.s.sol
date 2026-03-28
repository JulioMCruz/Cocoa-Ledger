// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CocoaLedgerData} from "../src/CocoaLedgerData.sol";

/// @title DeployData
/// @notice Deploys CocoaLedgerData to the Rayls Privacy Node.
contract DeployData is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        CocoaLedgerData dataStore = new CocoaLedgerData();
        vm.stopBroadcast();

        console.log("=== Cocoa Ledger - Deployed to Privacy Node ===");
        console.log("  CocoaLedgerData:", address(dataStore));
    }
}
