//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";


contract SecrethSantaV2 is Ownable {
  address public lastSecretSanta;
  uint256 public lastPresentAt;

  constructor() {
    lastSecretSanta = msg.sender;
    lastPresentAt = block.timestamp;
  }
}
