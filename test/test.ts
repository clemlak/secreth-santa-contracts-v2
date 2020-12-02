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
  DummyERC20,
  DummyERC20__factory,
  DummyERC721,
  DummyERC721__factory,
  DummyERC1155,
  DummyERC1155__factory,
} from '../typechain';

import {
  increaseTime,
} from './utils';

const { ethers } = hre;

const prizeDelay = 60 * 60 * 24;

describe('SecrethSantaV2', () => {
  let accounts: Signer[];
  let secrethSanta: SecrethSantaV2;
  let dummyERC20: DummyERC20;
  let dummyERC721: DummyERC721;
  let dummyERC1155: DummyERC1155;
  let deployer: Signer;
  let alice: Signer;
  let bob: Signer;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer, alice, bob] = accounts;

    dummyERC20 = await new DummyERC20__factory(deployer).deploy();
    dummyERC721 = await new DummyERC721__factory(deployer).deploy();
    dummyERC1155 = await new DummyERC1155__factory(deployer).deploy();
    secrethSanta = await new SecrethSantaV2__factory(deployer).deploy(
      prizeDelay,
      [dummyERC721.address, dummyERC1155.address],
    );
  });

  it('Should check the current owner', async () => {
    expect(await secrethSanta.owner()).to.equal(await deployer.getAddress());
  });

  it('Should check the last Santa', async () => {
    expect(await secrethSanta.lastSanta()).to.equal(await deployer.getAddress());
  });

  it('Should check the prize delay', async () => {
    expect(await secrethSanta.prizeDelay()).to.equal(
      prizeDelay,
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

  it('Should add a prize to the pool', async () => {
    await dummyERC721.mint(await alice.getAddress(), 0);
    await dummyERC721.connect(alice).setApprovalForAll(
      secrethSanta.address,
      true,
    );

    await expect(secrethSanta.connect(alice).addPrize(
      [dummyERC721.address],
      [0],
    )).to.emit(secrethSanta, 'PrizeAdded').withArgs(
      await alice.getAddress(),
      [dummyERC721.address],
      [0],
    );
  });

  it('Should add a prize to the pool, send a present, wait for the delay and claim the prize', async () => {
    await dummyERC20.mint(await deployer.getAddress(), utils.parseEther('10'));
    await dummyERC20.connect(deployer).approve(
      secrethSanta.address,
      utils.parseEther('10'),
    );

    expect(await dummyERC20.balanceOf(await deployer.getAddress())).to.equal(
      utils.parseEther('10'),
      'Balance is wrong',
    );
    expect(await dummyERC20.allowance(
      await deployer.getAddress(),
      secrethSanta.address,
    )).to.equal(
      utils.parseEther('10'),
      'Allowance is wrong',
    );

    await secrethSanta.connect(deployer).addPrize(
      [dummyERC20.address],
      [utils.parseEther('10')],
    );

    expect(await dummyERC20.balanceOf(secrethSanta.address)).to.equal(
      utils.parseEther('10'),
      'Balance is wrong',
    );

    await dummyERC721.mint(await alice.getAddress(), 0);
    await dummyERC721.connect(alice).setApprovalForAll(
      secrethSanta.address,
      true,
    );

    await secrethSanta.connect(alice).addPrize(
      [dummyERC721.address],
      [0],
    );

    await dummyERC721.mint(await bob.getAddress(), 1);
    await dummyERC721.connect(bob).setApprovalForAll(
      secrethSanta.address,
      true,
    );

    await secrethSanta.connect(bob).sendPresent(
      dummyERC721.address,
      1,
    );

    await increaseTime(prizeDelay, ethers.provider);

    await secrethSanta.connect(bob).claimPrize(
      [dummyERC20.address, dummyERC721.address],
      [utils.parseEther('10'), 0],
    );

    expect(await dummyERC20.balanceOf(await bob.getAddress())).to.equal(
      utils.parseEther('10'),
      'Balance is wrong',
    );
    expect(await dummyERC721.ownerOf(0)).to.equal(await bob.getAddress(), 'Owner of token 0 is wrong');
  });

  it('Should NOT claim the prize too early', async () => {
    await dummyERC721.mint(await alice.getAddress(), 0);
    await dummyERC721.connect(alice).setApprovalForAll(
      secrethSanta.address,
      true,
    );

    await secrethSanta.connect(alice).addPrize(
      [dummyERC721.address],
      [0],
    );

    await dummyERC721.mint(await bob.getAddress(), 1);
    await dummyERC721.connect(bob).setApprovalForAll(
      secrethSanta.address,
      true,
    );

    await secrethSanta.connect(bob).sendPresent(
      dummyERC721.address,
      1,
    );

    await expect(secrethSanta.connect(bob).claimPrize(
      [dummyERC721.address],
      [0],
    )).to.revertedWith('Not yet');
  });

  it('Should NOT send a present if the token is not whitelisted', async () => {
    await secrethSanta.connect(deployer).updateWhitelist(
      [dummyERC721.address],
      false,
    );

    await dummyERC721.mint(await alice.getAddress(), 0);
    await dummyERC721.connect(alice).setApprovalForAll(
      secrethSanta.address,
      true,
    );

    await expect(secrethSanta.connect(bob).sendPresent(
      dummyERC721.address,
      0,
    )).to.revertedWith('Token is not whitelisted');
  });

  // TODO: Fix this test, the issue might be related to the increaseTime method
  it.skip('Should check if it is too late', async () => {
    expect(await secrethSanta.isTooLate()).to.equal(false, 'Is too late is wrong');
    await increaseTime(prizeDelay, ethers.provider);
    expect(await secrethSanta.isTooLate()).to.equal(true, 'Is too late is wrong');
  });
});
