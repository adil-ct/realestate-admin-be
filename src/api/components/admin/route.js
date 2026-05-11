import express from 'express';
import {
  login,
  loginVerify,
  forgotPassword,
  sendTempPassword,
  resetPassword,
  forgotPasswordList,
  getInvestorList,
  getPropertyList,
  blacklistInvestor,
  forceUpdatePassword,
  getAdminList,
  getAdminDetails,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  listAssets,
  getPortfolioSummary,
  fees,
  walletBalance,
  profile,
  getInvestorTokens,
  getManagedProperties,
  getInvestorDetails,
  getPlatformCredits,
  getPropertyInvestors,
  changeAdminStatus,
} from './controller.js';
import { authorize } from '../../middleware/authorize.js';
import { isSuperAdmin } from '../../middleware/isSuperAdmin.js';
import {
  createAuthor,
  createBlog,
  createType,
  deleteDoc,
  getAllBlogs,
  getAuthors,
  getBlogsListAdmin,
  getBlogType,
  getDoc,
  getInvestorBlogType,
  getOneBlog,
  updateDoc,
} from '../blog/controller.js';
const router = express.Router();

router.post('/login', login);
router.post('/loginVerify', loginVerify);
router.post('/forgotPassword', forgotPassword);
router.post('/sendTempPassword', sendTempPassword);
router.post('/forceUpdatePassword/:id', forceUpdatePassword);
router.get('/fees', fees);
router.get('/blogs', getAllBlogs);
router.get('/get-blog/:id', getOneBlog);
router.get('/get-blogType', getInvestorBlogType);

router.use(authorize);
router.post('/resetPassword', resetPassword);
router.get('/forgotPasswordList', forgotPasswordList);
router.get('/getInvestorList', getInvestorList);
router.get('/getInvestor/:userId', getInvestorDetails);
router.get('/getPropertyList/:id', getPropertyList);
router.put('/blacklist', isSuperAdmin, blacklistInvestor);
router.get('/list-assets', listAssets);
router.get('/portfolio-summary', getPortfolioSummary);
router.get('/balance', walletBalance);
router.get('/credits', getPlatformCredits);
router.get('/profile', profile);
router.get('/getAdminList', isSuperAdmin, getAdminList);
router.get('/admin-details/:id', isSuperAdmin, getAdminDetails);
router.post('/create-admin', isSuperAdmin, createAdmin);
router.put('/update-admin', updateAdmin);
router.delete('/delete-admin/:id', isSuperAdmin, deleteAdmin);
router.put('/change-status/:id', isSuperAdmin, changeAdminStatus);

router.get('/investor-tokens/:id', getInvestorTokens);
router.get('/propertyInvestors/:propertyId', getPropertyInvestors);
router.get('/managed-properties/:managerId', getManagedProperties);

router.post('/create-author', isSuperAdmin, createAuthor);
router.post('/create-type', isSuperAdmin, createType);
router.post('/create-blog', isSuperAdmin, createBlog);
router.get('/admin-blogList', isSuperAdmin, getBlogsListAdmin);
router.get('/blog-types', isSuperAdmin, getBlogType);
router.get('/authors', isSuperAdmin, getAuthors);
router.get('/get/:getKey/:id', isSuperAdmin, getDoc);
router.put('/update/:updateKey/:id', isSuperAdmin, updateDoc);
router.delete('/delete/:deleteKey/:id', isSuperAdmin, deleteDoc);

export default router;
