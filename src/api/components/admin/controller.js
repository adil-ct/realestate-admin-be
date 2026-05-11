import bcrypt from 'bcrypt';
import logger from '../../config/logger.js';
import config from '../../config/config.js';
import constants from '../../config/constants.js';
import messages from '../../config/messages.js';
import { auth_token, auth_sendSMS, auth_verifySMS, auth_sendEmail } from '../../helpers/auth.js';
import { checkPassword, GenerateRandomStringOfLength } from '../../helpers/helpers.js';
import { handleError, handleResponse } from '../../helpers/requestHandler.js';
import {
  getAdminByField,
  getForgotPasswordList,
  editAdmin,
  getAdminDataList,
  createAdminInDb,
  getAdminPersonalDetails,
  getInvestorListService,
  getPropertyListService,
  blacklistInvestorService,
  listAssetsService,
  portfolioSummary,
  getBalance,
  getFees,
  listInvestorTokens,
  getPropertiesManagedByManager,
  getInvestor,
  platformCredits,
  propertyInvestors,
  calculatePlatformCredits,
} from './service.js';
import {
  loginRequest,
  loginVerifyRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  createAdminRequest,
  updateAdminRequest,
  adminListValidator,
} from './validator.js';
import dateFormats from '../../helpers/date.js';
import adminModel from './model.js';
import { Types } from 'mongoose';
const ObjectId = Types.ObjectId;

