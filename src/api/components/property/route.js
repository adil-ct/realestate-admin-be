import express from 'express';
import { handleResponse } from '../../helpers/requestHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { isSuperAdmin } from '../../middleware/isSuperAdmin.js';
import { UploadS3 } from '../../helpers/s3.js';
import {
  createProperty,
  updateProperty,
  uploadFiles,
  deleteProperty,
  getPropertyById,
  getAllProperties,
  mintPropertyTokens,
  updateMintedProperty,
  getOnSaleProperties,
  getOnSalePropertyFinancial,
  propertyListForProposals,
} from './controller.js';
import config from '../../config/config.js';

const router = express.Router();
const uploadS3 = UploadS3();

router.get('/ping', (_req, res) => {
  return handleResponse({
    res,
  });
});

router.use(authorize);

router.get('/', getAllProperties);
router.get('/onSaleProperties', getOnSaleProperties);
router.get('/onSaleProperties/:propertyId', getOnSalePropertyFinancial);
router.get('/:propertyId', getPropertyById);
router.get('/property-list/proposals', propertyListForProposals);
router.post('/', isSuperAdmin, createProperty);
router.post(
  '/file.upload',
  // isSuperAdmin,
  uploadS3.fields([
    { name: 'mainDoc', maxCount: 1 },
    { name: 'rentalDocument', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'documents' },
    { name: 'images' },
    { name: 'profilePic', maxCount: 1 },
  ]),
  uploadFiles
);
router.post('/:propertyId/mint', isSuperAdmin, mintPropertyTokens);

router.patch('/:propertyId', isSuperAdmin, updateProperty);

router.patch('/:propertyId/updateMintedProperty', isSuperAdmin, updateMintedProperty);

router.delete('/:propertyId', isSuperAdmin, deleteProperty);

export default router;
