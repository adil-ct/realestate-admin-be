import axios from 'axios';
import logger from '../config/logger.js';
import config from '../config/config.js';
import messages from '../config/messages.js';

export const auth_token = async (data) => {
  try {
    logger.info('Inside get token auth microservice API request');
    const response = await axios
      .post(`${await config.authBaseUrl}/token`, data)
      .catch((err) => ({ error: err }));
    if (response?.error) {
      return {
        error: response.error,
      };
    }
    return response.data.data;
  } catch (err) {
    logger.error(err.message);
    return { error: err };
  }
};

export const auth_sendSMS = async (data) => {
  try {
    logger.info('Inside send SMS auth microservice API request');
    const response = await axios
      .post(`${await config.authBaseUrl}/sendOTP`, data)
      .catch((err) => ({ error: err }));
    if (response?.error) {
      return {
        error:
          response?.error?.response.status !== 200
            ? response.error.response.data.msg
            : messages.SOMETHING_WENT_WRONG,
      };
    }
    return response.data.data;
  } catch (err) {
    logger.error(err.message);
    return { error: err };
  }
};

export const auth_verifySMS = async (data) => {
  try {
    logger.info('Inside verify SMS auth microservice API request');
    const response = await axios
      .post(`${await config.authBaseUrl}/verifyOTP`, data)
      .catch((err) => ({ error: err }));
    if (response?.error) {
      return {
        error:
          response?.error?.response.status !== 200
            ? response.error.response.data.msg
            : messages.SOMETHING_WENT_WRONG,
      };
    }
    return response.data.data;
  } catch (err) {
    logger.error(err.message);
    return { error: err };
  }
};

export const auth_sendEmail = async (data) => {
  try {
    logger.info('Inside send email auth API request');
    const response = await axios
      .post(`${await config.authBaseUrl}/email`, data)
      .catch((err) => ({ error: err }));
    if (response?.error) {
      return {
        error:
          response?.error?.response?.status !== 200
            ? response?.error?.response?.data?.msg
            : messages.SOMETHING_WENT_WRONG,
      };
    }
    return response.data.data;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};
