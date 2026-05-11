import axios from 'axios';
import logger from '../config/logger.js';
import config from '../config/config.js';
import { generateuuid } from './helpers.js';

export default class CircleHelper {
  static async createWallet({ description }) {
    try {
      logger.info('Inside create wallet circle API request');
      const {
        baseUrl,
        paths: { createWallet },
        apiKey,
      } = await config.circle;
      const response = await axios.post(
        `${baseUrl}${createWallet}`,
        {
          idempotencyKey: await generateuuid(),
          description: `Circle wallet for ${description}, created by system.`,
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer' + apiKey,
          },
        }
      );
      response.data.status = response.status;
      return { hasError: false, value: response.data };
    } catch (err) {
      logger.error(err.message);
      return { hasError: true, error: err.message };
    }
  }

  static async createTransfer(data) {
    try {
      logger.info('Inside create transfer circle API request');
      const { baseUrl, apiKey } = await config.circle;
      const response = await axios.post(`${baseUrl}/transfers`, data, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer' + apiKey,
        },
      });
      response.data.status = response.status;
      return { hasError: false, value: response.data };
    } catch (err) {
      logger.error(err.message);
      return { hasError: true, error: err.message };
    }
  }
}
