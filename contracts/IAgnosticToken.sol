// SPDX-License-Identifier: MIT
pragma solidity 0.7.3;


interface IAgnosticToken {
  function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
  function transferFrom(address from, address to, uint256 tokenId) external;
  function transfer(address recipient, uint256 amount) external returns (bool);
  function supportsInterface(bytes4 interfaceId) external view returns (bool);
}