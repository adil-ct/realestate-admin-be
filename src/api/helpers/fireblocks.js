import { FireblocksSDK } from 'fireblocks-sdk';
import { ApiBaseUrl } from '@fireblocks/fireblocks-web3-provider';
import logger from '../config/logger.js';
import config from '../config/config.js';
import { secretKey as apiSecret } from '../config/fireblocks.config.js';
const apiKey = (await config.fireblocks).apiKey;
const baseUrl = process.env.NODE_ENV === 'production'
? ApiBaseUrl.Production
: ApiBaseUrl.Sandbox; // Choose the right api url for your workspace type
const fireblocks = new FireblocksSDK(apiSecret, apiKey, baseUrl);

export const createVault = async (name) => {
  try {
    logger.info('Inside fireblock create vault service');
    if (!name) return { error: 'Name required' };
    const vaultAccount = await fireblocks.createVaultAccount(name);
    return vaultAccount;
  } catch (err) {
    console.log(err);
    logger.error(err.message);
    return { error: err.message };
  }
};

export const createFireblocksWallet = async (vaultAccountId) => {
  try {
    logger.info('Inside fireblock create wallet service');
    if (!vaultAccountId) return { error: 'Vault Id required' };
    const assetId = (await config.fireblocks).assetId;
    const vaultAsset = await fireblocks.createVaultAsset(vaultAccountId, assetId);
    return vaultAsset;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};
