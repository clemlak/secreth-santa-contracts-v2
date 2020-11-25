//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./IBadERC721.sol";


contract SecrethSantaV2 is Ownable {
  address public lastSanta;
  uint256 public lastPresentAt;

  uint256 public prizeDelay = 60 * 60 * 24 * 7;

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

  constructor() {
    lastSanta = msg.sender;
    lastPresentAt = block.timestamp;
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

  function sendPresent(
    address token,
    uint256 id
  ) external {
    require(
      lastPresentAt + prizeDelay > block.timestamp,
      "Too late"
    );

    require(
      isTokenWhitelisted[token] == true,
      "Token is not whitelisted"
    );

    address[] memory tokens = new address[](1);
    tokens[1] = token;

    uint256[] memory ids = new uint256[](1);
    ids[1] = id;

    _transferAssets(
      msg.sender,
      lastSanta,
      tokens,
      ids
    );

    lastPresentAt = block.timestamp;
    lastSanta = msg.sender;
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
      IERC165 tokenWithoutInterface = IERC165(tokens[i]);

      bool hasERC1155Interface = tokenWithoutInterface.supportsInterface(0xd9b67a26);

      if (hasERC1155Interface) {
        IERC1155 token = IERC1155(tokens[i]);
        bytes memory data;
        token.safeTransferFrom(from, to, ids[i], 1, data);
      } else {
        IERC721 token = IERC721(tokens[i]);

        try token.transferFrom(from, to, ids[i]) {
          // Success
        } catch {
          IBadERC721 badToken = IBadERC721(tokens[i]);
          badToken.transfer(to, ids[i]);
        }
      }
    }
  }
}
