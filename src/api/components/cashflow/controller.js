import logger from '../../config/logger.js';
import messages from '../../config/messages.js';
import db from '../../connections/dbMaster.js';
import { handleError, handleResponse } from '../../helpers/requestHandler.js';
import {
  createRentalPeriodValidator,
  getAllRentalPeriodsValidator,
  dismissRentalPeriodValidator,
  updateRentalPeriodValidator,
  rentDepositValidator,
} from './validator.js';
import {
  createRentalPeriodService,
  getAllRentalPeriodsService,
  dismissRentalPeriodService,
  updateRentalPeriodService,
  getProperty,
  updateMonthlyRentDoc,
  updatePopertyDoc,
  getCashflowTransactions,
  getRentTransaction,
  rentTransactionsList,
} from './service.js';
import { getWalletBalance } from '../../helpers/circle.js';
import CircleHelper from '../../helpers/circle.helper.js';
import { generateuuid } from '../../helpers/helpers.js';

import web3Helper from '../../helpers/web3.fireblocks.js';
const Transfer = db.collection('transfers');

export const createRentalPeriod = async (req, res) => {
  try {
    logger.info('Inside Create Rental Period controller.');

    const { user: __user } = req;

    const validation = createRentalPeriodValidator(req.body);

    // If error return.
    if (validation.error) {
      return handleError({ res, err: validation.message, statusCode: 422 });
    }

    let { sanitizedData } = validation;

    const result = await createRentalPeriodService(sanitizedData, __user);

    if (result.error === true) {
      return handleError({
        res,
        err: result.message,
        statusCode: result.statusCode,
      });
    }

    return handleResponse({
      res,
      msg: messages.CREATE_RENTAL_PERIOD_SUCCESS,
      data: result,
      statusCode: 201,
    });
  } catch (error) {
    logger.error(error);
    return handleError({
      res,
      err: error?.message,
    });
  }
};

export const updateRentalPeriod = async (req, res) => {
  try {
    logger.info('Inside Update Rental Period controller.');

    const { user: __user } = req;
    const { periodId } = req.params;

    const validation = updateRentalPeriodValidator(req.body);

    // If error return.
    if (validation.error) {
      return handleError({ res, err: validation.message, statusCode: 422 });
    }

    let { sanitizedData } = validation;

    const result = await updateRentalPeriodService(periodId, sanitizedData, __user);

    if (result.error === true) {
      return handleError({
        res,
        err: result.message,
        statusCode: result.statusCode,
      });
    }

    return handleResponse({
      res,
      msg: messages.UPDATE_RENTAL_PERIOD_SUCCESS,
      data: result,
      statusCode: 200,
    });
  } catch (error) {
    logger.error(error);
    return handleError({
      res,
      err: error?.message,
    });
  }
};

export const getAllRentalPeriods = async (req, res) => {
  try {
    logger.info('Inside Get All Rental Periods controller.');

    const { user: __user } = req;

    const validation = getAllRentalPeriodsValidator({
      ...req.query,
    });

    // If error return.
    if (validation.error) {
      return handleError({ res, err: validation.message, statusCode: 422 });
    }

    const { sanitizedData } = validation;

    const result = await getAllRentalPeriodsService(sanitizedData, __user);

    if (result.error === true) {
      return handleError({
        res,
        err: result.message,
        statusCode: result.statusCode,
      });
    }

    return handleResponse({
      res,
      msg: messages.GET_ALL_RENTAL_PERIOD_SUCCESS,
      data: { totalCount: result.totalCount, data: result.data },
      result: result.data.length,
      statusCode: 200,
    });
  } catch (error) {
    logger.error(error);
    return handleError({
      res,
      err: error?.message,
    });
  }
};

export const dismissRentalPeriod = async (req, res) => {
  try {
    logger.info('Inside Dismiss Rental Period controller.');

    const { user: __user } = req;

    const validation = dismissRentalPeriodValidator(req.body);

    // If error return.
    if (validation.error) {
      return handleError({ res, err: validation.message, statusCode: 422 });
    }

    const { sanitizedData } = validation;

    const result = await dismissRentalPeriodService(sanitizedData, req.params.periodId, __user);

    if (result?.error) {
      return handleError({
        res,
        err: result.error,
      });
    }

    return handleResponse({
      res,
      msg: sanitizedData.isDismissed ? messages.DISMISS_PERIOD_SUCCESS : messages.ENABLE_RENTAL_PERIOD,
      data: result,
    });
  } catch (error) {
    logger.error(error);
    return handleError({
      res,
      err: error?.message,
    });
  }
};

