/* eslint-env node, mocha */
/* eslint-disable camelcase */

import hre from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {
  Signer,
  utils,
  Contract,
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
  IERC721__factory,
  IERC1155__factory,
} from '../typechain';

import {
  increaseTime,
} from './utils';

const { ethers } = hre;

const cryptoKittiesAddress = '0x06012c8cf97bead5deae237070f9587f8e7a266d';
const axieInfinityAddress = '0xF5b0A3eFB8e8E4c201e2A935F110eAaF3FFEcb8d';
const cryptoVoxelsWearablesAddress = '0xa58b5224e2FD94020cb2837231B2B0E4247301A6';

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
      [
        dummyERC721.address,
        dummyERC1155.address,
        cryptoKittiesAddress,
        axieInfinityAddress,
        cryptoVoxelsWearablesAddress,
      ],
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

  it('Should send a CryptoKitty as a present', async () => {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: ['0x0532FdcB9805710fb3929Bf043b04226f4dE118B'],
    });

    const carol = await ethers.provider.getSigner('0x0532FdcB9805710fb3929Bf043b04226f4dE118B');
    const cryptoKitties = IERC721__factory.connect(cryptoKittiesAddress, carol);
    await cryptoKitties.approve(secrethSanta.address, '1844260');
    await secrethSanta.connect(carol).sendPresent(cryptoKittiesAddress, '1844260');
    expect(await cryptoKitties.ownerOf('1844260')).to.equal(await deployer.getAddress());
  });

  it('Should send a CryptoVoxelsWearable as a present', async () => {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: ['0xaD378a8D84440FA47DCE1d6c110E95C22b419e7c'],
    });

    const wearableId = '2684';
    const carol = await ethers.provider.getSigner('0xaD378a8D84440FA47DCE1d6c110E95C22b419e7c');
    const cryptoVoxelsWearables = IERC1155__factory.connect(cryptoVoxelsWearablesAddress, carol);
    await cryptoVoxelsWearables.setApprovalForAll(secrethSanta.address, true);
    await secrethSanta.connect(carol).sendPresent(cryptoVoxelsWearablesAddress, wearableId);
    expect(await cryptoVoxelsWearables.balanceOf(await deployer.getAddress(), wearableId)).to.equal(1, 'Wearable balance is wrong');
  });

  it('Should add a bunch of presents into the pool and claim them', async () => {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: ['0xe43ef281a678dda69aeea25894475301905cac7d'],
    });

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: ['0x07Af1daf78BA692185D3F0E04a88C80BbD559b0b'],
    });

    const kittyId = '1638418';
    const axieId = '62976';

    const carol = await ethers.provider.getSigner('0x0532FdcB9805710fb3929Bf043b04226f4dE118B');
    const cryptoKitties = IERC721__factory.connect(cryptoKittiesAddress, carol);
    await cryptoKitties.approve(secrethSanta.address, kittyId);
    await secrethSanta.connect(carol).addPrize(
      [cryptoKittiesAddress],
      [kittyId],
    );
    expect(await cryptoKitties.ownerOf(kittyId)).to.equal(secrethSanta.address, 'CryptoKitty owner should be Secreth Santa');

    const dave = await ethers.provider.getSigner('0x07Af1daf78BA692185D3F0E04a88C80BbD559b0b');
    const axieInfinity = IERC721__factory.connect(axieInfinityAddress, dave);
    await axieInfinity.approve(secrethSanta.address, axieId);

    expect(await axieInfinity.ownerOf(axieId)).to.equal(await dave.getAddress(), 'Axie Infinity owner should be Dave');

    await secrethSanta.connect(dave).addPrize(
      [axieInfinityAddress],
      [axieId],
    );
    expect(await axieInfinity.ownerOf(axieId)).to.equal(secrethSanta.address, 'Axie Infinity owner should be Secreth Santa');

    const wearableId = '1620';
    const elvis = await ethers.provider.getSigner('0xe43ef281a678dda69aeea25894475301905cac7d');
    const cryptoVoxelsWearables = IERC1155__factory.connect(cryptoVoxelsWearablesAddress, elvis);
    expect(await cryptoVoxelsWearables.balanceOf(await elvis.getAddress(), wearableId)).to.equal(1, 'Wearable balance is wrong');
    await cryptoVoxelsWearables.setApprovalForAll(secrethSanta.address, true);
    await secrethSanta.connect(elvis).addPrize([cryptoVoxelsWearablesAddress], [wearableId]);
    // expect(await cryptoVoxelsWearables.balanceOf(secrethSanta.address, wearableId)).to.equal(1, 'Wearable balance is wrong');

    await increaseTime(prizeDelay, ethers.provider);
    await secrethSanta.connect(deployer).claimPrize(
      [axieInfinityAddress, cryptoKittiesAddress],
      [axieId, kittyId],
    );

    expect(await axieInfinity.ownerOf(axieId)).to.equal(await deployer.getAddress(), 'Axie Infinity  owner should be deployer');
    expect(await cryptoKitties.ownerOf(kittyId)).to.equal(await deployer.getAddress(), 'CryptoKitty owner should be deployer');
    // expect(await cryptoVoxelsWearables.balanceOf(await deployer.getAddress(), wearableId)).to.equal(1, 'Wearable balance is wrong');
  });
});
