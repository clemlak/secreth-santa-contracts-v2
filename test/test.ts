/* eslint-env node, mocha */
/* eslint-disable camelcase */

import hre from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {
  Signer,
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
  let secreth: SecrethSantaV2;
  let dummyERC721: DummyERC721;
  let dummyERC1155: DummyERC1155;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    dummyERC721 = await new DummyERC721__factory(accounts[0]).deploy();
    dummyERC1155 = await new DummyERC1155__factory(accounts[0]).deploy();

    secreth = await new SecrethSantaV2__factory(accounts[0]).deploy(
      [dummyERC721.address, dummyERC1155.address],
    );
  });

  it('Should check the current owner', async () => {
    expect(await secreth.owner()).to.equal(await accounts[0].getAddress());
  });

  it('Should check the prize delay', async () => {
    expect(await secreth.prizeDelay()).to.equal(
      60 * 60 * 24 * 7,
    );
  });
});
