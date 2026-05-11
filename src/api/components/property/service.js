import axios from 'axios';
import crypto from 'crypto';
import AttomPropertyModel from './attomProperty.js';
import PropertyModel from './model.js';
import logger from '../../config/logger.js';
import config from '../../config/config.js';
import messages from '../../config/messages.js';
import _ from 'lodash';
import Paginator from '../../helpers/pagination.js';
import RegexQueryGenerator from '../../helpers/regex-query-generator.js';
import { exportData } from '../../helpers/exportData.js';
import { sendDatafileEmail } from '../../helpers/sendDataToEmail.js';
import dateFormats from '../../helpers/date.js';
import web3Helper from '../../helpers/web3.fireblocks.js';
import db from '../../connections/dbMaster.js';
import User from '../user/model.js';
import { getUserWhitelistedProof } from '../../helpers/whitelist-proof.js';
import { getBalance } from '../admin/service.js';
import mongoose from 'mongoose';
const Orders = db.collection('property-orders');
const TransferModel = db.collection('transfers');
const ObjectId = mongoose.Types.ObjectId;

export const getAttomProperty = async (attomId) => {
  try {
    const cachedDoc = await AttomPropertyModel.findOne({ attomId });
    if (cachedDoc) return { hasError: false, value: cachedDoc.data };

    logger.info(`Data not found for attomId: ${attomId} in DB, calling Attom's API.`);

    const attomConfig = await config.attom;
    console.log(attomConfig);

    const reqConfig = {
      headers: {
        apikey: attomConfig.apiKey.trim(),
        Accept: 'application/json',
      },
      timeout: 30000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    };

    const detailUrl = `${attomConfig.urls.getPropertyDetailsById}/property/detail?id=${attomId}`;
    logger.info(`Calling Attom API: ${detailUrl}`);

    const response = await axios.get(detailUrl, reqConfig);

    if (response.status !== 200) {
      logger.error(`Non-200 response: ${JSON.stringify(response.data)}`);
      return { hasError: true, error: messages.ATTOM_PROPERTY_FETCH_FAIL };
    }

    const { data: propertyResult } = response;

    if (propertyResult.status.code !== 0) return { hasError: true };

    const details = propertyResult.property[0];

    const avmUrl = `${attomConfig.urls.getAvmDetails}?address1=${encodeURIComponent(details.address.line1)}&address2=${encodeURIComponent(
      details.address.line2
    )}`;

    logger.info(`Calling Attom AVM API: ${avmUrl}`);

    try {
      const avmResponse = await axios.get(avmUrl, reqConfig);

      if (avmResponse.status === 200 && avmResponse.data?.status?.code === 0) {
        if (avmResponse.data?.property && avmResponse.data.property[0]?.avm) {
          details.avm = avmResponse.data.property[0].avm;
        } else {
          details.avm = null;
        }
      } else {
        logger.warn(`AVM API returned status ${avmResponse.status}`);
        details.avm = null;
      }
    } catch (avmError) {
      logger.warn(`Failed to fetch AVM data (non-critical): ${avmError.message}`);
      details.avm = null;
    }

    const attomProperty = new AttomPropertyModel({
      attomId: details.identifier.attomId,
      data: details,
    });

    await attomProperty.save();

    return { hasError: false, value: details };
  } catch (error) {
    logger.error(error);
    return {
      hasError: true,
      error: messages.ATTOM_PROPERTY_FETCH_FAIL,
    };
  }
};

