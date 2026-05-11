import logger from '../config/logger.js';
import VenlyHelperClass from './venly.helper.js';
const VenlyHelper = new VenlyHelperClass();

export const getWalletBalance = async (walletAddress) => {
  try {
    logger.info('Inside get wallet balance service');
    let erc20 = 0;
    let balance = await VenlyHelper.getWalletBalance(walletAddress);
    if (balance?.value.length === 0) erc20 = 0;
    else {
      balance.value.forEach((el) => {
        if (el.symbol === 'USDC') {
          erc20 += el.balance;
        }
      });
    }
    return erc20;
  } catch (err) {
    logger.error(err?.message);
    return { error: err?.message };
  }
};
