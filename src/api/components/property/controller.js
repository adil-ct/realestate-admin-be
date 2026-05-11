import logger from '../../config/logger.js';
import { handleError, handleResponse } from '../../helpers/requestHandler.js';
import messages from '../../config/messages.js';
import { S3ExtractMeta } from '../../helpers/s3.js';
import PropertyModel from './model.js';
import {
  getAttomProperty,
  createPropertyService,
  updatePropertyService,
  getAllPropertiesService,
  updateMintedPropertyService,
  onSaleProperties,
  onSaleProperty,
  getPropertyList,
} from './service.js';
import {
  attomIdValidator,
  createPropertyValidator,
  updatePropertyValidator,
  getAllPropertiesValidator,
  checkPropertyReadyToMint,
  updateMintedPropertyValidator,
} from './validator.js';
import { auth_sendEmail } from '../../helpers/auth.js';
import VenlyHelperClass from '../../helpers/venly.helper.js';
import web3Helper from '../../helpers/web3.fireblocks.js';
import UserModel from '../user/model.js';
import CircleHelper from '../../helpers/circle.helper.js';
import constants from '../../config/constants.js';
import config from '../../config/config.js';
import db from '../../connections/dbMaster.js';
import { createFireblocksWallet, createVault } from '../../helpers/fireblocks.js';
const propertyBalanceModel = db.collection('property-balance');
const VenlyHelper = new VenlyHelperClass();