export const login = async (req, res) => {
  try {
    logger.info('Inside login API controller');
    const validation = await loginRequest(req.body);
    if (validation.error) {
      return handleError({ res, err: validation.message });
    }
    const admin = await getAdminByField(req.body.email, 'email');
    if (admin !== null && admin?.error) {
      return handleError({ res, err: admin?.error });
    }
    if (admin === null) {
      return handleError({ res, err: messages.EMAIL_NOT_REGISTERED });
    }

    // if (!(await checkPassword(req.body.password, admin?.password))) {
    //   return handleError({
    //     res,
    //     err: messages.INCORRECT_PASSWORD,
    //   });
    // }
    // @todo not required now will uncomment in future if required
    // if (admin?.forceUpdatePassword && admin?.tempPasswordExpiry) {
    //   if (admin?.tempPasswordExpiry < dateFormats.getCurrentDateTime()) {
    //     return handleError({
    //       res,
    //       err: messages.TEMPORARY_PSWD_EXPIRED,
    //     });
    //   }
    //   return handleResponse({
    //     res,
    //     msg: messages.UPDATE_YOUR_PASSWORD,
    //     data: {
    //       _id: admin.id,
    //       email: admin.email,
    //       countryCode: admin.countryCode,
    //       mobileNumber: admin.mobileNumber,
    //       twoFA: admin.twoFA,
    //       forceUpdatePassword: admin.forceUpdatePassword,
    //       isSuperAdmin: admin.isSuperAdmin,
    //     },
    //   });
    // }
    if (admin.status === 'Deactive') {
      return handleError({
        res,
        err: messages.ACCOUNT_DEACTIVATED,
      });
    }
    const response = {
      _id: admin.id,
      email: admin.email,
      countryCode: admin.countryCode,
      mobileNumber: admin.mobileNumber,
      twoFA: admin.twoFA,
      isSuperAdmin: admin.isSuperAdmin,
      type: 'admin',
    };

    if (admin.twoFA.sms) {
      const sms = await auth_sendSMS({
        mobileNumber: admin.countryCode + admin.mobileNumber,
      });
      if (sms?.error) {
        return handleError({ res, err: sms.error });
      }
    }

    if (admin.twoFA.none) {
      const token = await auth_token(response);
      if (token?.error) {
        return handleError({ res, err: token.error });
      }
      response.token = token;
    }

    return handleResponse({ res, data: response, msg: messages.SUCCESS });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const loginVerify = async (req, res) => {
  try {
    logger.info('Inside login verify API controller');

    const validation = await loginVerifyRequest(req.body);
    if (validation.error) {
      return handleError({ res, err: validation.message });
    }

    const { userId, code, countryCode, mobileNumber } = req.body;
    const admin = await getAdminByField(userId, '_id');
    if (admin?.error) {
      return handleError({ res, err: admin.error });
    }
    if (admin === null) {
      return handleError({ res, err: messages.LOGIN_FAILED, statusCode: 400 });
    }
    const tokenPayload = {
      _id: admin.id,
      email: admin.email,
      countryCode: admin.countryCode,
      mobileNumber: admin.mobileNumber,
      twoFA: admin.twoFA,
    };

    if (admin.twoFA.sms) {
      const verify = await auth_verifySMS({
        mobileNumber: countryCode + mobileNumber,
        code,
      });
      if (verify?.error) {
        return handleError({ res, err: verify.error });
      }
    }
    admin._doc.token = await auth_token(tokenPayload);

    tokenPayload.token = admin._doc.token;
    delete admin._doc.password;
    return handleResponse({
      res,
      msg: messages.OTP_VERIFIED,
      data: tokenPayload,
    });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const fees = async (req, res) => {
  try {
    logger.info('Inside fees API controller');
    const feeDetails = await getFees();
    if (feeDetails?.error) {
      return handleError({ res, err: feeDetails.error });
    }
    return handleResponse({
      res,
      msg: messages.CIRCLE_FEE_DETAILS,
      data: feeDetails,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const walletBalance = async (req, res) => {
  try {
    logger.info('Inside wallet balance API controller');
    const user = req.user;
    let data;
    if (user?.blockchainAddress) {
      let balance = await getBalance(user.blockchainAddress);
      if (balance?.error) {
        return handleError({ res, err: balance.error });
      }
      data = {
        balance: parseFloat(balance),
      };
    } else {
      data = {
        balance: 0,
      };
    }

    const platformCredits = await calculatePlatformCredits();
    data.credits = platformCredits;
    return handleResponse({ res, msg: messages.WALLET_BALANCE, data });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    logger.info('Inside forgot password controller');
    const validation = await forgotPasswordRequest(req.body);
    if (validation.error) {
      return handleError({ res, err: validation.message });
    }
    const { email } = req.body;
    const admin = await getAdminByField(email, 'email');
    if (admin !== null && admin?.error) {
      return handleError({ res, err: admin?.error });
    }
    if (admin === null) {
      return handleError({ res, err: messages.EMAIL_NOT_REGISTERED });
    }

    await editAdmin(admin._id, { forgotPasswordRequest: true });

    return handleResponse({
      res,
      data: { email, userId: admin._id },
      msg: messages.FORGOT_PASSWORD_REQUEST_SEND_SUCCESS,
    });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const listAssets = async (req, res) => {
  try {
    logger.info('Inside List Assets API controller');
    const user = req.user;
    const { search, page, limit } = req.query;
    const listRes = await listAssetsService({ user, search, page, limit });
    if (listRes.hasError) {
      return handleError({ res, err: listRes.error });
    }
    return handleResponse({
      res,
      msg: messages.ASSETS_LIST,
      data: listRes.value,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getPortfolioSummary = async (req, res) => {
  try {
    logger.info('Inside Get Portfolio Summary API controller');
    const user = req.user;
    const summary = await portfolioSummary(user);
    if (summary.hasError) {
      return handleError({ res, err: summary.error });
    }
    return handleResponse({
      res,
      msg: messages.PORTFOLIO_SUMMARY,
      data: summary.value,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    logger.info('Inside reset password controller');
    const validation = await resetPasswordRequest(req.body);
    if (validation.error) {
      return handleError({ res, err: validation.message });
    }
    const { password } = req.body;
    const admin = await getAdminByField(req.user._id, '_id');
    // const encryptedPassword = await bcrypt.hash(password, 10);
    const requestQuery = {
      password,
      forceUpdatePassword: false,
    };
    const updatePassword = await editAdmin(admin._id, requestQuery);
    if (updatePassword.error) {
      return handleError({ res, err: updatePassword.error });
    }
    delete updatePassword.password;
    return handleResponse({
      res,
      msg: messages.PASSWORD_UPDATE_SUCCESS,
      data: [],
    });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const forgotPasswordList = async (req, res) => {
  try {
    logger.info('Inside forgot Password List controller');
    if (req.user.isSuperAdmin) {
      const list = await getForgotPasswordList();
      if (list) {
        return handleResponse({
          res,
          data: list,
          msg: messages.SUCCESS,
        });
      }
      if (list?.error) {
        return handleError({
          res,
          err: list.error || messages.SOMETHING_WENT_WRONG,
        });
      }
    }

    return handleError({
      res,
      err: messages.UNAUTHORIZED_ACCESS,
    });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const sendTempPassword = async (req, res) => {
  try {
    logger.info('Inside send temp password controller');
    const { id } = req.body;
    const adminExist = await getAdminByField(id, '_id');
    if (adminExist?.error || adminExist === null || adminExist === undefined) {
      return handleError({
        res,
        err: adminExist?.error || messages.EMAIL_NOT_REGISTERED,
      });
    }
    if (adminExist && adminExist.forcePasswordUpdate === false) {
      return handleError({
        res,
        err: messages.TEMPORARY_PSWD_ALREADY_UPDATED,
      });
    }
    const password = await GenerateRandomStringOfLength(8);
    // const encryptedPassword = await bcrypt.hash(password, 10);
    const randomString = await GenerateRandomStringOfLength(12);
    const requestQuery = {
      password,
      tempPasswordExpiry: dateFormats.tempPasswordExpiryTime(),
      forgotPasswordRequest: false,
      passwordResetToken: randomString,
      forceUpdatePassword: true,
    };

    const updateTempPass = await editAdmin(adminExist._id, requestQuery);
    if (updateTempPass.error) {
      return handleError({ res, err: updateTempPass.error });
    }
    await auth_sendEmail({
      type: constants.templateNames.TEMPORARY_PASSWORD,
      email: adminExist.email,
      request: {
        email: adminExist.email,
        temporaryPassword: password,
        // token: randomString,
        url: `${await config.baseUrl}/properties`,
      },
    });
    return handleResponse({
      res,
      msg: messages.TEMPORARY_PSWD_SENT_TO_EMAIL,
    });
  } catch (err) {
    logger.error(err);
    return handleError({ res, err: err.message });
  }
};

export const forceUpdatePassword = async (req, res) => {
  try {
    logger.info('Inside force update password API controller');
    const { id } = req.params;
    const validation = await resetPasswordRequest(req.body);
    if (validation?.error) {
      return handleError({ res, err: validation.message });
    }
    const admin = await getAdminByField(id, '_id');
    if (admin?.error) {
      return handleError({ res, err: admin.error });
    }
    if (!admin) {
      return handleError({ res, err: messages.ADMIN_NOT_FOUND });
    }
    const requestQuery = {
      forceUpdatePassword: false,
      $unset: { tempPasswordExpiry: 0 },
      password: req.body.password,
    };
    await editAdmin(admin._id, requestQuery);
    return handleResponse({ res, msg: messages.PASSWORD_UPDATE_SUCCESS });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getInvestorList = async (req, res) => {
  try {
    logger.info('Inside get investor list API');
    const { user } = req;
    const list = await getInvestorListService(user, req.query);
    if (list) {
      return handleResponse({
        res,
        data: list,
        msg: messages.SUCCESS,
      });
    }
    if (list?.error) {
      return handleError({
        res,
        err: list.error || messages.SOMETHING_WENT_WRONG,
      });
    }
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getInvestorDetails = async (req, res) => {
  try {
    logger.info('Inside getInvestorDetails controller');
    const { userId } = req.params;
    const result = await getInvestor(userId);
    if (result) {
      return handleResponse({
        res,
        data: result,
        msg: messages.SUCCESS,
      });
    }
    if (result?.error) {
      return handleError({
        res,
        err: result.error || messages.SOMETHING_WENT_WRONG,
      });
    }
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getPropertyList = async (req, res) => {
  try {
    logger.info('Inside get investor list API');
    const list = await getPropertyListService(req.query);
    if (list) {
      return handleResponse({
        res,
        data: list,
        msg: messages.SUCCESS,
      });
    }
    if (list?.error) {
      return handleError({
        res,
        err: list.error || messages.SOMETHING_WENT_WRONG,
      });
    }
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const blacklistInvestor = async (req, res) => {
  try {
    logger.info('Inside blacklist ivestor api controller');
    const data = req.body;
    const user = await blacklistInvestorService(data);
    if (user.hasError?.error) {
      return handleError({ res, err: user.error });
    }
    return handleResponse({
      res,
      data: user,
      msg: messages.SUCCESS,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getAdminList = async (req, res) => {
  try {
    logger.info('Inside get Admin List API controller');
    const validation = adminListValidator(req.query);
    if (validation.hasError) {
      return handleError({
        err: validation.error,
        res,
        statusCode: 422,
      });
    }
    const { sanitizedData } = validation;

    const list = await getAdminDataList(sanitizedData);
    if (list) {
      return handleResponse({
        res,
        data: list,
        msg: messages.SUCCESS,
      });
    }
    if (list?.error) {
      return handleError({
        res,
        err: list.error || messages.SOMETHING_WENT_WRONG,
      });
    }
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getAdminDetails = async (req, res) => {
  try {
    logger.info('Inside get admin list API controller');
    const { id } = req.params;
    const adminDetails = await getAdminPersonalDetails(id);

    if (adminDetails) {
      return handleResponse({
        res,
        data: adminDetails,
        msg: messages.SUCCESS,
      });
    }
    if (adminDetails?.error) {
      return handleError({
        res,
        err: adminDetails.error || messages.SOMETHING_WENT_WRONG,
      });
    }
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    logger.info('Inside create admin API controller');
    const validation = await createAdminRequest(req.body);
    if (validation.error) {
      return handleError({ res, err: validation.message });
    }
    const { email } = req.body;

    const userExist = await getAdminByField(email, 'email');

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

    const admin = await createAdminInDb(req.body);
    if (admin?.error || !admin) {
      return handleError({
        res,
        err: admin.error || messages.SOMETHING_WENT_WRONG,
      });
    }
    return handleResponse({
      res,
      msg: messages.SUCCESS,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    logger.info('Inside update admin API controller');
    const validation = await updateAdminRequest(req.body);
    if (validation.error) {
      return handleError({ res, err: validation.message });
    }
    const user = req.user;
    const admin = await editAdmin(user._id, req.body);
    delete admin.password;
    return handleResponse({ res, msg: messages.SUCCESS, data: admin });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    logger.info('Inside delete admin API controller');
    const { id } = req.params;
    const deleteAdmin = await adminModel.findOneAndDelete({
      _id: ObjectId(id),
      isSuperAdmin: false,
    });
    if (deleteAdmin) {
      return handleResponse({ res, msg: messages.SUCCESS });
    }
    return handleError({ res, msg: messages.ADMIN_NOT_FOUND });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const changeAdminStatus = async (req, res) => {
  try {
    logger.info('Inside change admin status API controller');
    const { id } = req.params;
    const admin = await adminModel.findOne({
      _id: ObjectId(id),
      // isSuperAdmin: false,
    });
    if (!admin) {
      return handleError({ res, msg: messages.ADMIN_NOT_FOUND });
    }
    if (admin?.isSuperAdmin) {
      return handleError({ res, err: "Super admin status is fixed and can't be changed." });
    }
    admin.status = admin.status === 'Active' ? 'Deactive' : 'Active';
    if (admin.status === 'Deactive') {
      admin.deactivatedAt = new Date();
    }
    await admin.save();
    return handleResponse({ res, msg: admin.status === 'Active' ? 'Admin activated successfully.' : 'Admin deactivated  successfully.' });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const profile = async (req, res) => {
  try {
    logger.info('Inside profile API controller');
    const user = req.user;
    delete user.password;
    delete user.passwordResetToken;
    delete user.forceUpdatePassword;
    delete user.bank;
    delete user.cards;
    return handleResponse({ res, msg: messages.PROFILE, data: user });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getInvestorTokens = async (req, res) => {
  try {
    logger.info('Inside getInvestorTokens API controller');
    const { id } = req.params;
    const { user: __admin } = req;
    const { startIndex, itemsPerPage, sendData } = req.query;
    const investorTokens = await listInvestorTokens({
      userId: id,
      __admin,
      sendData,
      startIndex,
      itemsPerPage,
    });
    if (investorTokens?.error) {
      return handleError({ res, err: investorTokens.error });
    }
    return handleResponse({
      res,
      msg: messages.SUCCESS,
      data: investorTokens,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getManagedProperties = async (req, res) => {
  try {
    logger.info('Inside get managed properties');
    const { managerId } = req.params;
    const propertyList = await getPropertiesManagedByManager(managerId);
    if (propertyList?.error) {
      return handleError({ res, err: propertyList.error });
    }
    return handleResponse({
      res,
      msg: messages.MANAGED_PROPERTY_LIST,
      data: propertyList,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getPlatformCredits = async (req, res) => {
  try {
    logger.info('Inside getPlatformCredits controller');
    const totalCredits = await platformCredits();
    if (totalCredits?.error) {
      return handleError({ res, err: totalCredits.error });
    }
    return handleResponse({
      res,
      msg: messages.SUCCESS,
      data: totalCredits,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getPropertyInvestors = async (req, res) => {
  try {
    logger.info('Inside getPropertyInvestors controller.');
    const { propertyId } = req.params;
    const result = await propertyInvestors({ propertyId });
    if (result?.hasError) {
      return handleError({
        res,
        err: messages.INVESTORS_NOT_FOUND,
        statusCode: 404,
      });
    }
    return handleResponse({
      res,
      msg: messages.INVESTORS_LIST,
      data: result,
    });
  } catch (error) {
    logger.error(error);
    return handleError({ res, err: error?.message });
  }
};
