import qs from 'qs';
import axios from 'axios';
import moment from 'moment';
import config from '../config/config.js';
import logger from '../config/logger.js';
import { GenerateRandomNumberOfLength } from './helpers.js';

export default class VenlyHelper {
  #accessToken;
  #expiresAt;

  constructor() {
    this.#accessToken = null;
    this.#expiresAt = moment.utc();
  }

  #expiresIn() {
    return this.#expiresAt.unix() - moment.utc().unix();
  }

  async #authenticate() {
    try {
      const data = qs.stringify({
        grant_type: 'client_credentials',
        client_id: (await config.venly).clientId,
        client_secret: (await config.venly).clientSecret,
      });
      const reqConfig = {
        method: 'post',
        url: (await config.venly).urls.auth.getAccessToken,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data,
      };

      const { data: response } = await axios(reqConfig);
      const { access_token, expires_in } = response;
      this.#accessToken = access_token;
      this.#expiresAt = moment.utc().add(expires_in, 'seconds');

      return { hasError: false };
    } catch (error) {
      logger.error(error);
      return {
        hasError: true,
        error: error?.response?.data?.error_description ?? error.message,
      };
    }
  }

  async createWallet({ Id, type = 'property' }) {
    try {
      logger.info('Inside create venly wallet API request');
      if (this.#expiresIn() < 30) {
        const { hasError, error } = await this.#authenticate();
        if (hasError) return { hasError, error };
      }

      const pincode = GenerateRandomNumberOfLength(5);

      const payload = {
        pincode,
        identifier: 'type=recoverable',
        secretType: 'MATIC',
        walletType: 'WHITE_LABEL',
      };
      if (type === 'property_manager') {
        payload.description = `Venly wallet for property manager: ${Id}, created by system.`;
      } else {
        payload.description = `Venly wallet for property: ${Id}, created by system.`;
      }
      const reqConfig = {
        method: 'post',
        url: (await config.venly).urls.wallet.create,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#accessToken}`,
        },
        data: payload,
      };

      const { data } = await axios(reqConfig);

      data.result.pincode = pincode;

      return { hasError: false, value: data.result };
    } catch (error) {
      logger.error(error);
      return {
        hasError: true,
        error: error?.response?.data?.errors?.[0]?.message ?? error.message,
      };
    }
  }

  async getWalletBalance(walletAddress) {
    try {
      if (this.#expiresIn() < 30) {
        const { hasError, error } = await this.#authenticate();
        if (hasError) return { hasError, error };
      }
      const secretType = 'MATIC'; // MATIC // ETHEREUM
      const reqConfig = {
        method: 'get',
        url: `${(await config.venly).urls.wallet.create}/${secretType}/${walletAddress}/balance/tokens`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#accessToken}`,
        },
      };
      const { data } = await axios(reqConfig);
      return { hasError: false, value: data.result };
    } catch (err) {
      logger.error(err);
      return {
        hasError: true,
        error: err?.response?.data?.errors?.[0]?.message ?? err.message,
      };
    }
  }
}
