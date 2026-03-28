// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {RaylsErc20Handler} from "rayls-protocol-sdk/tokens/RaylsErc20Handler.sol";

/// @title CocoaLedgerToken
/// @notice Bridgeable ERC20 token for the Cocoa Ledger project.
///         Stores tokenized value of cacao harvests on the Privacy Node.
/// @dev Inherits RaylsErc20Handler which provides:
///   - teleportToPublicChain(to, amount, chainId)
///   - receiveTeleportFromPublicChain(to, amount)
///   - mint(to, amount) / burn(from, amount)
contract CocoaLedgerToken is RaylsErc20Handler {

    constructor(
        string memory _name,
        string memory _symbol,
        address _endpoint,
        address _raylsNodeEndpoint,
        address _userGovernance
    )
        RaylsErc20Handler(
            _name,
            _symbol,
            _endpoint,
            _raylsNodeEndpoint,
            _userGovernance,
            msg.sender,
            false
        )
    {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }
}
