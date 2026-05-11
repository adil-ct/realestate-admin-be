import dotenv from 'dotenv';

/**
 * Need to add following fields to env:
 * PORT, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 * AWS_SECRETS_MANAGER_ID
 */
dotenv.config();

import AWS from '@aws-sdk/client-secrets-manager';
import moment from 'moment';
const region = process.env.AWS_REGION || 'us-west-1'
const SecretsManager = new AWS.SecretsManager({ region });

const config = {
  db: {
    str: 'DB_STRING',
  },
  httpRpcUrl: 'HTTP_RPC_URL',
  contracts: {
    Token: {
      address: 'TOKEN_CONTRACT_ADDRESS',
    },
    Marketplace: {
      address: 'MARKETPLACE_CONTRACT_ADDRESS',
    },
    Usdc: {
      address: 'USDC_CONTRACT_ADDRESS',
    },
  },
  chain: 'CHAIN',
  chainId: 'CHAIN_ID',
  metaTxService: {
    url: 'META_TX_URL',
    executeEndpoint: 'META_TX_EXECUTE_ENDPOINT',
    authToken: 'META_TX_AUTH_TOKEN',
  },
  userService: {
    url: 'USER_URL',
    getProofEndpoint: 'USER_GET_PROOF_ENDPOINT',
    authToken: 'USER_AUTH_TOKEN',
  },
  authBaseUrl: 'AUTH_BASE_URL',
  investorContactListId: 'INVESTOR_LIST_ID',
  sendGridApiKey: 'SENDGRID_API_KEY',
  propertyBucket: 'PROPERTY_BUCKET',
  attom: {
    apiKey: 'ATTOM_API_KEY',
    urls: {
      getPropertyDetailsById: 'ATTOM_GET_PROPERTY_DETAILS_BY_ID_URL',
      getAvmDetails: 'ATTOM_GET_AVM_DETAILS_URL',
    },
  },
  sendEmailFrom: 'SEND_EMAIL_FROM',
  baseUrl: 'BASE_URL',
  venly: {
    clientId: 'VENLY_CLIENT_ID',
    clientSecret: 'VENLY_CLIENT_SECRET',
    urls: {
      auth: {
        getAccessToken: 'VENLY_AUTH_GET_ACESS_TOKEN_URL',
      },
      wallet: {
        create: 'VENLY_WALLET_CREATE_URL',
      },
    },
  },
  alchemy: {
    webhook: {
      authToken: 'ALCHEMY_WEBHOOK_AUTH_TOKEN',
      id: 'ALCHEMY_WEBHOOK_ID',
    },
    network: 'ALCHEMY_NETWORK',
  },
  crypto: {
    key: 'CRYPTO_KEY',
    encryptionIV: 'CRYPTO_ENCRYPTION_IV',
  },
  fireblocks: {
    assetId: 'FIREBLOCKS_ASSET_ID',
    apiKey: 'FIREBLOCKS_API_KEY',
    adminVaultAccountId: 'FIREBLOCKS_ADMIN_VAULT_ACCOUNT_ID',
    chainId: 'FIREBLOCKS_CHAIN_ID'
  },
  cloudinary: {
    cloudName: 'CLOUDINARY_CLOUD_NAME',
    apiKey: 'CLOUDINARY_API_KEY',
    apiSecret: 'CLOUDINARY_API_SECRET',
  },
};

let staleAfter = moment.utc();
const cachedConfig = {};
const updateObjProps = (obj, newObj, secretValues) => {
  for (const key in newObj) {
    if (newObj[key]?.constructor?.name === {}.constructor.name) {
      obj[key] = obj[key] ?? {};
      updateObjProps(obj[key], newObj[key], secretValues);
      continue;
    }
    obj[key] = secretValues[newObj[key]] || process.env[newObj[key]];
  }
};