export const depositRent = async (req, res) => {
  try {
    logger.info('Inside deposit rent API controller');
    const __user = req.user;
    if (__user.userType !== 'property_manager') {
      return handleError({
        res,
        err: messages.UNAUTHORIZED_ACCESS,
        statusCode: 401,
      });
    }
    const validation = await rentDepositValidator(req.body);
    if (validation.error) {
      return handleError({ res, err: validation.message, statusCode: 422 });
    }
    const { principal, interest, taxes, insurance, HOAFee, LLCAdminFee, contingencyVars, propertyId, document } = req.body;

    const property = await getProperty(propertyId);
    if (property?.error) {
      return handleError({ res, err: property.error });
    }

    if (!property) {
      return handleError({
        res,
        err: messages.PROPERTY_NOT_FOUND,
        statusCode: 400,
      });
    }

    if (__user._id.toString() !== property.otherInfo._manager.toString()) {
      return handleError({
        res,
        err: messages.UNAUTHORIZED_PROPERTY_MANAGER,
        statusCode: 401,
      });
    }

    if (!property.cashflow._monthlyRent) {
      return handleError({
        res,
        err: messages.NO_RENTAL_PERIOD_AVAILABLE,
        statusCode: 400,
      });
    }

    const { cashflow, financials } = property;
    const managerFee = cashflow?.propertyMgtFee?.isEnabled ? cashflow?.propertyMgtFee.value : 0;
    const rentAmount = cashflow.monthlyRent[cashflow.monthlyRent.length - 1].value;
    const maintenanceFee =
      financials?.maintenanceReserve - financials?.maintenanceReserveBal <= cashflow?.maxMaintenanceFee
        ? financials?.maintenanceReserve - financials?.maintenanceReserveBal
        : cashflow?.maxMaintenanceFee;
    const vacancyFee =
      financials?.vacancyReserve - financials?.vacancyReserveBal <= cashflow?.maxVacancyFee
        ? financials?.vacancyReserve - financials?.vacancyReserveBal
        : cashflow?.maxVacancyFee;
    const HOA = cashflow?.HOAFee?.isEnabled ? HOAFee : 0;
    const LLC = cashflow?.LLCAdministrationFee?.isEnabled ? LLCAdminFee : 0;
    let contingencyVarValues = 0;
    contingencyVars.forEach((el) => {
      contingencyVarValues += el.value;
    });
    const deductions = principal + interest + taxes + insurance + LLC + HOA + contingencyVarValues;

    const amountToTransfer = rentAmount - deductions - managerFee;
    const distributableAmount = amountToTransfer - maintenanceFee - vacancyFee;
    let managerBalance = await getWalletBalance(__user?.blockchainAddress);
    if (parseFloat(managerBalance) < amountToTransfer) {
      return handleError({
        res,
        err: messages.INSUFFICIENT_BALANCE,
        statusCode: 422,
      });
    }
    const priceInWei = web3Helper.strToUSDCConvert(amountToTransfer);
    const transfer = await web3Helper.ExecuteMethod('SEND', web3Helper.contracts.Usdc, 'transfer', [property.blockchainAddress, priceInWei]);
    if (transfer?.hasError) {
      return handleError({ res, err: transfer.error });
    }
    const uuid = await generateuuid();
    await Transfer.insertOne({
      id: uuid,
      amount: {
        amount: amountToTransfer.toString(),
        currency: 'USD',
      },
      quoteCurrencyAmount: amountToTransfer.toFixed(2),
      transactionType: 'rent',
      transferType: 'sent',
      status: 'completed',
      propertyId: property._id,
      propertyName: property.otherInfo.title,
      admin: false,
      merchant: false,
      userId: __user._id,
      _monthlyRent: property.cashflow._monthlyRent,
      transactionHash: transfer.txHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const request = {
      rentAmount,
      managerFee,
      maintenanceFee,
      vacancyFee,
      distributableAmount,
      principal,
      interest,
      taxes,
      insurance,
      HOAFee,
      LLCAdministrationFee: LLCAdminFee,
      isRentReceived: true,
      document,
      contingencyVars,
    };
    const updateMonthlyRent = await updateMonthlyRentDoc(property.cashflow._monthlyRent, request);
    if (updateMonthlyRent?.error) {
      return handleError({ res, err: updateMonthlyRent.error });
    }
    await updatePopertyDoc(property._id, {
      'cashflow.principal': principal,
      'cashflow.interest': interest,
      'cashflow.taxes': taxes,
      'cashflow.insurance': insurance,
      'cashflow.LLCAdministrationFee.value': LLC,
      'cashflow.HOAFee.value': HOA,
      $inc: {
        'financials.maintenanceReserveBal': maintenanceFee,
        'financials.vacancyReserveBal': vacancyFee,
      },
    });
    return handleResponse({ res, msg: messages.RENT_DEPOSITED });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const cashflowTransaction = async (req, res) => {
  try {
    logger.info('Inside cashflow transactio API controller');
    const transactions = await getCashflowTransactions(req.query);
    if (transactions?.error) {
      return handleError({ res, err: transactions.error });
    }
    return handleResponse({
      res,
      msg: messages.CASHFLOW_TRANSACTIONS,
      data: transactions,
      result: transactions.data.length,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const rentTransaction = async (req, res) => {
  try {
    logger.info('Inside rent transaction API controller');
    const propertyId = req.params.id;
    const _user = req.user;
    const data = await getRentTransaction(_user._id, propertyId, req.query);
    if (data?.error) {
      return handleError({ res, err: data.error });
    }
    return handleResponse({
      res,
      msg: messages.RENT_TRANSACTION_LIST,
      data: { totalCount: data.totalCount, data: data.transactions },
      result: data.transactions.length,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const allRentTransactions = async (req, res) => {
  try {
    logger.info('Inside all transactions API controller');
    if (req.user?.userType !== 'admin') {
      return handleError({
        res,
        err: messages.UNAUTHORIZED_ACCESS,
        statusCode: 401,
      });
    }
    const transactions = await rentTransactionsList(req.query);
    if (transactions?.error) {
      return handleError({ res, err: transactions.error });
    }
    return handleResponse({
      res,
      msg: messages.ALL_RENT_TRANSACTIONS,
      data: { data: transactions.result, totalCount: transactions.totalCount },
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};
