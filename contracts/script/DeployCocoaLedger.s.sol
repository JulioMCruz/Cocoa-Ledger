// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CocoaLedgerToken} from "../src/CocoaLedgerToken.sol";
import {CocoaLedgerData} from "../src/CocoaLedgerData.sol";
import {IDeploymentProxyRegistryV1} from "rayls-protocol-sdk/interfaces/IDeploymentProxyRegistryV1.sol";

/// @title DeployCocoaLedger
/// @notice Deploys CocoaLedgerToken + CocoaLedgerData to the Privacy Node.
///
/// Usage:
///   source .env
///   forge script script/DeployCocoaLedger.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
contract DeployCocoaLedger is Script {
    function run() external {
        address registryAddr = vm.envAddress("DEPLOYMENT_PROXY_REGISTRY");
        string memory tokenName = vm.envString("TOKEN_NAME");
        string memory tokenSymbol = vm.envString("TOKEN_SYMBOL");
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        IDeploymentProxyRegistryV1 registry = IDeploymentProxyRegistryV1(registryAddr);

        address endpoint = registry.getContract("Endpoint");
        address rnEndpoint = registry.getContract("RNEndpoint");
        address userGovernance = registry.getContract("RNUserGovernance");

        require(endpoint != address(0), "Endpoint not found");
        require(rnEndpoint != address(0), "RNEndpoint not found");
        require(userGovernance != address(0), "RNUserGovernance not found");

        console.log("=== Infrastructure ===");
        console.log("  Endpoint:        ", endpoint);
        console.log("  RNEndpoint:      ", rnEndpoint);
        console.log("  RNUserGovernance:", userGovernance);

        vm.startBroadcast(deployerKey);

        CocoaLedgerToken token = new CocoaLedgerToken(
            tokenName,
            tokenSymbol,
            endpoint,
            rnEndpoint,
            userGovernance
        );

        CocoaLedgerData dataStore = new CocoaLedgerData();

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployed to Privacy Node ===");
        console.log("  CocoaLedgerToken:", address(token));
        console.log("  CocoaLedgerData: ", address(dataStore));
        console.log("");
        console.log("Set in .env:");
        console.log("  TOKEN_ADDRESS=%s", vm.toString(address(token)));
        console.log("  DATA_ADDRESS=%s", vm.toString(address(dataStore)));
    }
}
