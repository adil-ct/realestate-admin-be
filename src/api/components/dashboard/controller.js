import Logger from '../../config/logger.js';
import messages from '../../config/messages.js';
import { handleError, handleResponse } from '../../helpers/requestHandler.js';
import { getAllPropertiesService, onSaleProperties } from '../property/service.js';
import { getAllPropertiesValidator } from '../property/validator.js';
import { dashboardStatsService } from './service.js';

export const getDashboardStats = async (req, res) => {
  try {
    Logger.info('Inside get dashboard stats API controller');
    const data = await dashboardStatsService();
    return handleResponse({
      res,
      msg: messages.SUCCESS,
      data,
    });
  } catch (err) {
    Logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getNewlyListedProperties = async (req, res) => {
  Logger.info('inside get Newly listed Properties');
  try {
    const { user: __user } = req;

    const validation = getAllPropertiesValidator({ ...req.query, status: 'OnSale' });

    // If error return.
    if (validation.hasError) {
      return handleError({ res, err: validation.error, statusCode: 422 });
    }

    const { sanitizedData } = validation;
    const data = await getAllPropertiesService(sanitizedData, __user);
    return handleResponse({
      res,
      msg: messages.SUCCESS,
      data,
    });
  } catch (error) {
    Logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};
