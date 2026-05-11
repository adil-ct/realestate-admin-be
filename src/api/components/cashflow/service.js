import logger from '../../config/logger.js';
import mongoose from 'mongoose';
import RentalPeriod from './rental-period.model.js';
import MonthlyRent from './monthly-rent.model.js';
import Property from '../property/model.js';
import moment from 'moment';
import messages from '../../config/messages.js';
import dateFormats from '../../helpers/date.js';
import UserRent from './user-rent.model.js';

const { ObjectId } = mongoose.Types;

export const createRentalPeriodService = async (data, __user) => {
  logger.info('Inside createRentalPeriod Service');

  const { _property, monthlyRentAmount, rentalDocument, rentalDuration, startDate, maxMaintenanceFee, maxVacancyFee, propertyMgtFee } = data;

  const existingPeriod = await RentalPeriod.findOne({
    _property: _property,
    endDate: { $gte: startDate },
  });
  if (existingPeriod) {
    return {
      error: true,
      message: messages.RENT_PERIOD_CONFLICT,
      statusCode: 400,
    };
  }

  const property = await Property.findById(_property);
  if (!property || property.status !== 'OnSale') {
    return {
      error: true,
      message: messages.PROPERTY_NOT_FOUND,
      statusCode: 400,
    };
  }

  // Update Property's fields.
  property.cashflow.monthlyRent = property.cashflow.monthlyRent ?? [];
  property.cashflow.monthlyRent.push({
    updatedAt: new Date(),
    value: monthlyRentAmount,
  });
  property.cashflow.rentalDocuments = property.cashflow.rentalDocuments ?? [];
  property.cashflow.rentalDocuments.push({
    updatedAt: new Date(),
    value: rentalDocument,
  });
  property.cashflow.maxMaintenanceFee = maxMaintenanceFee;
  property.cashflow.maxVacancyFee = maxVacancyFee;
  property.cashflow.propertyMgtFee = propertyMgtFee;
  property._updatedBy = __user._id;

  // Create new rental-period document.
  const rentalPeriod = new RentalPeriod({
    startDate,
    endDate: moment
      .utc(startDate)
      .startOf('month')
      .add(rentalDuration - 1, 'months')
      .endOf('month')
      .toDate(),
    rentalDuration,
    _property,
    _createdBy: __user._id,
    _updatedBy: __user._id,
  });
  await Promise.all([property.save(), rentalPeriod.save()]);

  return rentalPeriod;
};

export const updateRentalPeriodService = async (periodId, data = {}, __user) => {
  logger.info('Inside updateRentalPeriod Service');

  const { monthlyRentAmount, rentalDocument, rentalDuration, startDate, maxMaintenanceFee, maxVacancyFee, propertyMgtFee } = data;

  const existingPeriod = await RentalPeriod.findById(periodId);
  if (!existingPeriod) {
    return {
      error: true,
      message: messages.RENT_PERIOD_NOT_FOUND,
      statusCode: 422,
    };
  }

  if (startDate && moment.utc(existingPeriod.startDate).unix() < moment.utc().unix()) {
    return {
      error: true,
      message: messages.START_DATE_NOT_ALLOWED,
      statusCode: 400,
    };
  }
  if (Object.keys(data).length && moment.utc(existingPeriod.endDate).unix() < moment.utc().unix()) {
    return {
      error: true,
      message: messages.RENTAL_PERIOD_ENDED,
      statusCode: 400,
    };
  }

  const property = await Property.findById(existingPeriod._property);

  // Update Property's fields.
  if (monthlyRentAmount !== undefined) {
    property.cashflow.monthlyRent.push({
      updatedAt: new Date(),
      value: monthlyRentAmount,
    });
  }
  if (rentalDocument !== undefined) {
    property.cashflow.rentalDocuments.push({
      updatedAt: new Date(),
      value: rentalDocument,
    });
  }
  if (maxMaintenanceFee !== undefined) property.cashflow.maxMaintenanceFee = maxMaintenanceFee;
  if (maxVacancyFee !== undefined) property.cashflow.maxVacancyFee = maxVacancyFee;
  if (propertyMgtFee !== undefined) property.cashflow.propertyMgtFee = propertyMgtFee;
  property._updatedBy = __user._id;

  // Update existing rental-period document.
  if (startDate !== undefined) existingPeriod.startDate = startDate;
  if (rentalDuration !== undefined) {
    existingPeriod.rentalDuration = rentalDuration;
    existingPeriod.endDate = moment.utc(existingPeriod.startDate).add(rentalDuration, 'months').endOf('month').toDate();
  }

  await Promise.all([property.save(), existingPeriod.save()]);

  return existingPeriod;
};

