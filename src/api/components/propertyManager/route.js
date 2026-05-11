import express from 'express';
import { createPropertyManager, getPropertyManagerList, getPropertyManager, block, deletePropertyManager } from './controller.js';
import { authorize } from '../../middleware/authorize.js';
import { isAdmin, isSuperAdmin } from '../../middleware/isSuperAdmin.js';
const router = express.Router();

router.use(authorize);
router.post('/createPropertyManager', isSuperAdmin, createPropertyManager);
router.get('/getPropertyManagerList', isAdmin, getPropertyManagerList);
router.post('/getPropertyManager', isAdmin, getPropertyManager);
router.post('/block', isSuperAdmin, block);
router.delete('/deletePropertyManager/:id', isSuperAdmin, deletePropertyManager);

export default router;
