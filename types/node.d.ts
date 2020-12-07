declare namespace NodeJS {
  export interface ProcessEnv {
    TEST_PRIVATE_KEY: string;
    ETHERSCAN_API_KEY: string;
    RINKEBY_ALCHEMY_KEY: string;
    MAINNET_ALCHEMY_KEY: string;
  }
}