export const getAllRentalPeriodsService = async (data, __user) => {
  logger.info('Inside Get All Rental Periods Service');

  let { page, limit, startDate, endDate, propertyId } = data;
  page = page ? page : 1;
  limit = limit ? limit : 20;
  let requestQuery = {
    $match: {},
  };
  if (startDate && endDate) {
    startDate = dateFormats.dateToUtcStartDate(startDate);
    endDate = dateFormats.dateToUtcEndDate(endDate);
    requestQuery.$match.startDate = { $gte: new Date(startDate) };
    requestQuery.$match.endDate = { $lte: new Date(endDate) };
  }
  if (propertyId) {
    requestQuery.$match._property = ObjectId(propertyId);
  }

  let list = await RentalPeriod.aggregate([
    requestQuery,
    {
      $lookup: {
        from: 'property',
        foreignField: '_id',
        localField: '_property',
        as: 'propertyData',
      },
    },
    {
      $unwind: {
        path: '$propertyData',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'user',
        foreignField: '_id',
        localField: 'propertyData.otherInfo._manager',
        as: 'managerData',
      },
    },
    {
      $unwind: {
        path: '$managerData',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'monthlyRent',
        foreignField: '_rentalPeriod',
        localField: '_id',
        as: 'monthlyRent',
      },
    },
    {
      $project: {
        propertyName: '$propertyData.otherInfo.title',
        propertyManager: '$managerData.firstName',
        _manager: '$managerData._id',
        monthlyRentAmount: {
          $last: '$propertyData.cashflow.monthlyRent.value',
        },
        startDate: 1,
        endDate: 1,
        rentalDuration: 1,
        isDismissed: 1,
        createdAt: 1,
        updatedAt: 1,
        _property: 1,
        maxMaintenanceFee: '$propertyData.cashflow.maxMaintenanceFee',
        maxVacancyFee: '$propertyData.cashflow.maxVacancyFee',
        propertyMgtFee: '$propertyData.cashflow.propertyMgtFee.value',
        rentalDocuments: {
          $last: '$propertyData.cashflow.rentalDocuments.value',
        },
        status: {
          $cond: {
            if: {
              $and: [{ $lte: ['$endDate', dateFormats.getCurrentDateTime()] }, { $eq: ['$isDismissed', false] }],
            },
            then: 'completed',
            else: {
              $cond: {
                if: { $eq: ['$isDismissed', true] },
                then: 'dismissed',
                else: 'pending',
              },
            },
          },
        },
        payoutDate: { $last: '$monthlyRent.endDate' },
      },
    },
  ]);

  list.forEach((el) => {
    if (el?.payoutDate) {
      if (el?.payoutDate < moment().utc()) {
        el.nextPayout = null;
      } else {
        el.nextPayout = moment(el?.payoutDate).add(1, 'day').startOf('day');
      }
    } else {
      el.nextPayout = moment(el?.startDate).add(1, 'month').startOf('month');
    }
  });
  const totalCount = list.length;
  list = list.sort((a, b) => b.createdAt - a.createdAt).slice((page - 1) * limit, (page - 1) * limit + limit);
  return { totalCount, data: list };
};