const proxyConfig = new Proxy(config, {
  async get(target, prop, _originalObj) {
    try {
      if (staleAfter.unix() > moment.utc().unix()) return cachedConfig[prop];
      let values = {};
      if (process.env.AWS_SECRETS_MANAGER_ID) {
        const result = await SecretsManager.getSecretValue({
          SecretId: process.env.AWS_SECRETS_MANAGER_ID,
        });
        values = JSON.parse(result.SecretString);
      } else {
        values = {
          DB_STRING: process.env.DB_STRING,
          HTTP_RPC_URL: process.env.HTTP_RPC_URL,
          TOKEN_CONTRACT_ADDRESS: process.env.TOKEN_CONTRACT_ADDRESS,
          MARKETPLACE_CONTRACT_ADDRESS: process.env.MARKETPLACE_CONTRACT_ADDRESS,
          USDC_CONTRACT_ADDRESS: process.env.USDC_CONTRACT_ADDRESS,
          CHAIN: process.env.CHAIN,
          CHAIN_ID: process.env.CHAIN_ID,
          META_TX_URL: process.env.META_TX_URL,
          META_TX_EXECUTE_ENDPOINT: process.env.META_TX_EXECUTE_ENDPOINT,
          META_TX_AUTH_TOKEN: process.env.META_TX_AUTH_TOKEN,
          USER_URL: process.env.USER_URL,
          USER_GET_PROOF_ENDPOINT: process.env.USER_GET_PROOF_ENDPOINT,
          USER_AUTH_TOKEN: process.env.USER_AUTH_TOKEN,
          AUTH_BASE_URL: process.env.AUTH_BASE_URL,
          CIRCLE_BASE_URL: process.env.CIRCLE_BASE_URL,
          CIRCLE_PATHS_CREATE_WALLET: process.env.CIRCLE_PATHS_CREATE_WALLET,
          CIRCLE_API_KEY: process.env.CIRCLE_API_KEY,
          INVESTOR_LIST_ID: process.env.INVESTOR_LIST_ID,
          SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
          PROPERTY_BUCKET: process.env.PROPERTY_BUCKET,
          ATTOM_API_KEY: process.env.ATTOM_API_KEY,
          ATTOM_GET_PROPERTY_DETAILS_BY_ID_URL: process.env.ATTOM_GET_PROPERTY_DETAILS_BY_ID_URL,
          ATTOM_GET_AVM_DETAILS_URL: process.env.ATTOM_GET_AVM_DETAILS_URL,
          SEND_EMAIL_FROM: process.env.SEND_EMAIL_FROM,
          BASE_URL: process.env.BASE_URL,
          VENLY_CLIENT_ID: process.env.VENLY_CLIENT_ID,
          VENLY_CLIENT_SECRET: process.env.VENLY_CLIENT_SECRET,
          VENLY_AUTH_GET_ACESS_TOKEN_URL: process.env.VENLY_AUTH_GET_ACESS_TOKEN_URL,
          VENLY_WALLET_CREATE_URL: process.env.VENLY_WALLET_CREATE_URL,
          ALCHEMY_WEBHOOK_AUTH_TOKEN: process.env.ALCHEMY_WEBHOOK_AUTH_TOKEN,
          ALCHEMY_WEBHOOK_ID: process.env.ALCHEMY_WEBHOOK_ID,
          ALCHEMY_NETWORK: process.env.ALCHEMY_NETWORK,
          CRYPTO_KEY: process.env.CRYPTO_KEY,
          CRYPTO_ENCRYPTION_IV: process.env.CRYPTO_ENCRYPTION_IV,
          FIREBLOCKS_ASSET_ID: process.env.FIREBLOCKS_ASSET_ID,
          FIREBLOCKS_API_KEY: process.env.FIREBLOCKS_API_KEY,
          FIREBLOCKS_ADMIN_VAULT_ACCOUNT_ID: process.env.FIREBLOCKS_ADMIN_VAULT_ACCOUNT_ID,
          FIREBLOCKS_CHAIN_ID: process.env.FIREBLOCKS_CHAIN_ID,
          CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
          CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
        };
      }

      updateObjProps(cachedConfig, target, values);
      staleAfter = moment.utc().add(60, 'seconds');

      return cachedConfig[prop];
    } catch (err) {
      const SecretsManager = new AWS.SecretsManager({ region: 'us-west-1' });
      console.log(JSON.stringify(err))
      throw err;
    }
  },
});

export default proxyConfig;
