import hre from 'hardhat';
import '@nomiclabs/hardhat-ethers';

import deploymentArguments from '../deploymentArguments';

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contract(s) with account:', deployer.address);

  const SecrethSantaV2 = await ethers.getContractFactory('SecrethSantaV2');
  const secrethSantaV2 = await SecrethSantaV2.deploy(...deploymentArguments);

  console.log('SecrethSantaV2 deployed:', secrethSantaV2.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
