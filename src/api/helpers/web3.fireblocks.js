import fs from 'fs'
import path from 'path'
import config from '../config/config.js';
import logger from '../config/logger.js';
import { FireblocksWeb3Provider, ChainId, ApiBaseUrl } from '@fireblocks/fireblocks-web3-provider';
import { secretKeyPath } from '../config/fireblocks.config.js';
import Web3 from 'web3';
import MarketplaceAbi from '../../abis/marketplace.json' with { type: "json" };
import TokenAbi from '../../abis/token.json' with { type: "json" };


const eip1193Provider = new FireblocksWeb3Provider({
  apiBaseUrl: process.env.NODE_ENV === 'production'
    ? ApiBaseUrl.Production
    : ApiBaseUrl.Sandbox,
  privateKey: secretKeyPath,
  apiKey: (await config.fireblocks).apiKey,
  vaultAccountIds: [(await config.fireblocks).adminVaultAccountId],
  // chainId: process.env.NODE_ENV === 'production' ? ChainId['AVALANCHE'] : ChainId['AVALANCHE_TEST'],
  chainId: (await config.fireblocks).chainId ?? '80002'
});

class Web3Helper {
  web3 = new Web3();
  initializationPromise = null;

  contracts = {
    Token: 'Token',
    Marketplace: 'Marketplace',
  };

  Token = null;
  Marketplace = null;
  CHAIN_ID = null;

  constructor() {
    const promises = [];
    let promise;
    promise = config.chainId.then((chainId) => (this.CHAIN_ID = chainId));
    promises.push(promise);
    this.web3 = new Web3(eip1193Provider);

    promise = config.contracts.then((contracts) => {
      this.Marketplace = new this.web3.eth.Contract(MarketplaceAbi, contracts.Marketplace.address);
      this.Token = new this.web3.eth.Contract(TokenAbi, contracts.Token.address);
    });

    promises.push(promise);
    this.initializationPromise = Promise.all(promises);
  }

  async ExecuteMethod(methodType, contract, funcName, params = []) {
    switch (methodType) {
      case 'CALL':
        return await this.Call(contract, funcName, params);

      case 'SEND':
        return await this.Send(contract, funcName, params);

      default:
        return null;
    }
  }

  async Call(contract, funcName, params) {
    try {
      const result = await this[contract].methods[funcName](...params).call();
      return result;
    } catch (error) {
      logger.error(error);
      return { error: true, message: error.message };
    }
  }

  async Send(contract, funcName, params = []) {
    try {
      let result;
      const myAddr = await this.web3.eth.getAccounts();
      console.log(myAddr)
      result = await this[contract].methods[funcName](...params).send({
        from: myAddr[0],
      });
      return result;
    } catch (error) {
      logger.error(`${contract}: ${funcName}`);
      logger.error(error?.response?.data?.error?.message ?? error);
      return {
        error: true,
        message: error?.response?.data?.error?.message ?? error?.message,
      };
    }
  }

  GetSignatureParameters(signature) {
    if (!this.web3.utils.isHexStrict(signature)) {
      return {
        error: 'Given value "'.concat(signature, '" is not a valid hex string.'),
      };
    }
    const r = signature.slice(0, 66);
    const s = '0x'.concat(signature.slice(66, 130));
    const _v = '0x'.concat(signature.slice(130, 132));
    let v = this.web3.utils.hexToNumber(_v);
    if (![27, 28].includes(v)) v += 27;
    return {
      r,
      s,
      v,
    };
  }

  ConstructMetaTransactionMessage(nonce, chainId, functionSignature, contractAddress) {
    return abi.soliditySHA3(['uint256', 'address', 'uint256', 'bytes'], [nonce, contractAddress, chainId, toBuffer(functionSignature)]);
  }

  strToUSDCConvert(str) {
    str = str.toString();
    let [beforeDecimalVal, afterDecimalVal] = str.split('.');
    if (!afterDecimalVal) afterDecimalVal = '';
    afterDecimalVal = afterDecimalVal.padEnd(6, '0');
    const result = this.web3.utils.toBN(beforeDecimalVal.concat(afterDecimalVal));
    return result;
  }
}

export default new Web3Helper();
