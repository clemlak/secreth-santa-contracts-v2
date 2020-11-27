import {
  HardhatUserConfig,
} from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import * as dotenv from 'dotenv';
import 'hardhat-typechain';
import '@nomiclabs/hardhat-etherscan';

dotenv.config();

const {
  TEST_PRIVATE_KEY,
  ETHERSCAN_API_KEY,
  RINKEBY_ALCHEMY_KEY,
} = process.env;

const config: HardhatUserConfig = {
  solidity: '0.7.3',
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${RINKEBY_ALCHEMY_KEY}`,
      accounts: [TEST_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
