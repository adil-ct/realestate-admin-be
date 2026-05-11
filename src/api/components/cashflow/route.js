import express from 'express';
import { handleResponse } from '../../helpers/requestHandler.js';
import { isSuperAdmin } from '../../middleware/isSuperAdmin.js';
import { authorize } from '../../middleware/authorize.js';
import {
  createRentalPeriod,
  getAllRentalPeriods,
  dismissRentalPeriod,
  updateRentalPeriod,
  depositRent,
  cashflowTransaction,
  rentTransaction,
  allRentTransactions,
} from './controller.js';

const router = express.Router();

router.get('/ping', (_req, res) => {
  return handleResponse({
    res,
  });
});

router.use(authorize);

router.get('/rental-period', getAllRentalPeriods);

router.post('/rental-period', isSuperAdmin, createRentalPeriod);

router.patch('/rental-period/:periodId', isSuperAdmin, updateRentalPeriod);
router.patch(
  '/rental-period/:periodId/dismiss',
  isSuperAdmin,
  dismissRentalPeriod
);
router.post('/deposit-rent', depositRent);
router.get('/cashflow-transaction', isSuperAdmin, cashflowTransaction);
router.get('/rent-transactions', allRentTransactions);
router.get('/rent-transaction/:id', rentTransaction);
export default router;
