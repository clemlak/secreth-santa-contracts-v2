/* eslint-env node, mocha */

import hre from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {
  Contract,
  Signer,
  utils,
} from 'ethers';

import {
  SecrethSantaV2,
  SecrethSantaV2__factory,
} from '../typechain';

const { ethers } = hre;

describe('Dexther', () => {
  let accounts: Signer[];
  let secreth: SecrethSantaV2;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const Secreth = await ethers.getContractFactory('SecrethSantaV2') as SecrethSantaV2__factory;
    secreth = await Secreth.deploy();
  });

  it('Should check the current fee', async () => {
    // plop
  });
});
