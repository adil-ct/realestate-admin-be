import Joi from 'joi';

export const createPropertyManagerRequest = async (data) => {
  const Schema = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    companyName: Joi.string().required(),
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

export const blockRequest = async (data) => {
  const Schema = Joi.object({
    blockStatus: Joi.boolean().required(),
    blockReason: Joi.any().when('blockStatus', {
      is: true,
      then: Joi.string().required(),
      otherwise: Joi.optional(),
    }),
    id: Joi.string().required(),
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