export const createPropertyService = async (__user, data) => {
  try {
    const existingProperty = await PropertyModel.findOne({
      'attom.attomId': data.attomId,
    });
    if (existingProperty)
      return {
        hasError: true,
        error: messages.PROPERTY_EXISTS,
        statusCode: 400,
      };

    const { hasError, error, value: attomDetails } = await getAttomProperty(data.attomId);
    if (hasError) return { hasError, error };

    const extractedAttomData = {
      attomId: attomDetails?.identifier?.attomId,
      apn: attomDetails?.identifier?.apn,
      lotsize1: attomDetails?.lot?.lotsize1,
      lotsize2: attomDetails?.lot?.lotsize2,
      area: attomDetails?.building?.size?.universalsize,
      lotnum: attomDetails?.lot?.lotnum,
      blockNumber: attomDetails?.area?.blockNum,
      locationType: attomDetails?.area?.loctype,
      country: attomDetails?.address?.country,
      state: attomDetails?.address?.countrySubd,
      city: attomDetails?.address?.locality,
      areaTaxCode: attomDetails?.area?.taxcodearea,
      line1: attomDetails?.address?.line1,
      line2: attomDetails?.address?.line2,
      zipCode: attomDetails?.address?.postal1,
      latitude: attomDetails?.location?.latitude,
      longitude: attomDetails?.location?.longitude,
      propertyClass: attomDetails?.summary?.propclass,
      propertyType: attomDetails?.summary?.proptype,
      yearBuilt: attomDetails?.summary?.yearbuilt,
      bathTotal: attomDetails?.building?.rooms?.bathstotal,
      bedrooms: attomDetails?.building?.rooms?.beds,
      levels: attomDetails?.building?.summary?.levels,
      avmlastmonthvalue: attomDetails?.avm?.AVMChange?.avmlastmonthvalue,
      avmamountchange: attomDetails?.avm?.AVMChange?.avmamountchange,
      avmpercentchange: attomDetails?.avm?.AVMChange?.avmpercentchange,
    };

    const property = new PropertyModel({
      attom: extractedAttomData,
      _createdBy: __user._id,
      _updatedBy: __user._id,
    });

    await property.save();

    return { hasError: false, value: property };
  } catch (error) {
    logger.error(error);
    return {
      hasError: true,
    };
  }
};

export const updatePropertyService = async (__user, data, _property) => {
  try {
    logger.info('Inside Update Property Service.');
    const property = await PropertyModel.findById(_property);

    if (!property || property.status !== 'Draft')
      return {
        hasError: true,
        error: messages.PROPERTY_NOT_FOUND,
        statusCode: 400,
      };

    if (data?.cashflow) {
      data.cashflow.mortgage = ['principal', 'interest', 'taxes']
        .map((field) => data.cashflow?.[field] ?? property?.cashflow?.[field])
        .filter((val) => Boolean(val))
        .reduce((prev, current) => prev + current, 0);
    }
    if (data?.financials) {
      const propertyValue = [
        'assetValue',
        'closingCost',
        'maintenanceReserve',
        'vacancyReserve',
        'mogulBuyerFee',
        'contingencyVar1',
        'contingencyVar2',
        'contingencyVar3',
        'contingencyVar4',
      ]
        .map((field) =>
          field.startsWith('contingencyVar')
            ? (data.financials?.[field]?.applicable ? data.financials?.[field].value ?? 0 : 0) ??
              (property?.financials?.[field]?.applicable ? property?.financials?.[field].value ?? 0 : 0)
            : data.financials?.[field] ?? property?.financials?.[field]
        )
        .filter((val) => Boolean(val))
        .reduce((prev, current) => prev + current, 0);
      data.financials.propertyValues = [
        {
          updatedAt: new Date(),
          value: propertyValue,
        },
      ];
      data.financials.assetValues = [
        {
          updatedAt: new Date(),
          value: data.financials.assetValue,
        },
      ];
      data.crowdSale = data.crowdSale ?? {};
      const perTokenPrice =
        (propertyValue - data.financials?.currentDebt ?? property.financials?.currentDebt ?? 0) /
        (data.crowdSale?.numberOfTokens ?? property.crowdSale?.numberOfTokens ?? 1);
      data.crowdSale.tokensForSale = (data.financials?.mogulEquityToSell ?? property.financials?.mogulEquityToSell ?? 0) / perTokenPrice;

      if (!Number.isInteger(data.crowdSale.tokensForSale)) {
        return {
          hasError: true,
          statusCode: 400,
          error: "Occurence's Equity to Sell should be in multiples of " + perTokenPrice.toString() + ' (Per Token Price)',
        };
      }

      if (data?.financials?.leveragedCashflowMargin) {
        data.financials.leveragedCashflowMargin = data.financials.leveragedCashflowMargin.replace(/ /g, '').split(',');
      }

      if (data?.financials?.mercuryToken) {
        const cipher = crypto.createCipheriv('aes-256-cbc', (await config.crypto).key, (await config.crypto).encryptionIV);
        const encryptedToken = Buffer.from(cipher.update(data.financials.mercuryToken, 'utf8', 'hex') + cipher.final('hex')).toString('base64');
        data.financials.mercuryToken = encryptedToken;
      }
    }

    if (data?.cashflow?.monthlyRent !== undefined) {
      data.cashflow.monthlyRent = [
        {
          updatedAt: new Date(),
          value: data.cashflow.monthlyRent,
        },
      ];
    }

    if (data?.cashflow?.rentalDocument !== undefined) {
      data.cashflow.rentalDocuments = [
        {
          updatedAt: new Date(),
          value: data.cashflow.rentalDocument,
        },
      ];
      delete data.cashflow.rentalDocument;
    }

    const updateObjProps = (obj, newObj) => {
      for (const key in newObj) {
        // prettier-ignore
        if (newObj[key]?.constructor?.name === ({}).constructor.name) {
          obj[key] = obj[key] ?? {};
          updateObjProps(obj[key], newObj[key]);
          continue;
        }
        obj[key] = newObj[key];
      }
    };
    updateObjProps(property, data);

    property._updatedBy = __user._id;

    await property.save();

    return { hasError: false, value: property };
  } catch (error) {
    logger.error(error);
    return {
      hasError: true,
    };
  }
};

