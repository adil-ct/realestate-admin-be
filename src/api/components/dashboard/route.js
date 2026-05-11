import express from 'express';
import { handleResponse } from '../../helpers/requestHandler.js';
import { authorize } from '../../middleware/authorize.js';
import {
  getDashboardStats,
  getNewlyListedProperties
} from './controller.js';

const router = express.Router();

router.get('/ping', (_req, res) => {
  return handleResponse({
    res,
  });
});

router.use(authorize);

router.get('/stats', getDashboardStats);
router.get('/list-property', getNewlyListedProperties);
export default router;
