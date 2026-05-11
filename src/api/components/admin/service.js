import db from '../../connections/dbMaster.js';
import mongoose from 'mongoose';
import axios from 'axios';
import logger from '../../config/logger.js';
import config from '../../config/config.js';
import constants from '../../config/constants.js';
import pagination from '../../helpers/pagination.js';
import { getWalletBalance } from '../../helpers/circle.js';
import bcrypt from 'bcrypt';
import { checkPassword, GenerateRandomStringOfLength } from '../../helpers/helpers.js';
const balanceModel = db.collection('property-balance');
const orderModel = db.collection('property-orders');
const configModel = db.collection('config');
const userModel = db.collection('user');
const referralModel = db.collection('referral');
const { ObjectId } = mongoose.Types;
import adminModel from './model.js';
import PropertyModel from '../property/model.js';
import messages from '../../config/messages.js';
import { auth_sendEmail } from '../../helpers/auth.js';
import { sendToSocketWebhook } from '../../helpers/webhook.js';
import _ from 'lodash';
import RegexQueryGenerator from '../../helpers/regex-query-generator.js';
import { exportData } from '../../helpers/exportData.js';
import { sendDatafileEmail } from '../../helpers/sendDataToEmail.js';
import VenlyHelperClass from '../../helpers/venly.helper.js';
import dateFormats from '../../helpers/date.js';

const VenlyHelper = new VenlyHelperClass();

