import client from '@sendgrid/client';
import logger from '../config/logger.js';
import config from '../config/config.js';
client.setApiKey(await config.sendGridApiKey);

export const sendgrid_getContactList = async () => {
  try {
    logger.info('Inside search contact sendgrid API request');
    const request = {
      url: `/v3/marketing/lists/${await config.investorContactListId}?contact_sample=true`,
      method: 'GET',
    };
    const [response, body] = await client.request(request);
    const data = response.body;
    const emailList = [];
    data.contact_sample.forEach((el) =>
      emailList.push({ email: el.email, id: el.id })
    );
    const result = {
      id: data.id,
      name: data.name,
      contact_count: data.contact_count,
      emails: emailList,
    };
    return { status: response.statusCode, response: result };
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const sendgrid_addOrUpdateContact = async (emails, lists) => {
  try {
    logger.info('Inside add or udpate contact sendgrid API request');
    const data = {
      list_ids: [lists], // lists => id
      contacts: [],
    };
    emails.forEach((el) => {
      data.contacts.push({ email: el });
    });
    const request = {
      url: `/v3/marketing/contacts`,
      method: 'PUT',
      body: data,
    };
    const [response, body] = await client.request(request);
    return { status: response.statusCode, response: response.body };
  } catch (err) {
    logger.error(err.message);
    return { error: err.message };
  }
};

export const sendgrid_removeContactFromList = async (listId, id) => {
  try {
    logger.info('Inside sremove contact from list sendgird API request');
    const queryParams = {
      contact_ids: id,
    };

    const request = {
      url: `/v3/marketing/lists/${listId}/contacts`,
      method: 'DELETE',
      qs: queryParams,
    };
    const [response, body] = await client.request(request);
    return { status: response.statusCode, response: response.body };
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};
