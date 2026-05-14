// import { Alchemy, Network } from 'alchemy-sdk';
import logger from '../../config/logger.js';
import config from '../../config/config.js';
import messages from '../../config/messages.js';
import userModel from '../user/model.js';
import { handleError, handleResponse } from '../../helpers/requestHandler.js';
import { createPM, editUser, getUserByField } from './service.js';
import { blockRequest, createPropertyManagerRequest } from './validator.js';
import mongoose from 'mongoose';
import { exportData } from '../../helpers/exportData.js';
import { sendDatafileEmail } from '../../helpers/sendDataToEmail.js';
import VenlyHelperClass from '../../helpers/venly.helper.js';
import { createFireblocksWallet, createVault } from '../../helpers/fireblocks.js';
const VenlyHelper = new VenlyHelperClass();

/* Alchemy config */
// const settings = {
//   authToken: (await config.alchemy).webhook.authToken,
//   network: Network[`${(await config.alchemy).network}`],
// };
// const alchemy = new Alchemy(settings);

export const createPropertyManager = async (req, res) => {
  try {
    logger.info('Inside create property manager controller');
    const validation = await createPropertyManagerRequest(req.body);
    if (validation.error) {
      return handleError({ res, err: validation.message });
    }
    const { email } = req.body;

    const userExist = await getUserByField('email', email);

    if (userExist?.error) {
      return handleError({ res, err: userExist.error });
    }
    if (userExist) {
      return handleError({
        res,
        err: messages.EMAIL_IS_REGISTERED,
        statusCode: 400,
      });
    }

    const propertyManager = await createPM(req.body);
    if (propertyManager?.error || !propertyManager) {
      return handleError({
        res,
        err: propertyManager.error || messages.SOMETHING_WENT_WRONG,
      });
    }

    /* Create Venly Wallet and blockchain Address */
    // const venlyRes = await VenlyHelper.createWallet({
    //   Id: propertyManager._id,
    //   type: 'property_manager',
    // });
    // if (venlyRes.hasError) return handleError({ res, err: venlyRes });
    // const request = {
    //   venly: {
    //     walletId: venlyRes.value.id,
    //     pincode: venlyRes.value.pincode,
    //   },
    //   blockchainAddress: venlyRes.value.address,
    // };
    const vaultName = `usr-${propertyManager._id.toString()}`;

    const fireBlockVault = await createVault(vaultName);

    if (fireBlockVault?.error) {
      return handleError({
        res,
        err: fireBlockVault.error,
      });
    }
    const fireBlockWallet = await createFireblocksWallet(fireBlockVault.id);
    if (fireBlockWallet?.error) {
      return handleError({ res, err: fireBlockWallet.error });
    }
    const request = {
      fireblocks: {
        vaultId: fireBlockVault.id,
      },
      blockchainAddress: fireBlockWallet.address,
    };
    await userModel.updateOne({ _id: propertyManager._id }, request);

    /* Add user blockchain address to alchemy webhook to receive event for address activity */
    // await alchemy.notify.updateWebhook((await config.alchemy).webhook.id, {
    //   addAddresses: [venlyRes.value.address],
    //   removeAddresses: [],
    // });

    return handleResponse({
      res,
      msg: messages.SUCCESS,
    });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const getPropertyManagerList = async (req, res) => {
  try {
    logger.info('Inside get property manager list controller');
    let queryRequest = {
      userType: 'property_manager',
    };
    const page = Number(req?.query?.page) ?? 1;
    const limit = Number(req?.query?.limit) ?? 10;
    if (req.query.search) {
      const query = req.query.search;
      queryRequest = {
        ...queryRequest,
        $or: [
          { companyName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { personName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
        ],
      };
    }

    let list = await userModel.aggregate([{ $match: queryRequest }]);

    if (req.query.sendData && list.length > 0 && ['toCsv', 'toXls'].includes(req.query.sendData)) {
      const type = req.query.sendData;
      const resultData = list
        .map((item) => {
          const resultObj = {
            companyName: item.companyName,
            emailId: item.email,
            contactPerson: item.personName,
            status: item.isActiveUser ? 'Active' : 'Not Active',
          };
          return resultObj;
        })
        .filter((item) => item);

      const fileName = `All-Property-Managers-${req.user.name || 'data'}-admin`;
      const createData = await exportData({ resultData, type, fileName });
      if (createData?.error) return { error: createData.error };
      await sendDatafileEmail(req.user.email, type, fileName);
    }

    const length = list && list.length > 0 ? list.length : 0;
    list = list.slice((page - 1) * limit, (page - 1) * limit + limit);
    if (list) {
      return handleResponse({
        res,
        result: list.length,
        data: { totalCount: length, data: list },
        msg: messages.SUCCESS,
      });
    }
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const getPropertyManager = async (req, res) => {
  try {
    logger.info('Inside get property manager  controller');
    if (!mongoose.Types.ObjectId.isValid(req.body.id)) {
      return handleError({
        res,
        err: messages.INVALID_CREDENTIAL,
      });
    }
    const propertyManager = await getUserByField('_id', req.body.id);

    if (!propertyManager) {
      return handleError({
        res,
        err: messages.USER_NOT_FOUND,
      });
    }
    delete propertyManager._doc.password;
    return handleResponse({
      res,
      data: propertyManager,
      msg: messages.SUCCESS,
    });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const block = async (req, res) => {
  try {
    logger.info('Inside block controller');
    if (!mongoose.Types.ObjectId.isValid(req.body.id)) {
      return handleError({
        res,
        err: messages.INVALID_CREDENTIAL,
      });
    }
    const validation = await blockRequest(req.body);
    if (validation.error) {
      return handleError({ res, err: validation.message });
    }
    const { id } = req.body;
    const user = await getUserByField('_id', id);
    if (user !== null && user?.error) {
      return handleError({ res, err: user?.error });
    }
    if (user === null) {
      return handleError({ res, err: messages.INVALID_CREDENTIAL });
    }
    if (user) {
      const requestQuery = {
        blockStatus: req.body.blockStatus,
        blockReason: req.body.blockReason,
        isActiveUser: req.body.blockStatus ? false : true,
      };
      const edit = await editUser(id, requestQuery);
      if (edit?.error || !edit) {
        return handleError({
          res,
          err: edit.error || messages.SOMETHING_WENT_WRONG,
        });
      }
    }
    return handleResponse({
      res,
      msg: messages.SUCCESS,
    });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const deletePropertyManager = async (req, res) => {
  try {
    logger.info('Inside delete property manager controller');
    const { id } = req.params;
    const user = await getUserByField('_id', id);
    if (user !== null && user?.error) {
      return handleError({ res, err: user?.error });
    }
    if (user === null) {
      return handleError({ res, err: messages.INVALID_CREDENTIAL });
    }
    if (user.registeredProperty) {
      return handleError({
        res,
        err: messages.REGISTER_PROPERTY_ERROR,
      });
    }
    const requestQuery = {
      isActiveUser: false,
    };
    await editUser(id, requestQuery);
    return handleResponse({
      res,
      msg: messages.USER_DEACTIVATED,
    });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};
