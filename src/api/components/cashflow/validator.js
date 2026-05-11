import Joi from 'joi';
import messages from '../../config/messages.js';

export const createRentalPeriodValidator = (data) => {
  const fileSchema = Joi.object({
    contentType: Joi.string().required(),
    key: Joi.string().required(),
    path: Joi.string().required(),
    url: Joi.string().required(),
    sizeInMegaByte: Joi.number().required(),
    createdAt: Joi.date(),
  });
  const optionalVal = Joi.object({
    value: Joi.number().optional(),
    isEnabled: Joi.bool().required(),
  });

  const mainSchema = {
    _property: Joi.string().required(),
    monthlyRentAmount: Joi.number().required(),
    rentalDocument: fileSchema.required(),
    rentalDuration: Joi.number().integer().required(),
    startDate: Joi.date().required(),
    currentMaintenanceReserveBalance: Joi.number(),
    currentVacancyReserveBalance: Joi.number(),
    maxMaintenanceFee: Joi.number().required(),
    maxVacancyFee: Joi.number().required(),
    propertyMgtFee: optionalVal,
  };

  const Schema = Joi.object(mainSchema);

  const validation = Schema.validate(data);
  let error = false;
  let message = '';

  if (validation.error) {
    message = validation.error.details[0].message;
    error = true;
  }

  if (!error && validation.value.startDate.getTime() % (24 * 60 * 60 * 1000) !== 0) {
    (message = messages.UTC_DATE_REQUIRED), (error = true);
  }
  if (!error && validation.value.startDate.getDate() !== 1) {
    (message = messages.INVALID_RENT_START), (error = true);
  }

  return { error, message, sanitizedData: validation.value };
};

export const updateRentalPeriodValidator = (data) => {
  const fileSchema = Joi.object({
    contentType: Joi.string().required(),
    key: Joi.string().required(),
    path: Joi.string().required(),
    url: Joi.string().required(),
    sizeInMegaByte: Joi.number().required(),
    createdAt: Joi.date(),
  });
  const optionalVal = Joi.object({
    value: Joi.number().optional(),
    isEnabled: Joi.bool().required(),
  });

  const mainSchema = {
    monthlyRentAmount: Joi.number(),
    rentalDocument: fileSchema,
    rentalDuration: Joi.number().integer(),
    startDate: Joi.date(),
    currentMaintenanceReserveBalance: Joi.number(),
    currentVacancyReserveBalance: Joi.number(),
    maxMaintenanceFee: Joi.number(),
    maxVacancyFee: Joi.number(),
    propertyMgtFee: optionalVal,
  };

  const Schema = Joi.object(mainSchema);

  const validation = Schema.validate(data);
  let error = false;
  let message = '';

  if (validation.error) {
    message = validation.error.details[0].message;
    error = true;
  }

  if (!error && validation.value.startDate.getTime() % (24 * 60 * 60 * 1000) !== 0) {
    (message = messages.UTC_DATE_REQUIRED), (error = true);
  }
  if (!error && validation.value.startDate.getDate() !== 1) {
    (message = messages.INVALID_RENT_START), (error = true);
  }

  return { error, message, sanitizedData: validation.value };
};

export const getAllRentalPeriodsValidator = (data) => {
  const mainSchema = {
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    propertyId: Joi.string(),
  };

  const Schema = Joi.object(mainSchema);

  const validation = Schema.validate(data);
  let error = false;
  let message = '';

  if (validation.error) {
    message = validation.error.details[0].message;
    error = true;
  }

  return { error, message, sanitizedData: validation.value };
};

export const dismissRentalPeriodValidator = (data) => {
  const mainSchema = {
    isDismissed: Joi.bool().required(),
    reason: Joi.string().when('isDismissed', {
      is: true,
      then: Joi.string().required(),
      otherwise: Joi.string().optional(),
    }),
  };

  const Schema = Joi.object(mainSchema);

  const validation = Schema.validate(data);
  let error = false;
  let message = '';

  if (validation.error) {
    message = validation.error.details[0].message;
    error = true;
  }

  return { error, message, sanitizedData: validation.value };
};

export const rentDepositValidator = async (data) => {
  const fileSchema = Joi.object({
    contentType: Joi.string().required(),
    key: Joi.string().required(),
    path: Joi.string().required(),
    url: Joi.string().required(),
    sizeInMegaByte: Joi.number().required(),
    createdAt: Joi.date(),
  });
  const Schema = Joi.object({
    principal: Joi.number().required(),
    interest: Joi.number().required(),
    taxes: Joi.number().required(),
    insurance: Joi.number().required(),
    HOAFee: Joi.number(),
    LLCAdminFee: Joi.number(),
    contingencyVars: Joi.array(),
    propertyId: Joi.string().required(),
    document: fileSchema.required(),
  });
  const validation = Schema.validate(data);
  let error = false;
  let message = '';

  if (validation.error) {
    message = validation.error.details[0].message;
    error = true;
  }

  return { error, message, sanitizedData: validation.value };
};
