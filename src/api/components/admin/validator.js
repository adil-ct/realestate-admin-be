import Joi from 'joi';
import { joiPassword } from 'joi-password';

export const loginRequest = async (data) => {
  const Schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const validate = Schema.validate(data);
  let error = false;
  let message = '';

  if (validate.error) {
    message = validate.error.details[0].message;
    message = message.replace(/"/g, '');
    error = true;
  }
  return { error, message };
};

export const loginVerifyRequest = async (data) => {
  const Schema = Joi.object({
    userId: Joi.string().required(),
    countryCode: Joi.string()
      .pattern(/^(\+?\d{1,3}|\d{1,4})$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid country code format',
        'any.required': 'Country code is required',
      }),
    mobileNumber: Joi.number()
      .integer()
      .max(10 ** 15 - 1)
      .required(),
    code: Joi.string().required(),
  });

  const validate = Schema.validate(data);
  let error = false;
  let message = '';

  if (validate.error) {
    message = validate.error.details[0].message;
    message = message.replace(/"/g, '');
    error = true;
  }

  return { error, message };
};

export const forgotPasswordRequest = async (data) => {
  const Schema = Joi.object({
    email: Joi.string().email().required(),
  });

  const validate = Schema.validate(data);
  let error = false;
  let message = '';

  if (validate.error) {
    message = validate.error.details[0].message;
    message = message.replace(/"/g, '');
    error = true;
  }

  return { error, message };
};

export const resetPasswordRequest = async (data) => {
  const Schema = Joi.object({
    password: joiPassword
      .string()
      .min(10)
      .minOfLowercase(1)
      .minOfUppercase(1)
      .minOfNumeric(1)
      .required(),
  });

  const validate = Schema.validate(data);
  let error = false;
  let message = '';

  if (validate.error) {
    message = validate.error.details[0].message;
    message = message.replace(/"/g, '');
    error = true;
  }

  return { error, message };
};

export const createAdminRequest = async (data) => {
  const Schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    countryCode: Joi.string().required(),
    mobileNumber: Joi.number()
      .integer()
      .max(10 ** 15 - 1)
      .required(),
  });

  const validate = Schema.validate(data);
  let error = false;
  let message = '';

  if (validate.error) {
    message = validate.error.details[0].message;
    message = message.replace(/"/g, '');
    error = true;
  }

  return { error, message };
};

export const updateAdminRequest = async (data) => {
  const Schema = Joi.object({
    name: Joi.string().optional(),
    status: Joi.string().valid('Active', 'Deactive').optional(),
    countryCode: Joi.string(),
    mobileNumber: Joi.number()
      .integer()
      .max(10 ** 15 - 1)
      .optional(),
    password: Joi.string(),
  });

  const validate = Schema.validate(data);
  let error = false;
  let message = '';

  if (validate.error) {
    message = validate.error.details[0].message;
    message = message.replace(/"/g, '');
    error = true;
  }

  return { error, message };
};

export const adminListValidator = (data) => {
  if (data.sortObj) data.sortObj = JSON.parse(data.sortObj);
  const mainSchema = {
    status: Joi.string().valid('Active', 'Deactive'),
    name: Joi.string(),
    startIndex: Joi.number().required().greater(0),
    itemsPerPage: Joi.number().required().greater(0),
    sortObj: Joi.object({
      name: Joi.number().valid(1, -1),
      email: Joi.number().valid(1, -1),
      mobileNumber: Joi.number().valid(1, -1),
    }),
  };
  const Schema = Joi.object(mainSchema).required();

  const validation = Schema.validate(data);
  let hasError = false;
  let error = '';

  if (validation.error) {
    error = validation.error.details[0].message;
    error = error.replace(/"/g, '');
    hasError = true;
  }

  return { error, hasError, sanitizedData: validation.value };
};
