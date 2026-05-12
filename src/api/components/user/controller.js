import mongoose from 'mongoose';
import logger from '../../config/logger.js';
import config from '../../config/config.js';
import messages from '../../config/messages.js';
import Property from '../property/model.js';
import User from './model.js';
import { sendgrid_getContactList, sendgrid_addOrUpdateContact } from '../../helpers/sendgrid.js';
import { handleError, handleResponse } from '../../helpers/requestHandler.js';
import { updateConfig } from '../admin/service.js';
import {
  getEarlyAccessStatus,
  getConfig,
  updateUser,
  checkEarlyAccessList,
  createEarlyAccess,
  removeEarlyAccess,
  filterValues,
  checkUser,
  updateAffiliateStatus,
  fetchAffiliateUsers,
  getAllEarlyInvestorListService,
} from './service.js';
import constants from '../../config/constants.js';
import { auth_sendEmail } from '../../helpers/auth.js';
import message from '../../config/messages.js';
const ObjectId = mongoose.Types.ObjectId;

export const earlyAccessList = async (req, res) => {
  try {
    logger.info('Inside early access list API controller');
    // const list = await sendgrid_getContactList();
    // if (list?.error) {
    //   return handleError({ res, err: list.error });
    // }
    // const status = await getEarlyAccessStatus(list.response.emails);
    // if (status?.error) {
    //   return handleError({ res, err: status.error });
    // }
    // const configData = await getConfig();
    // list.response.earlyAccessStatus = configData.earlyAccess;
    // list.response.emails = status;
    return handleResponse({
      res,
      data: [],
      msg: messages.EARLY_ACCESS_INVESTOR_LIST,
    });
  } catch (err) {
    logger.error(err.message);
  }
};

export const grantEarlyAccess = async (req, res) => {
  try {
    logger.info('Inside sign up early access API controller');
    const { emails } = req.body;
    if (emails.length === 0) {
      return handleError({
        res,
        err: messages.EMAILS_REQUIRED,
        statusCode: 400,
      });
    }
    const newEmailList = await checkEarlyAccessList(emails);
    if (newEmailList?.error) {
      return handleError({ res, err: newEmailList.error });
    }
    if (newEmailList.length === 0) {
      return handleError({
        res,
        err: messages.EMAIL_ALREADY_IN_EARLY_ACCESS,
        statusCode: 400,
      });
    }

    const users = await updateUser(newEmailList);
    if (users?.error) {
      return handleError({ res, err: users.error });
    }

    const earlyAccess = await createEarlyAccess(newEmailList);
    if (earlyAccess?.error) {
      return handleError({ res, err: earlyAccess.error });
    }

    await auth_sendEmail({
      email: newEmailList,
      type: constants.templateNames.GRANTING_EARLY_ACCESS,
    });
    return handleResponse({
      res,
      msg: messages.EMAILS_REGISTERED,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const earlyAccessStatus = async (req, res) => {
  try {
    logger.info('Inside early access status API controller');
    const { status } = req.params;
    const update = await updateConfig({
      $set: { earlyAccess: status === 'true' ? true : false },
    });
    if (update?.error) {
      return handleError({ res, err: update.error });
    }
    return handleResponse({ res, msg: messages.EARLY_ACCESS_STATUS_UPDATED });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const addToEarlyAccess = async (req, res) => {
  try {
    logger.info('Inside add to early access API controller');
    const { emails } = req.body;
    if (emails.length === 0) {
      return handleError({ res, err: messages.INVALID_DATA, statusCode: 400 });
    }
    const contactList = await sendgrid_getContactList();
    if (contactList?.error) {
      return handleError({ res, err: contactList.error });
    }
    const newEmailList = emails.filter((item) => !contactList.response.emails.find((it) => it.email === item));
    if (newEmailList.length === 0) {
      return handleError({ res, err: messages.EMAIL_ALREADY_IN_EARLY_ACCESS });
    }
    const contactListId = await config.investorContactListId;
    const list = await sendgrid_addOrUpdateContact(newEmailList, contactListId);
    if (list?.error) {
      return handleError({ res, err: list.error });
    }
    return handleResponse({ res, msg: messages.EMAIL_ADDED_TO_EARLY_ACCESS });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const removeFromEarlyAccess = async (req, res) => {
  try {
    logger.info('Insdie remove from early access API controller');
    const { email } = req.params;
    const earlyAccessDenied = await removeEarlyAccess(email);
    if (earlyAccessDenied?.error) {
      return handleError({ res, err: earlyAccessDenied.error });
    }
    return handleResponse({
      res,
      msg: messages.USER_REMOVED_FROM_EARLY_ACCESS,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const affiliateStatus = async (req, res) => {
  try {
    logger.info('Inside affiliate status API controller');
    const { userId } = req.params;
    const { affiliate } = req.body;
    const user = await checkUser(userId);
    if (!user) return handleError({ res, err: messages.USER_NOT_FOUND, statusCode: 400 });
    const affiliateStatus = await updateAffiliateStatus(user._id, { affiliate });
    if (affiliateStatus?.error) return handleError({ res, err: affiliateStatus.error });
    return handleResponse({ res, msg: messages.USER_STATUS_UPDATED });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const investorsForAccessList = async (req, res) => {
  try {
    logger.info('Inside investors for access list API controller');
    const { propertyId } = req.params;
    let { page, limit, search } = req.query;
    if (!propertyId) return handleError({ res, err: message.INVALID_DATA });
    const property = await Property.findOne({ _id: ObjectId(propertyId) });
    if (!property) return handleError({ res, err: message.PROPERTY_NOT_FOUND, statusCode: 400 });
    let users = await User.find({ kycStatus: 'approved' }, { _id: 1, email: 1, firstName: 1, lastName: 1 }).lean();

    users = users.map((it) => ({ ...it, id: it._id }));
    const usersAvailable = [...users, ...property.investorAccessList];
    const resultObj = {};
    // Fetch the users that are not already added in that property investor access list
    usersAvailable.forEach((el) => {
      if (resultObj[el.id]) {
        delete resultObj[el.id];
      } else {
        resultObj[el.id] = el;
      }
    });
    let result = Object.values(resultObj);

    // Search for first name, last name and email
    if (search) {
      search = search.replace(/[^a-zA-Z0-9.@ ]/gi, '');
      search = new RegExp(`${search}`, 'i');
      result = result
        .map((el) => {
          if (el.firstName.toString().match(search)) return el;
          if (el.lastName.toString().match(search)) return el;
          if (el.email.toString().match(search)) return el;
        })
        .filter((it) => it);
    }

    // Pagination
    page = page ?? 1;
    limit = limit ?? 10;
    const skip = (page - 1) * limit;
    result = result.slice(skip, limit);
    return handleResponse({ res, data: result });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const affiliateUsers = async (req, res) => {
  try {
    logger.info('Inside affiliate users API controller');
    const users = await fetchAffiliateUsers(req.query);
    if (users?.error) return handleError({ res, err: users.error });
    return handleResponse({ res, msg: 'Affiliate Users List', data: users });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getEarlyAccessUserList = async (req, res) => {
  try {
    logger.info('inside get early access user list API controller');
    const users = await getAllEarlyInvestorListService();
    return handleResponse({ res, msg: 'Early access user list fetch successfully', data: users });
  } catch (error) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};
