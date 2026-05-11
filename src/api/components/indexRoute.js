import express from 'express';
import adminRouter from './admin/route.js';
import userRouter from './user/route.js';
import propertyManager from './propertyManager/route.js';
import propertyRouter from './property/route.js';
import cashflowRouter from './cashflow/route.js';
import dashboardRouter from './dashboard/route.js';

const router = express.Router();

router.use('/admin', adminRouter);
router.use('/user', userRouter);
router.use('/propertyManager', propertyManager);
router.use('/property', propertyRouter);
router.use('/cashflow', cashflowRouter);
router.use('/dashboard', dashboardRouter);
export default router;
