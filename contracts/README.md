# Cocoa Ledger Contracts

Solidity smart contracts for the Cocoa Ledger project, deployed on the Rayls Privacy Node.

## Contracts

| Contract | Purpose |
|----------|---------|
| `CocoaLedgerData.sol` | IoT data storage — lots, readings, finalization |
| `CocoaLedgerToken.sol` | Bridgeable ERC20 for harvest value |
| `CocoaLedgerNFT.sol` | Bridgeable ERC721 for harvest lot NFTs |
| `Attestation.sol` | On-chain AI attestation registry |
| `Marketplace.sol` | Escrow marketplace on public chain |

## Setup

```bash
npm install
forge install
```

## Deploy

```bash
source .env
forge script script/DeployCocoaLedger.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
```

## Notes

- Privacy Node is gasless (gas price = 0)
- Use `--legacy` flag (no EIP-1559 support)
- Use `_mint()` in constructors, `mint()` everywhere else
