import moment from 'moment';

const dateFormats = {
  getCurrentDateTime: () => moment().utc().toDate(),
  dateToUtc: (date) => moment(date).utc().toDate(),
  toLocalFormat: (date) => moment(date).format('ddd MMM DD YYYY hh:mm A'),
  tempPasswordExpiryTime: () => moment().add(48, 'hours').utc().toDate(),
  earlyAccessResend: (date) => moment(date).add(14, 'days').utc().toDate(),
  dateToUtcStartDate: (date) =>
    moment(new Date(date)).utc().startOf('day').toISOString(),
  dateToUtcEndDate: (date) =>
    moment(new Date(date)).utc().endOf('day').toISOString(),
};

export default dateFormats;
