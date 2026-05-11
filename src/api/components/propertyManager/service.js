import logger from '../../config/logger.js';
import config from '../../config/config.js';
import { auth_sendEmail } from '../../helpers/auth.js';
import { GenerateRandomStringOfLength } from '../../helpers/helpers.js';
import userModel from '../user/model.js';
import proposalModel from '../propertyManager/model.js';
import constants from '../../config/constants.js';
import bcrypt from 'bcrypt';

export const getUserByField = async (field, value) => {
  try {
    logger.info('Inside get user by field service');
    const user = await userModel.findOne({
      [`${field}`]: value,
    });
    return user;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const createPM = async (data) => {
  try {
    logger.info('Inside createPM service');
    if (!data) {
      return;
    }
    const password = 'Candour@123'; //await GenerateRandomStringOfLength(10);
    const encryptedPassword = await bcrypt.hash(password, 10);
    data.password = encryptedPassword;
    data.userType = 'property_manager';
    data.forceUpdatePassword = true;
    data.emailVerified = true;
    data.mobileVerified = true;

    const user = await userModel.create(data);
    if (data) {
      await auth_sendEmail({
        type: constants.templateNames.TEMPORARY_PASSWORD,
        email: data.email,
        request: {
          email: data.email,
          temporaryPassword: password,
          url: `${await config.baseUrl}/properties`,
        },
      });
    }
    return user;
  } catch (error) {
    logger.error(error.message);
    return { error: error.message };
  }
};

export const editUser = async (id, requestData) => {
  try {
    logger.info('Inside edit user service');
    const updatedUser = await userModel.updateOne(
      { _id: id },
      {
        $set: requestData,
      },
      {
        new: true,
      }
    );
    if (updatedUser?.error || updatedUser === null) {
      return { error: updatedUser?.error || messages.ADMIN_NOT_FOUND };
    }
    return updatedUser;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};