export const createProperty = async (req, res) => {
  try {
    logger.info('Inside Create Property controller');

    const validation = createPropertyValidator(req.body);
    // If error return.
    if (validation.hasError) {
      return handleError({ res, err: validation.error, statusCode: 422 });
    }

    const { sanitizedData } = validation;

    const { user: __user } = req;

    const result = await createPropertyService(__user, sanitizedData);

    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
        statusCode: result.statusCode,
      });
    }

    return handleResponse({
      res,
      msg: messages.CREATE_PROPERTY_SUCCESS,
      data: result.value,
      statusCode: 201,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const uploadFiles = async (req, res) => {
  try {
    logger.info('Inside Upload Files controller');

    const result = await S3ExtractMeta(req.files);
    if (result.mainDoc?.length) result.mainDoc = result.mainDoc[0];
    if (result.rentalDocument?.length) result.rentalDocument = result.rentalDocument[0];
    if (result.video?.length) result.video = result.video[0];
    if (result.profilePic?.length) result.profilePic = result.profilePic[0];

    return handleResponse({
      res,
      data: result,
      msg: messages.FILE_UPLOAD_SUCCESS,
      statusCode: 200,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getDetailsFromAttom = async (req, res) => {
  try {
    logger.info('Inside Get Property Details from Attom controller');

    const { attomId } = req.params;

    const validation = attomIdValidator(attomId);
    // If error return.
    if (validation.hasError) {
      return handleError({ res, err: validation.error, statusCode: 422 });
    }

    const { sanitizedData } = validation;

    const result = await getAttomProperty(sanitizedData);

    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
        statusCode: result.statusCode,
      });
    }

    return handleResponse({
      res,
      data: result.value,
      msg: messages.ATTOM_PROPERTY_FETCH_SUCCESS,
      statusCode: 200,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const updateProperty = async (req, res) => {
  try {
    logger.info('Inside Update Property controller');

    const validation = updatePropertyValidator(req.body);
    // If error return.
    if (validation.hasError) {
      return handleError({ res, err: validation.error, statusCode: 422 });
    }

    const { sanitizedData } = validation;

    const { user: __user } = req;
    const { propertyId: _property } = req.params;

    const result = await updatePropertyService(__user, sanitizedData, _property);

    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
        statusCode: result.statusCode,
      });
    }

    return handleResponse({
      res,
      msg: messages.UPDATE_PROPERTY_SUCCESS,
      data: result.value,
      statusCode: 200,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const updateMintedProperty = async (req, res) => {
  try {
    logger.info('Inside update property after minting controller');

    const validation = updateMintedPropertyValidator(req.body);
    if (validation.hasError) {
      return handleError({ res, err: validation.error, statusCode: 422 });
    }

    const { sanitizedData } = validation;

    const { user: __user } = req;
    const { propertyId: propertyId } = req.params;
    const result = await updateMintedPropertyService(__user, sanitizedData, propertyId);

    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
        statusCode: result.statusCode,
      });
    }

    return handleResponse({
      res,
      msg: messages.UPDATE_PROPERTY_SUCCESS,
      data: result.value,
      statusCode: 200,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    logger.info('Inside Delete Property controller.');

    const { propertyId: _property } = req.params;
    const property = await PropertyModel.findById(_property, '+status');
    if (!property) {
      return handleError({
        res,
        err: messages.PROPERTY_NOT_FOUND,
        statusCode: 400,
      });
    }

    if (property.status !== 'Draft') {
      return handleError({
        res,
        err: messages.CANNOT_DELETE_PROPERTY,
        statusCode: 400,
      });
    }
    const result = await PropertyModel.findByIdAndDelete(_property);

    return handleResponse({
      res,
      msg: messages.DELETE_PROPERTY_SUCCESS,
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

export const getPropertyById = async (req, res) => {
  try {
    logger.info('Inside Get Property By Id controller.');

    const { propertyId: _property } = req.params;

    const property = await PropertyModel.findById(_property);

    if (!property) {
      return handleError({
        res,
        err: messages.PROPERTY_NOT_FOUND,
        statusCode: 400,
      });
    }

    if (property?.financials?.leveragedCashflowMargin) {
      property.financials.leveragedCashflowMargin = property.financials.leveragedCashflowMargin.join(', ');
    }

    return handleResponse({
      res,
      msg: messages.GET_PROPERTY_SUCCESS,
      data: property,
    });
  } catch (error) {
    logger.error(error);
    return handleError({
      res,
      err: error?.message,
    });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    logger.info('Inside Get-all Properties controller.');

    const { user: __user } = req;
    const validation = getAllPropertiesValidator(req.query);

    // If error return.
    if (validation.hasError) {
      return handleError({ res, err: validation.error, statusCode: 422 });
    }

    const { sanitizedData } = validation;

    const result = await getAllPropertiesService(sanitizedData, __user);

    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
        statusCode: result.statusCode,
      });
    }

    return handleResponse({
      res,
      msg: messages.GET_ALL_PROPERTIES_SUCCESS,
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

export const mintPropertyTokens = async (req, res) => {
  try {
    logger.info('Inside Mint Property Tokens controller');

    const { propertyId: _property } = req.params;

    const property = await PropertyModel.findById(_property);

    if (!property) {
      return handleError({
        res,
        err: messages.PROPERTY_NOT_FOUND,
        statusCode: 400,
      });
    }

    const validation = checkPropertyReadyToMint(JSON.parse(JSON.stringify(property)));

    // If error return.
    if (validation.hasError) {
      return handleError({ res, err: validation.error, statusCode: 422 });
    }

    const perTokenPrice =
      (property.financials.propertyValues[property.financials.propertyValues.length - 1].value - property.financials.currentDebt) /
      property.crowdSale.numberOfTokens;

    if (!Number.isInteger(property.financials.sellerEquity / perTokenPrice)) {
      return handleError({
        res,
        err: "Seller's Equity should be in multiples of " + perTokenPrice.toString() + ' (Per Token Price)',
        statusCode: 400,
      });
    }

    if (!Number.isInteger(property.financials.mogulEquityToBuy / perTokenPrice)) {
      return handleError({
        res,
        err: "Occurence's Equity to Buy should be in multiples of " + perTokenPrice.toString() + ' (Per Token Price)',
        statusCode: 400,
      });
    }

    property.crowdSale.tokensForSale = property.financials.mogulEquityToSell / perTokenPrice;

    if (!Number.isInteger(property.crowdSale.tokensForSale)) {
      return handleError({
        res,
        err: "Occurence's Equity to Sell should be in multiples of " + perTokenPrice.toString() + ' (Per Token Price)',
        statusCode: 400,
      });
    }

    console.log({
      sellerEq: property.financials.sellerEquity + property.financials.mogulEquityToBuy + property.financials.mogulEquityToSell,
      buyerEq: property.financials.propertyValues[property.financials.propertyValues.length - 1].value - property.financials.currentDebt,
    });
    console.log({
      perTokenPrice,
      sellerEq: property.financials.sellerEquity,
      EqToBuy: property.financials.mogulEquityToBuy,
      EqToSell: property.financials.mogulEquityToSell,
      propValue: property.financials.propertyValues[property.financials.propertyValues.length - 1].value,
      currentDebt: property.financials.currentDebt,
    });
    if (
      property.financials.sellerEquity + property.financials.mogulEquityToBuy + property.financials.mogulEquityToSell !==
      property.financials.propertyValues[property.financials.propertyValues.length - 1].value - property.financials.currentDebt
    ) {
      return handleError({
        res,
        err: "Seller's Equity, Occurence's Equity to Buy and Sell should sum up to (Property Value - Current debt)",
        statusCode: 400,
      });
    }

    //const { sanitizedData } = validation;
    const { user: __user } = req;
    const propertyOwner = await UserModel.findById(property.otherInfo._owner);
    if (!propertyOwner) {
      throw new Error('Invalid Property Owner');
    }
    await web3Helper.initializationPromise;
    const tokenURI = {
      'Property Name': property.otherInfo.title,
      'LLC Company Agreement': property.documents.main.url,
      'Property Details': `${await config.baseUrl}/properties/${property.otherInfo.title.trim().replace(/\s+/g, '-').toLowerCase()}`,
    };

    const result = await web3Helper.ExecuteMethod('SEND', web3Helper.contracts.Token, 'mintNewPropertyToken', [
      JSON.stringify(tokenURI),
      property.crowdSale.numberOfTokens,
      propertyOwner.blockchainAddress,
    ]);
    if (result.error) {
      return handleError({
        res,
        err: result.message,
        statusCode: 500,
      });
    }

    let txReceipt;
    // Set interval to regularly check if we can get a receipt
    await new Promise((resolve, reject) => {
      let pollCount = 0;
      const poller = () => {
        pollCount++;
        web3Helper.web3.eth.getTransactionReceipt(result.transactionHash, (_err, receipt) => {
          if (receipt) {
            txReceipt = receipt;
            resolve();
          } else {
            if (pollCount >= 20) return reject('Something went wrong.');
            setTimeout(poller, 3 * 1000);
          }
        });
      };
      poller();
    });

    const vaultName = `prop-${property._id.toString()}`;

    const fireBlockVault = await createVault(vaultName);
    if (fireBlockVault?.error) {
    }
    const fireBlockWallet = await createFireblocksWallet(fireBlockVault.id);
    if (fireBlockWallet?.error) {
    }
    property.otherInfo.estateId = web3Helper.web3.utils.toBN(txReceipt.logs[1].data.slice(0, 66)).toString();
    property.status = 'Minted';
    property.mintedAt = new Date();
    const fireblocks = {
      vaultId: fireBlockVault.id,
    };
    property.fireblocks = fireblocks;
    property.blockchainAddress = fireBlockWallet.address;
    await property.save();
    await propertyBalanceModel
      .insertOne({
        _user: propertyOwner._id,
        _property: property._id,
        tokens: property.crowdSale.numberOfTokens,
        avgPrice: perTokenPrice.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(logger.error);
    // await auth_sendEmail({
    //   email: propertyOwner._id,
    //   type: constants.templateNames.TOKENS_MINTED,
    //   request: {
    //     property_name: property.otherInfo.title,
    //     numberOfTokens: property.crowdSale.numberOfTokens,
    //     pricePerToken: perTokenPrice,
    //     startDate: new Date(property.crowdSale.startDate).toLocaleString(),
    //   },
    // });
    return handleResponse({
      res,
      msg: messages.MINT_PROPERTY_SUCCESS,
      data: property,
      statusCode: 200,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getOnSaleProperties = async (req, res) => {
  try {
    logger.info('Inside getOnSaleProperties controller.');
    const { page, limit, search, crowdSaleStatus } = req.query;
    const result = await onSaleProperties({ page, limit, search, crowdSaleStatus });
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
        statusCode: result.statusCode,
      });
    }

    return handleResponse({
      res,
      msg: messages.GET_ALL_PROPERTIES_SUCCESS,
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

export const getOnSalePropertyFinancial = async (req, res) => {
  try {
    logger.info('Inside getOnSalePropertyFinancial controller.');
    const { propertyId } = req.params;
    const { page, limit } = req.query;
    const result = await onSaleProperty({ propertyId, page, limit });
    if (result?.hasError) {
      return handleError({
        res,
        err: messages.PROPERTY_NOT_FOUND,
        statusCode: 404,
      });
    }

    return handleResponse({
      res,
      msg: messages.GET_PROPERTY_SUCCESS,
      data: result,
    });
  } catch (error) {
    logger.error(error);
    return handleError({ res, err: error?.message });
  }
};

export const propertyListForProposals = async (req, res) => {
  try {
    logger.info('Inside property list API controller');
    const { status } = req.query;
    const list = await getPropertyList(status);
    if (list?.error) {
      return handleError({ res, err: list.error });
    }
    return handleResponse({ res, msg: messages.PROPERTY_LIST_FOR_PROPOSALS, data: list });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};
