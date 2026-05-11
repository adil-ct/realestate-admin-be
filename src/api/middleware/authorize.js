import axios from 'axios';
import mongoose from 'mongoose';
import config from '../config/config.js';
import logger from '../config/logger.js';
import messages from '../config/messages.js';
import { handleError } from '../helpers/requestHandler.js';
const { ObjectId } = mongoose.Types;

export const authorize = async (req, res, next) => {
  try {
    // Skip authorization for public routes
    const publicRoutes = ['/login', '/loginVerify', '/forgotPassword', '/sendTempPassword', '/fees', '/blogs', '/get-blogType'];
    const isPublicRoute = publicRoutes.some((route) => req.path.includes(route));
    const isPublicBlogRoute = req.path.match(/\/get-blog\/[^/]+$/);
    const isForceUpdatePassword = req.path.match(/\/forceUpdatePassword\/[^/]+$/);

    if (isPublicRoute || isPublicBlogRoute || isForceUpdatePassword) {
      return next();
    }

    if (!req.headers.authorization) {
      return handleError({
        res,
        statusCode: 401,
        err: messages.INVALID_TOKEN,
      });
    }
    const result = await axios
      .get(`${await config.authBaseUrl}/verify`, {
        headers: {
          authorization: `${req.headers.authorization}`,
        },
      })
      .catch((error) => {
        logger.error(error);
        return { error: error };
      });

    if (result.error) {
      return handleError({
        res,
        statusCode: 401,
        err: result?.error ?? messages.UNAUTHORIZED_ACCESS,
      });
    }
    const user = result.data.data;
    user._id = ObjectId(user._id);
    req.user = user;
    return next();
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};