export const updateMintedPropertyService = async (__user, data, _property) => {
  try {
    const property = await PropertyModel.findById(_property);
    const owner = await User.findOne({ _id: property.otherInfo._owner });
    logger.info('Inside update minted properties service');
    if (data?.cashflow) {
      data.cashflow.mortgage = ['principal', 'interest', 'taxes']
        .map((field) => data.cashflow?.[field] ?? property?.cashflow?.[field])
        .filter((val) => Boolean(val))
        .reduce((prev, current) => prev + current, 0);
    }
    if (data?.financials) {
      if (data?.financials?.assetValue) {
        data.financials.currentEquity = property.financials?.currentEquity + (data.financials.assetValue - property?.financials?.assetValue);
      }
      const propertyValue = [
        'assetValue',
        'closingCost',
        'maintenanceReserve',
        'vacancyReserve',
        'mogulBuyerFee',
        'contingencyVar1',
        'contingencyVar2',
        'contingencyVar3',
        'contingencyVar4',
      ]
        .map((field) =>
          field.startsWith('contingencyVar')
            ? (data.financials?.[field]?.applicable ? data.financials?.[field].value ?? 0 : 0) ??
              (property?.financials?.[field]?.applicable ? property?.financials?.[field].value ?? 0 : 0)
            : data.financials?.[field] ?? property?.financials?.[field]
        )
        .filter((val) => Boolean(val))
        .reduce((prev, current) => prev + current, 0);
      property?.financials?.propertyValues?.push({
        updatedAt: new Date(),
        value: propertyValue,
      });
      property?.financials?.assetValues?.push({
        updatedAt: new Date(),
        value: property?.financials?.assetValue || 0,
      });
      data.financials.propertyValues = property?.financials?.propertyValues;
      data.financials.assetValues = property?.financials?.assetValues;
      data.crowdSale = data.crowdSale ?? {};
      const perTokenPrice =
        (propertyValue - (data.financials?.currentDebt ?? property.financials?.currentDebt ?? 0)) /
        (data.crowdSale?.numberOfTokens ?? property.crowdSale?.numberOfTokens ?? 1);
      data.crowdSale.tokensForSale = (data.financials?.mogulEquityToSell ?? property.financials?.mogulEquityToSell ?? 0) / perTokenPrice;

      if (!Number.isInteger(data.crowdSale.tokensForSale) && property.status !== 'OnSale') {
        return {
          hasError: true,
          statusCode: 400,
          error: "Occurence's Equity to Sell should be in multiples of " + perTokenPrice.toString() + ' (Per Token Price)',
        };
      }
      if (data.financials?.leveragedCashflowMargin) {
        data.financials.leveragedCashflowMargin = data.financials.leveragedCashflowMargin.replace(/ /g, '').split(',');
      }

      if (data.financials?.mercuryToken) {
        const cipher = crypto.createCipheriv('aes-256-cbc', (await config.crypto).key, (await config.crypto).encryptionIV);
        const encryptedToken = Buffer.from(cipher.update(data.financials.mercuryToken, 'utf8', 'hex') + cipher.final('hex')).toString('base64');
        data.financials.mercuryToken = encryptedToken;
      }

      /* Update Price of listed token */
      const order = await Orders.findOne({ tokenId: property.otherInfo.estateId });
      if (!order) return { error: 'Listing Id not found' };
      const updated = await updateListedProperty(owner, property?.blockchainAddress, order.listingId, perTokenPrice);
      if (updated?.error) return { error: updated.error };
    }

    if (data?.cashflow?.monthlyRent !== undefined) {
      data.cashflow.monthlyRent = [
        {
          updatedAt: new Date(),
          value: data.cashflow.monthlyRent,
        },
      ];
    }

    if (data?.cashflow?.rentalDocument !== undefined) {
      data.cashflow.rentalDocuments = property.cashflow.rentalDocuments ?? [];
      data.cashflow.rentalDocuments.push({
        updatedAt: new Date(),
        value: data.cashflow.rentalDocument,
      });
      delete data.cashflow.rentalDocument;
    }

    const updateObjProps = (obj, newObj) => {
      for (const key in newObj) {
        // prettier-ignore
        if (newObj[key]?.constructor?.name === ({}).constructor.name) {
          obj[key] = obj[key] ?? {};
          updateObjProps(obj[key], newObj[key]);
          continue;
        }
        obj[key] = newObj[key];
      }
    };
    updateObjProps(property, data);

    property._updatedBy = __user._id;

    await property.save();

    return { hasError: false, value: property };
  } catch (error) {
    logger.error(error);
    return {
      hasError: true,
    };
  }
};