export const getAdminByField = async (value, field) => {
  try {
    logger.info('Inside get admin by field service');
    if (value === undefined) {
      return { error: messages.INVALID_DATA };
    }
    const admin = await adminModel.findOne({
      [`${field}`]: value,
    });
    return admin;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const editAdmin = async (id, requestData) => {
  try {
    logger.info('Inside edit admin password service');
    if (requestData?.password) {
      requestData.password = await bcrypt.hash(requestData.password, 10);
    }
    const updatedAdmin = await adminModel
      .findByIdAndUpdate(id, requestData, {
        new: true,
      })
      .lean();
    if (updatedAdmin?.error || updatedAdmin === null) {
      return { error: updatedAdmin?.error || messages.ADMIN_NOT_FOUND };
    }

    // Sync update to mogul-auth database
    try {
      const dbConfig = await config.db;
      const dbString = dbConfig.str;
      
      if (!dbString) {
        logger.error('Database connection string is not available');
        return updatedAdmin;
      }
      
      // Derive auth DB string - replace mogul-admin with mogul-auth
      const authDbString = dbString.replace(/mogul-admin/g, 'mogul-auth');
      
      // Create connection to auth database
      const authConn = await mongoose.createConnection(authDbString).asPromise();
      
      // Define the same schema for auth database
      const authAdminSchema = new mongoose.Schema(
        {
          email: { type: String, require: true },
          userType: { type: String, default: 'admin', enum: ['admin'] },
          password: { type: String, required: true },
          countryCode: { type: String },
          mobileNumber: { type: Number },
          expiresAt: { type: Date },
          isSuperAdmin: { type: Boolean, default: false },
          twoFA: {
            sms: { type: Boolean, default: false },
            none: { type: Boolean, default: true },
          },
          forgotPasswordRequest: { type: Boolean, default: false },
          forceUpdatePassword: { type: Boolean, default: false },
          tempPasswordExpiry: { type: Date },
          status: { type: String, default: 'Active', enum: ['Active', 'Deactive'] },
          deactivatedAt: { type: Date },
          name: { type: String, require: true },
          passwordResetToken: String,
        },
        {
          collection: 'admin',
          timestamps: true,
        }
      );
      
      const AuthAdminModel = authConn.model('admin', authAdminSchema);
      
      // Update auth database with same data
      await AuthAdminModel.findByIdAndUpdate(id, requestData, {
        new: true,
      });
      
      // Close the connection
      await authConn.close();
    } catch (authSyncError) {
      logger.error(`Failed to sync admin update to mogul-auth database: ${authSyncError.message}`);
      // Don't fail the entire operation if auth sync fails, but log it
    }

    return updatedAdmin;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const getForgotPasswordList = async () => {
  try {
    logger.info('Inside get forgot password list service');
    const list = adminModel.find({ forgotPasswordRequest: true }).select('email isSuperAdmin forgotPasswordRequest mobileNumber');

    return list;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const updateConfig = async (data) => {
  try {
    logger.info('Inside update config service');
    const configData = await configModel.findOne({});
    const update = await configModel.updateOne({ _id: configData._id }, data);
    return update;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const getInvestorListService = async (user, data = {}) => {
  try {
    logger.info('Inside get investor list service');
    const query = { $match: { userType: 'investor' } };
    let { startIndex, sendData, itemsPerPage, kycStatus, search } = data;
    const skipCount = +startIndex > 0 ? +startIndex - 1 : 0;
    const perPage = +itemsPerPage > 0 ? +itemsPerPage : 350;

    if (kycStatus) {
      query.$match.kycStatus = kycStatus;
    }
    /* if (search) {
      query.$or = [{ firstName: search }, { email: search }];
    }
    let result = await userModel.find(query).sort({ lastLoggedIn: -1 }).toArray(); */
    let result = await userModel
      .aggregate([
        query,
        {
          $lookup: {
            from: 'referral',
            foreignField: 'referralId',
            localField: '_id',
            as: 'referralData',
          },
        },
        {
          $unwind: {
            path: '$referralData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { lastLoggedIn: -1 },
        },
        {
          $addFields: {
            affiliate: '$referralData.affiliate',
          },
        },
        {
          $project: {
            referralData: 0,
          },
        },
      ])
      .toArray();
    result.forEach((el) => {
      if (!el?.isActiveUser && el?.blockStatus === false) {
        el.isActiveUser = true;
      } else if (!el?.isActiveUser && el?.blockStatus === true) {
        el.isActiveUser = false;
      } else {
        el.isActiveUser = true;
      }
    });

    if (search) {
      search = search.replace(/[^a-zA-Z0-9. ]/gi, '');
      search = new RegExp(`${search}`, 'i');
      result = result
        .map((el) => {
          if (el?.firstName && el?.firstName.toString().match(search)) return el;
          if (el?.email.toString().match(search)) return el;
        })
        .filter((it) => it);
    }

    if (sendData && result.length > 0 && ['toCsv', 'toXls'].includes(sendData)) {
      const type = sendData;
      const resultData = result
        .map((item) => {
          const resultObj = {
            name: `${item.firstName} ${item.lastName}`,
            email: item.email,
            kycStatus: item.kycStatus,
            lastLogin: dateFormats.toLocalFormat(item.lastLoggedIn),
          };
          return resultObj;
        })
        .filter((item) => item);

      const fileName = `All-investors-${user?.name || 'data'}-admin`;
      const createData = await exportData({ resultData, type, fileName });
      if (createData?.error) return { error: createData.error };
      await sendDatafileEmail(user.email, type, fileName);
    }
    const totalItems = result.length;
    result = result.slice(skipCount * perPage, skipCount * perPage + perPage);
    const paginatedResult = {
      totalItems,
      startIndex: skipCount + 1,
      itemsPerPage: perPage,
      items: result,
    };

    return paginatedResult;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const getInvestor = async (userId) => {
  try {
    logger.info('Inside getInvestor service');
    const user = await userModel.findOne({ _id: ObjectId(userId) });

    if (!user) {
      return { user: {}, referredBy: {} };
    }

    let referralDetails;
    if (user.referralCode) {
      // /* Getting my referral details */
      let referral = await referralModel.findOne({
        'referee.refereeId': user._id,
      });
      if (referral) {
        referralDetails = await userModel.findOne({
          _id: referral.referralId,
        });
      }
    }

    delete user?.password;
    delete user?.forceUpdatePassword;
    delete user?.kycInquiryId;

    const referredBy = {
      email: referralDetails?.email,
      firstName: referralDetails?.firstName,
      lastName: referralDetails?.lastName,
      referralCode: referralDetails?.referralCode,
    };
    return { user, referredBy };
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const getPropertyListService = async (data = {}) => {
  try {
    logger.info('Inside get investor list service');
    let { id, startIndex, itemsPerPage } = data;
    const result = await pagination.Paginate({
      Model: PropertyModel,
      startIndex,
      query: { 'otherInfo._owner': id },
      itemsPerPage,
    });
    return result;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const blacklistInvestorService = async (data) => {
  try {
    logger.info('Inside blacklist investor service');

    let { userId, blacklistType, reason } = data;
    const filter = {
      _id: ObjectId(userId),
    };
    const user = await userModel.findOne(filter);
    if (!user) {
      return { hasError: true, error: 'User not found' };
    }
    const updateObj = {};
    if (user.blockStatus) {
      updateObj.blockStatus = false;
      updateObj.blacklilstType = '';
      updateObj.blockReason = '';

    } else {
      updateObj.blockStatus = true;
      updateObj.blockedAt = new Date()
      updateObj.blacklilstType = blacklistType.toLowerCase();
      updateObj.blockReason = reason ? reason.toLowerCase() : '';
    }

    const result = await userModel.findOneAndUpdate(filter, { $set: updateObj }, { new: true });
    await sendToSocketWebhook('notification', {
      _user: user,
      message: updateObj.blockStatus
        ? 'Attention! Due to some unusual activity, you are under review by the platform. Please check your email to know more.'
        : 'Your account has been unblocked!',
      itemId: userId,
      itemType: 'User',
      notificationType: 'systemMessages',
    });

    return {
      userStatus: updateObj.blockStatus ? 'User Blocked' : 'User Unblocked',
      ...updateObj,
    };
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const listAssetsService = async (data) => {
  try {
    logger.info('Inside List Assets service service');
    const { user, page, limit, search } = data;
    const skipCount = page ? (+page > 0 ? +page - 1 : 0) : 0;
    const perPage = limit ? +limit : 20;
    const priceParser = (fieldName) => {
      return {
        $convert: {
          input: fieldName,
          to: 'double',
        },
      };
    };

    const assets = await balanceModel
      .aggregate([
        {
          $match: { _user: user._id },
        },
        {
          $lookup: {
            from: 'property-transaction',
            let: { propertyId: '$_property' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_property', '$$propertyId'],
                  },
                },
              },
              {
                $sort: {
                  createdAt: -1,
                },
              },
              {
                $limit: 1,
              },
              {
                $project: {
                  price: 1,
                },
              },
            ],
            as: 'lastTx',
          },
        },
        {
          $unwind: {
            path: '$lastTx',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'property',
            let: { propertyId: '$_property' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$propertyId'],
                  },
                },
              },
              {
                $project: {
                  'otherInfo.title': 1,
                  mainImage: {
                    $arrayElemAt: ['$images.list', '$images.mainImage'],
                  },
                  'crowdSale.numberOfTokens': 1,
                  'financials.propertyValues': 1,
                  'financials.currentDebt': 1,
                },
              },
            ],
            as: 'propertyDetails',
          },
        },
        {
          $unwind: {
            path: '$propertyDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            'propertyDetails.otherInfo.title': {
              $regex: search || '',
              $options: 'i',
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $project: {
            _property: 1,
            tokens: 1,
            title: '$propertyDetails.otherInfo.title',
            mainImage: '$propertyDetails.mainImage',
            boughtAtPrice: '$avgPrice',
            numberOfTokens: '$propertyDetails.crowdSale.numberOfTokens',
            propertyValues: { $last: '$propertyDetails.financials.propertyValues.value' },
            currentDebt: '$propertyDetails.financials.currentDebt',
            currentPrice: {
              $sum: priceParser({
                $divide: [
                  {
                    $subtract: [
                      {
                        $last: '$propertyDetails.financials.propertyValues.value',
                      },
                      '$propertyDetails.financials.currentDebt',
                    ],
                  },
                  '$propertyDetails.crowdSale.numberOfTokens',
                ],
              }),
            },
          },
        },
        {
          $skip: skipCount * perPage,
        },
        {
          $limit: perPage,
        },
      ])
      .toArray();

    const totalCount = await balanceModel
      .aggregate([
        {
          $match: {
            _user: user._id,
          },
        },
        {
          $count: 'count',
        },
      ])
      .toArray();

    for (let i = 0; i < assets.length; i++) {
      let tokens = await tokensAtSold(assets[i]._property);
      assets[i].tokensSold = assets[i].numberOfTokens - tokens;
      assets[i].tokensSoldPercentage = ((assets[i].tokensSold / assets[i].numberOfTokens) * 100).toFixed(2);
    }

    const paginatedResult = {
      totalItems: totalCount?.[0]?.count ?? 0,
      page: skipCount + 1,
      limit: perPage,
      items: assets,
    };

    return { hasError: false, value: paginatedResult };
  } catch (err) {
    logger.error(err.message);
    return { hasError: true, error: err.message };
  }
};

export const tokensAtSold = async (propertyId) => {
  try {
    logger.info('Inside tokens at sold service');
    const status = ['pending', 'partial'];
    const tokens = await orderModel
      .aggregate([
        {
          $match: { _property: ObjectId(propertyId), status: { $in: status } },
        },
        {
          $group: {
            _id: '$_property',
            availableTokens: { $sum: '$tokens' },
          },
        },
      ])
      .toArray();
    if (tokens.length === 0) return null;
    return tokens[0].availableTokens;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const getFees = async () => {
  try {
    logger.info('Inside get fees service');
    let fee = configModel.find({});
    fee = await fee.toArray();
    return fee;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const getBalance = async (blockchainAddress) => {
  try {
    logger.info('Inside get balance service');
    let erc20 = 0;
    if (blockchainAddress) {
      let balance = await VenlyHelper.getWalletBalance(blockchainAddress);
      if (balance?.value.length === 0) erc20 = 0;
      balance.value.forEach((el) => {
        if (el.symbol === 'USDC') {
          erc20 += el.balance;
        }
      });
    }
    return erc20;
  } catch (err) {
    logger.error(err.message);
    return { error: err?.response?.data };
  }
};

export const portfolioSummary = async (user) => {
  try {
    logger.info('Inside Portfolio Summary service');
    const priceParser = (fieldName) => {
      return {
        $convert: {
          input: fieldName,
          to: 'double',
        },
      };
    };
    let promise = null,
      promises = [];
    promise = balanceModel
      .aggregate([
        {
          $match: {
            _user: user._id,
          },
        },
        // {
        //   $lookup: {
        //     from: 'property-transaction',
        //     let: { propertyId: '$_property' },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: {
        //             $eq: ['$_property', '$$propertyId'],
        //           },
        //         },
        //       },
        //       {
        //         $sort: {
        //           createdAt: -1,
        //         },
        //       },
        //       {
        //         $limit: 1,
        //       },
        //     ],
        //     as: 'lastTx',
        //   },
        // },
        // {
        //   $unwind: {
        //     path: '$lastTx',
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        {
          $lookup: {
            from: 'property',
            foreignField: '_id',
            localField: '_property',
            as: 'propertyDetails',
          },
        },
        {
          $unwind: {
            path: '$propertyDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: null,
            investedValue: {
              $sum: { $multiply: [priceParser('$avgPrice'), '$tokens'] },
            },
            currentValue: {
              $sum: {
                $multiply: [
                  priceParser({
                    $divide: [
                      {
                        $subtract: [
                          {
                            $last: '$propertyDetails.financials.propertyValues.value',
                          },
                          '$propertyDetails.financials.currentDebt',
                        ],
                      },
                      '$propertyDetails.crowdSale.numberOfTokens',
                    ],
                  }),
                  '$tokens',
                ],
              },
            },
          },
        },
      ])
      .toArray();
    promises.push(promise);
    // promise = await getWalletBalance(user?.blockchainAddress);
    promises.push(promise);
    let [summary, balance] = await Promise.all(promises);
    let rentalIncome = 0; // TODO: cashflow module yet to be implemented.
    const totalReturn = (summary[0]?.currentValue ?? 0) - (summary[0]?.investedValue ?? 0);
    const result = {
      portfolioValue: (summary[0]?.currentValue ?? 0) - (user.blockedFunds ?? 0),
      growthPercentage: (totalReturn / (summary[0]?.investedValue ?? 1)) * 100,
      rentalIncome,
      totalReturn,
      nextPayout: null,
    };
    return { hasError: false, value: result };
  } catch (err) {
    logger.error(err.message);
    return { hasError: true, error: err.message };
  }
};

export const getAdminDataList = async (data = {}) => {
  try {
    logger.info('Inside get admin list service');
    let { name, status, startIndex, itemsPerPage } = data;
    const query = RegexQueryGenerator.Generate({
      searchFields: _.pickBy(
        {
          name,
          status,
          isSuperAdmin: false,
        },
        _.identity
      ),
      excludeRegex: ['status', 'isSuperAdmin'],
    });
    if (data.sortObj?.mobileNumber) {
      data.sortObj = {
        ...data.sortObj,
        ...{
          countryCode: data.sortObj.mobileNumber,
          mobileNumber: data.sortObj.mobileNumber,
        },
      };
    }

    const aggregateQuery = [];
    aggregateQuery.push({
      $match: query,
    });

    const skipCount = startIndex ? (+startIndex > 0 ? +startIndex - 1 : 0) : 0;
    const perPage = itemsPerPage ? +itemsPerPage : 20;

    const documentsPromise = adminModel.aggregate([
      ...aggregateQuery,
      {
        $project: {
          name: 1,
          email: 1,
          status: 1,
          countryCode: 1,
          mobileNumber: 1,
          isSuperAdmin: 1,
        },
      },
      // lookup for last logged in time.
      {
        $lookup: {
          from: 'logins',
          let: { adminId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$user_id', '$$adminId'],
                },
              },
            },
            {
              $sort: {
                logged_in_at: -1,
              },
            },
            { $limit: 1 },
          ],
          as: 'lastLogin',
        },
      },
      {
        $set: {
          lastLogin: { $arrayElemAt: ['$lastLogin.logged_in_at', 0] },
        },
      },
      ...(data.sortObj !== undefined ? [{ $sort: data.sortObj }] : []),
      {
        // Give the startIndex.
        $skip: skipCount * perPage,
      },
      {
        // Give the itemsPerPage required.
        $limit: perPage,
      },
    ]);
    const countPromise = adminModel.aggregate([
      ...aggregateQuery,
      {
        $count: 'count',
      },
    ]);

    const [documents, Count] = await Promise.all([documentsPromise, countPromise]);
    const totalItems = Count?.[0]?.count ?? 0;
    const result = {
      totalItems,
      startIndex: skipCount + 1,
      itemsPerPage: perPage,
      items: documents,
    };

    return result;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const getAdminPersonalDetails = async (_id) => {
  try {
    logger.info('Inside get admin personal details service');
    const list = adminModel.findById(_id).select('email name status mobileNumber');
    return list;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const createAdminInDb = async (data) => {
  try {
    logger.info('Inside create Admin service');
    if (!data) {
      return;
    }
    const password = await GenerateRandomStringOfLength(10);
    data.password = password;
    data.forceUpdatePassword = true;
    data.userType = 'admin';
    const admin = await adminModel.create(data);

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
    return admin;
  } catch (error) {
    logger.error(error.message);
    return { error: error.message };
  }
};

export const listInvestorTokens = async (data) => {
  try {
    logger.info('Inside listInvestorsToken service');
    const { userId, startIndex, itemsPerPage, sendData, __admin } = data;
    const skipCount = startIndex ? (+startIndex > 0 ? +startIndex - 1 : 0) : 0;
    const perPage = itemsPerPage ? +itemsPerPage : 20;

    let tokenList = await balanceModel
      .aggregate([
        {
          $match: {
            _user: ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: 'property',
            localField: '_property',
            foreignField: '_id',
            as: 'propertyDetails',
          },
        },
        {
          $unwind: {
            path: '$propertyDetails',
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            tokensOwned: '$tokens',
            asset: '$propertyDetails.otherInfo.title',
            totalTokens: '$propertyDetails.crowdSale.numberOfTokens',
            boughtAtPrice: '$avgPrice',
          },
        },
      ])
      .toArray();

    const totalCount = await balanceModel.countDocuments({
      _user: ObjectId(userId),
    });

    for (let i = 0; i < tokenList.length; i++) {
      tokenList[i].ownedPercent = ((tokenList[i].tokensOwned / tokenList[i].totalTokens) * 100).toFixed(2);
      tokenList[i].value = tokenList[i].tokensOwned * tokenList[i].boughtAtPrice;
    }

    if (sendData && tokenList.length > 0 && ['toCsv', 'toXls'].includes(sendData)) {
      const type = sendData;
      const resultData = tokenList
        .map((item) => {
          const resultObj = {
            asset: item.asset,
            tokensOwned: item.tokensOwned,
            value: `$${item.value}`,
            ownedPercent: item.ownedPercent,
          };
          return resultObj;
        })
        .filter((item) => item);

      const fileName = `All-Tokens-Investor-${__admin?.name || 'data'}-admin`;
      const createData = await exportData({ resultData, type, fileName });
      if (createData?.error) return { error: createData.error };
      await sendDatafileEmail(__admin.email, type, fileName);
    }

    tokenList = tokenList.slice(skipCount * perPage, skipCount * perPage + perPage);

    const paginatedResult = {
      totalItems: totalCount,
      startIndex: skipCount + 1,
      itemsPerPage: perPage,
      items: tokenList,
    };

    return paginatedResult;
  } catch (error) {
    logger.error(error.message);
    return { error: error.message };
  }
};

export const getPropertiesManagedByManager = async (managerId) => {
  try {
    logger.info('Inside get properties managed by manager service');
    const properties = await PropertyModel.aggregate([
      {
        $match: {
          'otherInfo._manager': ObjectId(managerId),
        },
      },
      {
        $lookup: {
          from: 'monthlyRent',
          foreignField: '_property',
          localField: '_id',
          as: 'monthlyRentData',
        },
      },
      {
        $addFields: {
          Fee: { $sum: '$monthlyRentData.managerFee' },
        },
      },
      {
        $project: {
          propertyName: '$otherInfo.title',
          state: '$attom.state',
          city: '$attom.city',
          country: '$attom.country',
          Fee: 1,
          startDate: '$crowdSale.startDate',
        },
      },
    ]);
    return properties;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const propertyInvestors = async (data) => {
  try {
    logger.info('Inside propertyInvestors service.');
    const { propertyId } = data;
    // Pagination commented for future use.
    // const startIndex = +page > 0 ? +page - 1 : 0;
    // const perPage = +limit > 0 ? +limit : 20;

    let investors = await balanceModel
      .aggregate([
        {
          $match: { _property: ObjectId(propertyId) },
        },
        {
          $lookup: {
            from: 'user',
            localField: '_user',
            foreignField: '_id',
            as: 'investorDetails',
          },
        },
        {
          $unwind: {
            path: '$investorDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            tokensOwned: '$tokens',
            investorId: '$investorDetails._id',
            firstName: '$investorDetails.firstName',
            lastName: '$investorDetails.lastName',
            boughtAtPrice: '$avgPrice',
          },
        },
      ])
      .toArray();

    const totalCount = investors.length;
    investors = investors.sort((a, b) => b.createdAt - a.createdAt);
    // .slice(startIndex * perPage, startIndex * perPage + perPage);

    return { totalCount, investors };
  } catch (error) {
    logger.error(error);
    return { hasError: true };
  }
};

export const calculatePlatformCredits = async () => {
  try {
    logger.info('Inside calculate platform credits service');
    const totalCredits = await userModel
      .aggregate([
        {
          $match: {},
        },
        {
          $group: {
            _id: '',
            totalCredits: { $sum: '$credits' },
          },
        },
        {
          $project: {
            _id: 0,
            credits: '$totalCredits',
          },
        },
      ])
      .toArray();
    return totalCredits[0]?.credits ?? 0;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const platformCredits = async () => {
  try {
    logger.info('Inside platformCredits service');
    const credits = await userModel
      .aggregate([
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$credits' },
          },
        },
      ])
      .toArray();
    return credits;
  } catch (error) {
    logger.error(error.message);
    return { error: error.message };
  }
};
