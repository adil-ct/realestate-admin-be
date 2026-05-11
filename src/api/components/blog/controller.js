import logger from '../../config/logger.js';
import { handleError, handleResponse } from '../../helpers/requestHandler.js';
import {
  authorList,
  blogsList,
  blogsListAdmin,
  blogType,
  createBlogAuthor,
  createBlogType,
  createOneBlog,
  deleteOne,
  getInvestorBlog,
  getOne,
  investorBlogTypes,
  updateOne,
} from './service.js';

// MARKETING/INVESTOR API
export const getAllBlogs = async (req, res) => {
  try {
    logger.info('Inside getAllBlogs controller');
    const result = await blogsList(req.query);
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getInvestorBlogType = async (req, res) => {
  try {
    logger.info('Inside getInvestorBlogType controller');
    const result = await investorBlogTypes();
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getOneBlog = async (req, res) => {
  try {
    logger.info('Inside getOneBlog controller');
    const { id } = req.params;
    const result = await getInvestorBlog(id);
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

// ADMIN APIS
export const getBlogsListAdmin = async (req, res) => {
  try {
    logger.info('Inside getAllBlogs controller');
    const { page, limit, type, isPopular, author, isHidden, search } = req.query;
    const result = await blogsListAdmin({
      page,
      limit,
      type,
      isPopular,
      author,
      isHidden,
      search,
    });
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const createBlog = async (req, res) => {
  try {
    logger.info('Inside createBlog controller');
    const { user } = req;
    const { title, content, blogType, author, image, isPopular, isOnTop, isHidden } = req.body;
    const result = await createOneBlog({
      user,
      title,
      content,
      blogType,
      author,
      image,
      isPopular,
      isOnTop,
      isHidden,
    });
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const createAuthor = async (req, res) => {
  try {
    logger.info('Inside createAuthor controller');
    const { firstName, lastName, profilePic, isHidden } = req.body;
    const result = await createBlogAuthor({ firstName, lastName, profilePic, isHidden });
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getAuthors = async (req, res) => {
  try {
    logger.info('Inside getAuthors controller');
    const result = await authorList(req.query);
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const updateDoc = async (req, res) => {
  try {
    logger.info('Inside updateDoc controller');
    const { updateKey, id } = req.params;
    let result = [];

    if (updateKey === 'author') {
      const { firstName, lastName, profilePic, isHidden } = req.body;
      result = await updateOne(id, updateKey, {
        firstName,
        lastName,
        profilePic,
        isHidden,
      });
    } else if (updateKey === 'blogType') {
      const { name, isHidden } = req.body;
      result = await updateOne(id, updateKey, { name, isHidden });
    } else if (updateKey === 'blog') {
      const { user } = req;
      const { title, content, blogType, author, image, isHidden, isOnTop, isPopular } = req.body;
      result = await updateOne(id, updateKey, {
        user,
        title,
        content,
        blogType,
        author,
        image,
        isHidden,
        isOnTop,
        isPopular,
      });
    }

    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const createType = async (req, res) => {
  try {
    logger.info('Inside createType controller');
    const { name, isHidden } = req.body;
    const result = await createBlogType(name, isHidden);
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getBlogType = async (req, res) => {
  try {
    logger.info('Inside getBlogType controller');
    const result = await blogType(req.query);
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const getDoc = async (req, res) => {
  try {
    logger.info('Inside getDoc controller');
    const { getKey, id } = req.params;
    const result = await getOne(id, getKey);
    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};

export const deleteDoc = async (req, res) => {
  try {
    logger.info('Inside deleteDoc controller');
    const { deleteKey, id } = req.params;

    const result = await deleteOne(id, deleteKey);

    if (result?.hasError) {
      return handleError({
        res,
        err: result.error,
      });
    }
    return handleResponse({
      res,
      data: result,
    });
  } catch (err) {
    logger.error(err.message);
    return handleError({ res, err: err.message });
  }
};