export const getAllPropertiesService = async (data, __user) => {
  logger.info('Inside Get All Properties Service.');
  let { title, status, sendData, startIndex, itemsPerPage } = data;
  const skipCount = startIndex > 0 ? startIndex - 1 : 0;
  const perPage = itemsPerPage > 0 ? itemsPerPage : 20;
  const query = RegexQueryGenerator.Generate({
    searchFields: _.pickBy(
      {
        'otherInfo.title': title,
        status: { $eq: status },
      },
      _.identity
    ),
    excludeRegex: [],
  });
  let sortObj = {
    createdAt: -1,
  };
  if (status === 'Minted') {
    sortObj = { mitedAt: -1 };
  }
  if (status === 'OnSale') {
    sortObj = { 'crowdSale.startDate': -1 };
  }
  let result = await PropertyModel.find(query).sort(sortObj).lean();
  result.forEach((el) => {
    if (typeof el?.financials?.leveragedCashflowMargin === 'object') {
      el.financials.leveragedCashflowMargin = el.financials.leveragedCashflowMargin.join(', ');
    }
  });

  if (sendData && result.length > 0 && ['toCsv', 'toXls'].includes(sendData)) {
    const type = sendData;
    const resultData = result
      .map((item) => {
        const calculatedPrice = () => {
          const { currentDebt, propertyValues } = item.financials;
          const { numberOfTokens } = item.crowdSale;
          const price = ((propertyValues[propertyValues.length - 1]?.value - currentDebt) / numberOfTokens).toFixed(2);
          return `$${price}`;
        };

        const resultObj = {
          title: item.otherInfo.title,
          location: `${item.attom.city}, ${item.attom.state}`,
          tokensForSale: item.crowdSale?.tokensForSale,
          pricePerToken: calculatedPrice(),
          startDate: dateFormats.toLocalFormat(item.crowdSale?.startDate),
          status: item.crowdSale?.status || new Date(item.crowdSale?.startDate) < new Date() ? 'Sale Ongoing' : 'Upcoming',
        };
        return resultObj;
      })
      .filter((item) => item);

    const fileName = `All-Published-Properties-${__user.name || 'data'}-admin`;
    const createData = await exportData({ resultData, type, fileName });
    if (createData?.error) return { error: createData.error };
    await sendDatafileEmail(__user.email, type, fileName);
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
};

const updateListedProperty = async (owner, fundReceiverAddress, listingId, updatedPrice) => {
  try {
    logger.info('Inside update listed property service');
    const priceInWei = web3Helper.strToUSDCConvert(updatedPrice);
    const result = await web3Helper.ExecuteMethod('SEND', web3Helper.contracts.Marketplace, 'updateListedProperty', [
      listingId,
      priceInWei,
      owner.blockchainAddress,
      fundReceiverAddress,
    ]);
    if (result.error) {
      return { error: result.message };
    }
    return result;
    return { error: 'error from web3 heper' };
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const onSaleProperties = async (data) => {
  try {
    logger.info('Inside onSaleProperties service.');
    const { page, limit, search, crowdSaleStatus } = data;
    const startIndex = +page > 0 ? +page - 1 : 0;
    const perPage = +limit > 0 ? +limit : 20;

    const query = RegexQueryGenerator.Generate({
      searchFields: _.pickBy(
        {
          'otherInfo.title': search,
          status: 'OnSale',
        },
        _.identity
      ),
      excludeRegex: [],
    });

    let result = await PropertyModel.find(query)
      .sort({ 'crowdSale.startDate': 1 })
      .populate('otherInfo._manager', '_id personName firstName lastName')
      .populate('otherInfo._owner', '_id firstName lastName')
      .select('_id otherInfo blockchainAddress crowdSale')
      .lean();

    if (crowdSaleStatus) {
      result = result.filter((it) => it.crowdSale.status === crowdSaleStatus);
    }
    result = result
      .map(async (property) => {
        // const propertyWalletBalance = await getBalance(property?.blockchainAddress);
        const propertyOrders = await Orders.findOne({ _property: property._id });
        const resultObj = {
          _id: property._id,
          title: property.otherInfo.title,
          tokenSold: propertyOrders.soldTokens,
          tokenLeft: propertyOrders.tokens,
          tokensOnHold: propertyOrders.tokensOnHold,
          walletBalance: 0, // need to update in future
          walletAddress: property?.blockchainAddress,
          owner: `${property.otherInfo._owner?.firstName} ${property.otherInfo._owner?.lastName}`,
          ownerId: property.otherInfo._owner?._id,
          propertyManagerId: property.otherInfo?._manager?._id,
          propertyManager:
            `${property.otherInfo._manager?.firstName} ${property.otherInfo._manager?.lastName}` || property.otherInfo._manager?.personName,
          status: property?.crowdSale?.status ? property.crowdSale.status : 'Sale Ongoing',
        };
        return resultObj;
      })
      .filter((property) => property);

    let resultData = await Promise.all(result);

    const totalCount = resultData.length;
    resultData = resultData.slice(startIndex * perPage, startIndex * perPage + perPage);
    return { totalCount, resultData };
  } catch (error) {
    logger.error(error);
    return {
      hasError: true,
    };
  }
};

export const onSaleProperty = async (data) => {
  try {
    logger.info('Inside onSaleProperty service.');
    const { page, limit, propertyId } = data;
    const startIndex = +page > 0 ? +page - 1 : 0;
    const perPage = +limit > 0 ? +limit : 20;

    let transfers = await TransferModel.find({ propertyId: ObjectId(propertyId), transactionType: 'voluntary' }).toArray();
    const property = await PropertyModel.findOne({ _id: ObjectId(propertyId), status: 'OnSale' });
    const propertyOrders = await Orders.findOne({ _property: ObjectId(propertyId) });
    const propertyWalletBalance = await getBalance(property?.blockchainAddress);

    const propertyData = {
      _id: property?._id,
      tokenSold: propertyOrders.soldTokens,
      tokenLeft: propertyOrders.tokens,
      walletBalance: propertyWalletBalance,
    };

    const totalCount = transfers.length;
    transfers = transfers.sort((a, b) => b.createdAt - a.createdAt).slice(startIndex * perPage, startIndex * perPage + perPage);

    return { totalCount, propertyData, transfers };
  } catch (error) {
    logger.error(error);
    return { hasError: true };
  }
};

export const getPropertyList = async (status) => {
  try {
    logger.info('Inside get property list service');
    const list = await PropertyModel.find({ 'crowdSale.status': status }, { _id: 1, title: '$otherInfo.title' });
    if (list?.error) return { error: list.error };
    return list;
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};
