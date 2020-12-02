//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IAgnosticToken.sol";
import "hardhat/console.sol";


contract SecrethSantaV2 is Ownable {
  address public lastSanta;
  uint256 public lastPresentAt;

  uint256 public prizeDelay;

  mapping (address => bool) public isTokenWhitelisted;

  event PresentSent(
    address indexed from,
    address indexed to,
    address indexed token,
    uint256 tokenId
  );

  event PrizeAdded(
    address indexed by,
    address[] tokens,
    uint256[] ids
  );

  event WhitelistUpdated(
    address[] tokens,
    bool isApproved
  );

  constructor(
    uint256 initialPrizeDelay,
    address[] memory whitelistedTokens
  ) {
    prizeDelay = initialPrizeDelay;
    lastSanta = msg.sender;
    lastPresentAt = block.timestamp;

    for (uint256 i = 0; i < whitelistedTokens.length; i += 1) {
      isTokenWhitelisted[whitelistedTokens[i]] = true;
    }

    if (whitelistedTokens.length > 0) {
      emit WhitelistUpdated(
        whitelistedTokens,
        true
      );
    }
  }

  function updatePrizeDelay(uint256 newPrizeDelay) external onlyOwner() {
    prizeDelay = newPrizeDelay;
  }

  function updateWhitelist(
    address[] calldata tokens,
    bool isApproved
  ) external onlyOwner() {
    for (uint256 i = 0; i < tokens.length; i += 1) {
      isTokenWhitelisted[tokens[i]] = isApproved;
    }

    emit WhitelistUpdated(
      tokens,
      isApproved
    );
  }

  function sendPresent(
    address tokenAddress,
    uint256 id
  ) external {
    require(
      lastPresentAt + prizeDelay > block.timestamp,
      "Too late"
    );

    require(
      isTokenWhitelisted[tokenAddress] == true,
      "Token is not whitelisted"
    );

    address[] memory tokens = new address[](1);
    tokens[0] = tokenAddress;

    uint256[] memory ids = new uint256[](1);
    ids[0] = id;

    _transferAssets(
      msg.sender,
      lastSanta,
      tokens,
      ids
    );

    emit PresentSent(
      msg.sender,
      lastSanta,
      tokenAddress,
      id
    );

    lastPresentAt = block.timestamp;
    lastSanta = msg.sender;
  }

  function addPrize(
    address[] calldata tokens,
    uint256[] calldata ids
  ) external {
    require(
      tokens.length == ids.length,
      "Arrays do not match"
    );

    require(
      lastPresentAt + prizeDelay > block.timestamp,
      "Too late"
    );

    for (uint256 i = 0; i < tokens.length; i += 1) {
      _transferAssets(
        msg.sender,
        address(this),
        tokens,
        ids
      );
    }

    emit PrizeAdded(
      msg.sender,
      tokens,
      ids
    );
  }

  function claimPrize(
    address[] calldata tokens,
    uint256[] calldata ids
  ) external {
    require(
      block.timestamp > lastPresentAt + prizeDelay,
      "Not yet"
    );

    require(
      tokens.length == ids.length,
      "Arrays do not match"
    );

    for (uint256 i = 0; i < tokens.length; i += 1) {
      _transferAssets(
        address(this),
        lastSanta,
        tokens,
        ids
      );
    }
  }

  function isTooLate() external view returns (bool) {
    return block.timestamp > lastPresentAt + prizeDelay;
  }

  function _transferAssets(
    address from,
    address to,
    address[] memory tokens,
    uint256[] memory ids
  ) private {
    for (uint256 i = 0; i < tokens.length; i += 1) {
      IAgnosticToken token = IAgnosticToken(tokens[i]);

      bool hasERC1155Interface = token.supportsInterface(0xd9b67a26);

      if (hasERC1155Interface) {
        bytes memory data;
        token.safeTransferFrom(from, to, ids[i], 1, data);
      } else {
        try token.transferFrom(from, to, ids[i]) {
          // Success
        } catch {
          token.transfer(to, ids[i]);
        }
      }
    }
  }
}
