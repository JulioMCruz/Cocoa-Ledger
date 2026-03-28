// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {RaylsErc721Handler} from "rayls-protocol-sdk/tokens/RaylsErc721Handler.sol";

/// @title CocoaLedgerNFT
/// @notice Bridgeable ERC721 for Cocoa Ledger — each NFT represents a cacao harvest lot.
///         Private metadata (IoT data, quality scores) lives on the Privacy Node.
///         Bridged to public chain for marketplace listing.
/// @dev Inherits RaylsErc721Handler which provides:
///   - teleportToPublicChain(to, tokenId, chainId)
///   - receiveTeleportFromPublicChain(to, tokenId)
///   - mint(to, tokenId) / burn(tokenId)
contract CocoaLedgerNFT is RaylsErc721Handler {

    constructor(
        string memory _uri,
        string memory _name,
        string memory _symbol,
        address _endpoint,
        address _raylsNodeEndpoint,
        address _userGovernance
    )
        RaylsErc721Handler(
            _uri,
            _name,
            _symbol,
            _endpoint,
            _raylsNodeEndpoint,
            _userGovernance,
            msg.sender,
            false
        )
    {
        _safeMint(msg.sender, 0);
    }
}
