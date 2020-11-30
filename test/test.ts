/* eslint-env node, mocha */
/* eslint-disable camelcase */

import hre from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {
  Signer,
  utils,
} from 'ethers';
import { expect } from 'chai';

import {
  SecrethSantaV2,
  SecrethSantaV2__factory,
  DummyERC721,
  DummyERC721__factory,
  DummyERC1155,
  DummyERC1155__factory,
} from '../typechain';

const { ethers } = hre;

describe('SecrethSantaV2', () => {
  let accounts: Signer[];
  let secrethSanta: SecrethSantaV2;
  let dummyERC721: DummyERC721;
  let dummyERC1155: DummyERC1155;
  let deployer: Signer;
  let alice: Signer;
  let bob: Signer;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer, alice, bob] = accounts;

    dummyERC721 = await new DummyERC721__factory(deployer).deploy();
    dummyERC1155 = await new DummyERC1155__factory(deployer).deploy();
    secrethSanta = await new SecrethSantaV2__factory(deployer).deploy(
      [dummyERC721.address, dummyERC1155.address],
    );
  });

  it('Should check the current owner', async () => {
    expect(await secrethSanta.owner()).to.equal(await deployer.getAddress());
  });

  it('Should check the prize delay', async () => {
    expect(await secrethSanta.prizeDelay()).to.equal(
      60 * 60 * 24 * 3,
    );
  });

  it('Should send an ERC721 present', async () => {
    await dummyERC721.mint(await alice.getAddress(), 0);
    await dummyERC721.connect(alice).setApprovalForAll(
      secrethSanta.address,
      true,
    );

    await expect(secrethSanta.connect(alice).sendPresent(
      dummyERC721.address,
      0,
    )).to.emit(secrethSanta, 'PresentSent').withArgs(
      await alice.getAddress(),
      await deployer.getAddress(),
      dummyERC721.address,
      0,
    );

    expect(await dummyERC721.ownerOf(0)).to.equal(await deployer.getAddress());
  });

  it('Should send an ERC1155 present', async () => {
    await dummyERC1155.mint(await alice.getAddress(), 0, 1, utils.toUtf8Bytes(''));
    await dummyERC1155.connect(alice).setApprovalForAll(
      secrethSanta.address,
      true,
    );

    await expect(secrethSanta.connect(alice).sendPresent(
      dummyERC1155.address,
      0,
    )).to.emit(secrethSanta, 'PresentSent').withArgs(
      await alice.getAddress(),
      await deployer.getAddress(),
      dummyERC1155.address,
      0,
    );

    expect(await dummyERC1155.balanceOf(
      await deployer.getAddress(),
      0,
    )).to.equal(1);
  });

  it('Should send 2 presents in a row', async () => {
    await dummyERC721.mint(await alice.getAddress(), 0);
    await dummyERC721.mint(await bob.getAddress(), 1);
    await dummyERC721.connect(alice).setApprovalForAll(
      secrethSanta.address,
      true,
    );
    await dummyERC721.connect(bob).setApprovalForAll(
      secrethSanta.address,
      true,
    );

    await secrethSanta.connect(alice).sendPresent(
      dummyERC721.address,
      0,
    );

    expect(await dummyERC721.ownerOf(0)).to.equal(await deployer.getAddress());

    await secrethSanta.connect(bob).sendPresent(
      dummyERC721.address,
      1,
    );

    expect(await dummyERC721.ownerOf(1)).to.equal(await alice.getAddress());
  });
});
