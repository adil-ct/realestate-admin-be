import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import db from '../../connections/dbMaster.js';
import config from '../../config/config.js';
import logger from '../../config/logger.js';
import constants from '../../config/constants.js';
import userModel from './model.js';
import earlyAccessModel from './earlyAccessModel.js';
import { GenerateRandomStringOfLength } from '../../helpers/helpers.js';
import { auth_sendEmail } from '../../helpers/auth.js';
import dateFormats from '../../helpers/date.js';
const { ObjectId } = mongoose.Types;
const configModel = db.collection('config');
const Referral = db.collection('referral');

export const findUsers = async (ids) => {
  try {
    logger.info('Inside find users service');
    ids.forEach(async (el) => {
      let data = await userModel.findOne({ _id: ObjectId(el) });
      if (data) {
        let temporaryPassword = GenerateRandomStringOfLength(10);
        await userModel.updateOne(
          { _id: ObjectId(el) },
          {
            password: await bcrypt.hash(temporaryPassword, 10),
            temporaryPassword: await bcrypt.hash(temporaryPassword, 10),
            tempPasswordExpiry: dateFormats.earlyAccessTempPasswordExpiry(),
            temporaryPasswordSent: true,
            forceUpdatePassword: true,
            emailVerified: true,
          }
        );
        await auth_sendEmail({
          type: constants.templateNames.TEMPORARY_PASSWORD,
          email: data?.email,
          request: {
            email: data?.email,
            temporaryPassword,
            url: `${await config.baseUrl}/properties`,
          },
        });
      }
    });
    return true;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const getEarlyAccessStatus = async (emails) => {
  try {
    logger.info('Inside get early access status service');
    let data = [];
    const emailList = [];
    emails.forEach((el) => emailList.push(el.email));
    const users = await userModel.aggregate([
      {
        $match: {
          email: {
            $in: emailList,
          },
        },
      },
    ]);
    emails.forEach((el) => {
      let userData = users.find((items) => items.email === el.email);
      if (userData) {
        data.push({
          _id: userData._id,
          email: el.email,
          id: el.id,
          registered: true,
          createdAt: userData?.createdAt,
        });
      } else {
        data.push({
          email: el.email,
          id: el.id,
          registered: false,
        });
      }
    });
    const earlyAccessGranted = await earlyAccessModel.find({});
    data.forEach((el) => {
      let earlyAccessData = earlyAccessGranted.find((items) => items.email === el.email);
      if (earlyAccessData) {
        if (dateFormats.earlyAccessResend(el.updatedAt) < dateFormats.getCurrentDateTime()) {
          el.resend = true;
        }
        el.earlyAccess = true;
      } else {
        el.resend = false;
        el.earlyAccess = false;
      }
    });
    return data;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const checkEmailExist = async (emails) => {
  try {
    logger.info('Inside check email exists service');
    const users = await userModel.aggregate([
      {
        $match: {
          email: {
            $in: emails,
          },
        },
      },
    ]);
    const emailList = emails.filter((item) => !users.some((it) => it.email === item));
    return emailList;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const filterValues = async (filters, data) => {
  try {
    logger.info('Inside filter value service');
    let { status, search, startIndex, limit } = filters;
    if (!status && !search && !startIndex && !limit) {
      return null;
    }
    let result = [];
    if (status) {
    }
    if (search) {
      search = search.replace(/[^a-zA-Z0-9. ]/gi, '');
      search = new RegExp(`${search}`, 'i');
      data.forEach((el) => {
        if (el.email.match(search)) result.push(el);
      });
    }

    if (startIndex && limit) {
      if (result.length > 0) {
        result = result.slice(startIndex, startIndex + limit);
        return result;
      } else {
        data = data.slice(startIndex, startIndex + limit);
        return data;
      }
    } else {
      if (result.length > 0) {
        result = result.slice(0, 20);
        return result;
      } else {
        data = data.slice(0, 20);
        return data;
      }
    }
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const getConfig = async () => {
  try {
    logger.info('Inside get config service');
    const config = await configModel.findOne();
    return config;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const updateUser = async (emails) => {
  try {
    logger.info('Inside update user service');
    const user = await userModel.updateMany({ email: { $in: emails } }, { earlyAccess: true });
    return user;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const checkEarlyAccessList = async (emailList) => {
  try {
    logger.info('Inside check early Access List service');
    const emails = await earlyAccessModel.find({});
    const newEmails = [];
    emailList.forEach((el) => {
      let earlyAccessData = emails.find((items) => items.email === el);
      if (!earlyAccessData) newEmails.push(el);
    });
    return newEmails;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const createEarlyAccess = async (emailList) => {
  try {
    logger.info('Inside create early access service');
    const request = [];
    emailList.forEach((el) => request.push({ email: el }));
    const add = await earlyAccessModel.insertMany(request);
    return add;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const removeEarlyAccess = async (email) => {
  try {
    logger.info('Inside remove from early access service');
    await earlyAccessModel.deleteOne({ email });
    await userModel.updateOne({ email }, { earlyAccess: false });
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const checkUser = async (userId) => {
  try {
    logger.info('Inside check user service');
    const user = userModel.findOne({ _id: ObjectId(userId) });
    return user;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const updateAffiliateStatus = async (userId, data) => {
  try {
    logger.info('Inside update affiliate status service');
    const status = await Referral.updateOne({ referralId: userId }, { $set: data });
    return status;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const fetchAffiliateUsers = async (filter) => {
  try {
    logger.info('Inside fetch affiliate users service');
    let page = filter.startIndex ?? 1;
    let limit = filter.itemsPerPage ?? 20;
    let search = filter.search;
    let users = await Referral.aggregate([
      {
        $match: {
          affiliate: true,
        },
      },
      {
        $lookup: {
          from: 'user',
          foreignField: '_id',
          localField: 'referralId',
          as: 'referralUser',
        },
      },
      {
        $unwind: {
          path: '$referralUser',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          referralId: 1,
          referralEarnings: 1,
          affiliate: 1,
          lastThreshold: 1,
          firstName: '$referralUser.firstName',
          lastName: '$referralUser.lastName',
          email: '$referralUser.email',
          countryCode: '$referralUser.countryCode',
          mobileNumber: '$referralUser.mobileNumber',
          kycStatus: '$referralUser.kycStatus',
        },
      },
    ]).toArray();

    if (search) {
      search = search.replace(/[^a-zA-Z0-9.@-_ -]/gi, '');
      search = new RegExp(`${search}`, 'i');
      users = users
        .map((el) => {
          if (el.firstName && el.firstName.match(search)) return el;
          if (el.lastName && el.lastName.match(search)) return el;
          if (el.email && el.email.match(search)) return el;
        })
        .filter((it) => it);
    }
    const totalCount = users.length;
    users = users.slice((page - 1) * limit, page * limit);
    return {
      users,
      totalCount,
    };
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};


export const getAllEarlyInvestorListService = async ()=>{
  try {
    logger.info('Inside get all early investor list users service');
    return await earlyAccessModel.find()
  } catch (error) {
    logger.error(err.message);
    return { error: err.message };
  }
}