import hre from 'hardhat';
import '@nomiclabs/hardhat-ethers';

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contract(s) with account:', deployer.address);

  const SecrethSantaV2 = await ethers.getContractFactory('SecrethSantaV2');
  const secrethSantaV2 = await SecrethSantaV2.deploy(['0x9f8052dc99582d00a8d7b339cab52fb5409502fb']);

  console.log('SecrethSantaV2 deployed:', secrethSantaV2.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
