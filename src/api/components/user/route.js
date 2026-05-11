import express from 'express';
import {
  earlyAccessList,
  grantEarlyAccess,
  earlyAccessStatus,
  addToEarlyAccess,
  removeFromEarlyAccess,
  affiliateStatus,
  investorsForAccessList,
  affiliateUsers,
  getEarlyAccessUserList,
} from './controller.js';
import { authorize } from '../../middleware/authorize.js';
import { isSuperAdmin } from '../../middleware/isSuperAdmin.js';
const router = express.Router();

router.get('/early-access-list', earlyAccessList);
router.post('/grant-early-access', grantEarlyAccess);
router.put('/early-access-status/:status', earlyAccessStatus);
router.post('/add-to-early-access', addToEarlyAccess);
router.delete('/remove-from-early-access/:email', removeFromEarlyAccess);
router.put('/affiliate/:userId', authorize, isSuperAdmin, affiliateStatus);
router.get('/affiliate/users', authorize, affiliateUsers);
router.get('/investors/access-list/:propertyId', investorsForAccessList);

router.get('/granted-early-access-list',authorize, getEarlyAccessUserList)

export default router;