export const dismissRentalPeriodService = async (data, _id, __user) => {
  try {
    logger.info('Inside Dismiss Rental Period Service');
    if (!ObjectId.isValid(_id)) {
      return {
        error: true,
        message: messages.INVALID_MONGO_ID,
        statusCode: 400,
      };
    }

    const existingPeriod = await RentalPeriod.findById(ObjectId(_id));
    if (!existingPeriod) {
      return {
        error: true,
        message: messages.INVALID_MONGO_ID,
        statusCode: 400,
      };
    }

    // endDate can lie anywhere in the month as startDate's are not bound to be starting of month.
    if (!data.isDismissed) {
      existingPeriod.isDismissed = data.isDismissed;
      existingPeriod.endDate = moment.utc().endOf('month').toDate();
      delete existingPeriod?.reason;
    } else {
      existingPeriod.isDismissed = data.isDismissed;
      existingPeriod.endDate = moment.utc().endOf('month').startOf('day').toDate();
      existingPeriod.reason = data.reason;
    }
    existingPeriod._updatedBy = __user._id;
    await existingPeriod.save();
    return existingPeriod;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const getProperty = async (propertyId) => {
  try {
    logger.info('Inside get property service');
    const property = await Property.findOne({ _id: ObjectId(propertyId) });
    return property;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const updateMonthlyRentDoc = async (id, requestData) => {
  try {
    logger.info('Inside update monthly rent doc service');
    const update = await MonthlyRent.findOneAndUpdate({ _id: id }, requestData);
    if (update?.error) {
      return { error: update.error };
    }
    return update;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const updatePopertyDoc = async (id, requestData) => {
  try {
    logger.info('Inside update property doc service');
    const property = await Property.findByIdAndUpdate(id, requestData, {
      new: true,
    });
    if (property?.error) {
      return { error: property.error };
    }
    return property;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const getCashflowTransactions = async (filters) => {
  try {
    logger.info('Inside get cashflow transactions service');
    const { propertyId, status } = filters;
    let { page, limit, startDate, endDate } = filters;
    page = page ? Number(page) : 1;
    limit = limit ? Number(limit) : 10;

    const requestQuery = { $match: {} };
    if (startDate && endDate) {
      startDate = dateFormats.dateToUtcStartDate(startDate);
      endDate = dateFormats.dateToUtcEndDate(endDate);
      requestQuery.$match.startDate = { $gte: new Date(startDate) };
      requestQuery.$match.endDate = { $lte: new Date(endDate) };
    }
    if (propertyId) {
      requestQuery.$match._property = ObjectId(propertyId);
    }
    if (status) {
      requestQuery.$match.status = status;
    }
    let transactions = await MonthlyRent.aggregate([
      requestQuery,
      {
        $lookup: {
          from: 'property',
          foreignField: '_id',
          localField: '_property',
          as: 'propertyData',
        },
      },
      {
        $unwind: {
          path: '$propertyData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          propertyName: '$propertyData.otherInfo.title',
          _property: 1,
          _rentalPeriod: 1,
          _manager: 1,
          rentAmount: 1,
          managerFee: 1,
          maintenanceFee: 1,
          vacancyFee: 1,
          distributableAmount: 1,
          status: 1,
          isRentReceived: 1,
          startDate: 1,
          endDate: 1,
        },
      },
    ]);
    const totalCount = transactions.length;
    transactions = transactions.slice((page - 1) * limit, (page - 1) * limit + limit);
    return { totalCount, data: transactions };
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const getRentTransaction = async (userId, propertyId, filters) => {
  try {
    logger.info('Inside get rent transaction service');
    let { page, limit, search } = filters;
    page = page ? Number(page) : 1;
    limit = limit ? Number(limit) : 10;

    let transactions = await UserRent.aggregate([
      {
        $match: {
          _user: userId,
          _property: ObjectId(propertyId),
          status: 'completed',
        },
      },
      {
        $lookup: {
          from: 'monthlyRent',
          foreignField: '_id',
          localField: '_monthlyRent',
          as: 'monthlyRentData',
        },
      },
      {
        $unwind: {
          path: '$monthlyRentData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _monthlyRent: 1,
          _property: 1,
          numberOfTokens: '$amount',
          totalRent: '$monthlyRentData.rentAmount',
          amount: '$rentReceived',
          updatedAt: 1,
          maintenanceFee: '$monthlyRentData.maintenanceFee',
          vacancyFee: '$monthlyRentData.vacancyFee',
          toCoowners: '$monthlyRentData.distributableAmount',
          transactionHash: 1,
        },
      },
    ]);
    transactions.forEach((el) => {
      el.numberOfTokens = parseInt(el.numberOfTokens);
    });
    if (search) {
      search = search.replace(/[^a-zA-Z0-9. ]/gi, '');
      search = new RegExp(`${search}`, 'i');
      transactions = transactions.map((el) => {
        if (el.totalRent.toString().match(search)) return el;
        if (el.amount.toString().match(search)) return el;
        if (el.numberOfTokens.toString().match(search)) return el;
      });
    }
    const totalCount = transactions.length;
    transactions = transactions.slice((page - 1) * limit, (page - 1) * limit + limit);
    return { transactions, totalCount };
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const rentTransactionsList = async (filter) => {
  try {
    logger.info('Inside rent transactions list service');
    let page = filter?.page ? filter.page : 1;
    let limit = filter?.limit ? filter.limit : 20;
    let result = await UserRent.aggregate([
      {
        $match: {
          status: 'completed',
        },
      },
      {
        $lookup: {
          from: 'user',
          foreignField: '_id',
          localField: '_user',
          as: 'userDetails',
        },
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
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
        $lookup: {
          from: 'monthlyRent',
          foreignField: '_id',
          localField: '_monthlyRent',
          as: 'monthlyRentDetails',
        },
      },
      {
        $unwind: {
          path: '$monthlyRentDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          updatedAt: 1,
          name: '$userDetails.firstName',
          propertyName: '$propertyDetails.otherInfo.title',
          rent: '$rentReceived',
          totalRent: '$monthlyRentDetails.rentAmount',
          maintenanceFee: '$monthlyRentDetails.maintenanceFee',
          vacancyFee: '$maintenanceFee.vacancyFee',
          toCoowners: '$monthlyRentDetails.distributableAmount',
          id: 1,
          transactionHash: 1,
        },
      },
    ]);

    result.forEach((el) => {
      if (!el?.name) el.name = 'Admin';
    });

    if (filter?.search) {
      let { search } = filter;
      search = search.replace(/[^a-zA-Z0-9. ]/gi, '');
      search = new RegExp(`${search}`, 'i');
      result = result
        .map((el) => {
          if (el?.name?.match(search)) return el;
          if (el?.propertyName?.match(search)) return el;
        })
        .filter((item) => item);
    }
    const totalCount = result.length;
    result = result.slice((page - 1) * limit, (page - 1) * limit + limit);
    return { totalCount, result };
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};
