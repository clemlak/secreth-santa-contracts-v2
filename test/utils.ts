/* eslint-disable import/prefer-default-export */

import {
  providers,
} from 'ethers';

async function increaseTime(
  duration: number,
  provider: providers.JsonRpcProvider,
) {
  try {
    await provider.send(
      'evm_increaseTime',
      [duration],
    );

    await provider.send(
      'evm_mine',
      [],
    );
  } catch (e) {
    throw new Error(`Cannot increase the time: ${e}`);
  }
}

export {
  increaseTime,
};
