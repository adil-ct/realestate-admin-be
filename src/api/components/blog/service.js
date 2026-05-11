import logger from '../../config/logger.js';
import blogAuthorModel from './blogAuthorModel.js';
import blogTypeModel from './blogTypeModel.js';
import blogModel from './model.js';
import { Types } from 'mongoose';
const ObjectId = Types.ObjectId;

// Marketing/invesotor services
export const blogsList = async (dataObj) => {
  try {
    logger.info('Inside blogsList service');
    const { page, limit, type, isPopular, isOnTop, search } = dataObj;
    const perPage = limit > 0 ? Number(limit) : 10;
    const startIndex = page > 0 ? Number(page) - 1 : 0;

    const filterObj = {};

    if (search) {
      filterObj.title = { $regex: search || '', $options: 'i' };
    }

    if (isPopular && ['true', 'false'].includes(isPopular)) {
      filterObj.isPopular = isPopular === 'true' ? true : false;
    }
    if (isOnTop && ['true', 'false'].includes(isOnTop)) {
      filterObj.isOnTop = isOnTop === 'true' ? true : false;
    }
    filterObj.isHidden = false;

    let blogs = await blogModel.aggregate([
      {
        $match: filterObj,
      },
      {
        $lookup: {
          from: 'blog-author',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails',
        },
      },
      {
        $unwind: {
          path: '$authorDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'blog-type',
          localField: 'blogType',
          foreignField: '_id',
          as: 'blogTypeDetails',
        },
      },
      {
        $match: {
          'blogTypeDetails.name': { $regex: type || '', $options: 'i' },
        },
      },
      {
        $project: {
          title: 1,
          content: 1,
          blogTypeDetails: { name: 1 },
          authorFirstName: '$authorDetails.firstName',
          authorLastName: '$authorDetails.lastName',
          authorProfilePic: '$authorDetails.profilePic',
          createdAt: 1,
          updatedAt: 1,
          image: 1,
          isHidden: 1,
          isOnTop: 1,
          isPopular: 1,
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
    ]);

    const totalCount = blogs.length;
    blogs = blogs.slice(startIndex * perPage, startIndex * perPage + perPage);
    return { totalCount, blogs };
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const getInvestorBlog = async (docId) => {
  try {
    logger.info('Inside blog getOne service');
    const blogType = await blogModel
      .findOne({ _id: ObjectId(docId), isHidden: false })
      .populate('author', 'firstName lastName profilePic')
      .populate('blogType', 'name');
    return blogType;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const investorBlogTypes = async () => {
  try {
    logger.info('Inside blog getOne service');
    const blogType = await blogTypeModel.find({ isHidden: false }).select('_id name');
    return blogType;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

// Admin services
export const blogsListAdmin = async (dataObj) => {
  try {
    logger.info('Inside blogsList service');
    const { page, limit, isPopular, isHidden, search } = dataObj;
    const perPage = limit > 0 ? Number(limit) : 10;
    const startIndex = page > 0 ? Number(page) - 1 : 0;

    const filterObj = {};

    if (isPopular && ['true', 'false'].includes(isPopular)) {
      filterObj.isPopular = isPopular === 'true' ? true : false;
    }

    if (isHidden && ['true', 'false'].includes(isHidden)) {
      filterObj.isHidden = isHidden === 'true' ? true : false;
    }

    let blogs = await blogModel.aggregate([
      {
        $match: filterObj,
      },
      {
        $lookup: {
          from: 'blog-author',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails',
        },
      },
      {
        $unwind: {
          path: '$authorDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'blog-type',
          localField: 'blogType',
          foreignField: '_id',
          as: 'blogTypeDetails',
        },
      },
      {
        $match: {
          $or: [
            {
              'authorDetails.firstName': {
                $regex: search || '',
                $options: 'i',
              },
            },
            {
              'authorDetails.lastName': {
                $regex: search || '',
                $options: 'i',
              },
            },
            {
              'blogTypeDetails.name': { $regex: search || '', $options: 'i' },
            },
            {
              title: { $regex: search || '', $options: 'i' },
            },
          ],
        },
      },
      {
        $project: {
          title: 1,
          content: 1,
          blogTypeDetails: {
            _id: 1,
            name: 1,
          },
          authorDetails: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            profilePic: 1,
          },
          image: 1,
          isHidden: 1,
          isOnTop: 1,
          isPopular: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
    ]);

    const totalCount = blogs.length;
    blogs = blogs.slice(startIndex * perPage, startIndex * perPage + perPage);
    return { totalCount, blogs };
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const createBlogAuthor = async (dataObj) => {
  try {
    logger.info('Inside createBlogAuthor service');
    const author = await blogAuthorModel.create({ ...dataObj });
    return author;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const authorList = async (dataObj = {}) => {
  try {
    logger.info('Inside get authorList service');
    const { page, limit, isHidden, search } = dataObj;
    const perPage = limit > 0 ? Number(limit) : 10;
    const startIndex = page > 0 ? Number(page) - 1 : 0;

    const filterObj = {};

    if (isHidden && ['true', 'false'].includes(isHidden)) {
      filterObj.isHidden = isHidden === 'true' ? true : false;
    }
    if (search) {
      filterObj.$or = [];
      filterObj.$or.push({ firstName: { $regex: search || '', $options: 'i' } }, { lastName: { $regex: search || '', $options: 'i' } });
    }

    const authors = await blogAuthorModel.aggregate([
      {
        $match: filterObj,
      },
      {
        $lookup: {
          from: 'blogs',
          localField: '_id',
          foreignField: 'author',
          as: 'blogs',
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          profilePic: 1,
          blogCount: { $size: '$blogs' },
          isHidden: 1,
          count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $skip: startIndex * perPage,
      },
      {
        $limit: perPage,
      },
    ]);

    const totalCount = await blogAuthorModel.countDocuments(filterObj);
    return { totalCount, authors };
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const updateOne = async (docId, updateKey, updateObj = {}) => {
  try {
    logger.info('Inside blog updateOne  service');
    let UpdatedDoc = {};

    if (updateKey === 'author') {
      UpdatedDoc = await blogAuthorModel.findByIdAndUpdate({ _id: ObjectId(docId) }, { ...updateObj }, { new: true });
    } else if (updateKey === 'blogType') {
      UpdatedDoc = await blogTypeModel.findByIdAndUpdate({ _id: ObjectId(docId) }, { ...updateObj }, { new: true });
    } else if (updateKey === 'blog') {
      updateObj.updatedBy = updateObj.user._id;
      UpdatedDoc = await blogModel.findByIdAndUpdate(
        { _id: ObjectId(docId) },
        {
          $set: { ...updateObj },
        },
        { new: true }
      );
    }
    return UpdatedDoc;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const createBlogType = async (typeName, isHidden) => {
  try {
    logger.info('Inside createBlogType service');
    typeName = typeName.toLowerCase();
    const blogType = await blogTypeModel.findOne({ name: typeName });
    if (blogType) return { hasError: true, error: 'Blog type already exists!' };
    const type = await blogTypeModel.create({ name: typeName, isHidden });
    return type;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const blogType = async (dataObj = {}) => {
  try {
    logger.info('Inside get blogType service');
    const { page, limit, isHidden, search } = dataObj;
    const perPage = limit > 0 ? Number(limit) : 10;
    const startIndex = page > 0 ? Number(page) - 1 : 0;

    const filterObj = {};
    if (isHidden && ['true', 'false'].includes(isHidden)) {
      filterObj.isHidden = isHidden === 'true' ? true : false;
    }
    if (search) {
      filterObj.name = { $regex: search || '', $options: 'i' };
    }

    const blogType = await blogTypeModel.aggregate([
      {
        $match: filterObj,
      },
      {
        $lookup: {
          from: 'blogs',
          localField: '_id',
          foreignField: 'blogType',
          as: 'blogs',
        },
      },
      {
        $project: {
          name: 1,
          blogCount: { $size: '$blogs' },
          isHidden: 1,
          count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          blogCount: -1,
        },
      },
      {
        $skip: startIndex * perPage,
      },
      {
        $limit: perPage,
      },
    ]);

    const totalCount = await blogTypeModel.countDocuments(filterObj);
    return { totalCount, blogType };
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const createOneBlog = async (dataObj) => {
  try {
    logger.info('Inside createOneBlog service');
    const blogType = await blogModel.create({
      updatedBy: dataObj.user._id,
      ...dataObj,
    });
    return blogType;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const getOne = async (docId, getKey) => {
  try {
    logger.info('Inside blog getOne  service');
    let doc;

    if (getKey === 'author') {
      doc = await blogAuthorModel.findOne({ _id: ObjectId(docId) });
    } else if (getKey === 'blogType') {
      doc = await blogTypeModel.findOne({ _id: ObjectId(docId) });
    } else if (getKey === 'blog') {
      doc = await blogModel
        .findOne({ _id: ObjectId(docId) })
        .populate('blogType')
        .populate('author')
        .populate('updatedBy', 'name');
    }
    return doc;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};

export const deleteOne = async (docId, deleteKey) => {
  try {
    logger.info('Inside blog deleteOne service');
    let doc;

    // ONLY DELETING BLOG DOCS AS OF NOW
    // if (deleteKey === 'author') {
    //   doc = await blogAuthorModel.findOneAndDelete({ _id: ObjectId(docId) });
    // }
    // if (deleteKey === 'blogType') {
    //   doc = await blogTypeModel.findOneAndDelete({ _id: ObjectId(docId) });
    // }
    if (deleteKey === 'blog') {
      const blogExist = await blogModel.findOne({ _id: ObjectId(docId) });
      if (!blogExist) return { hasError: true, error: "Blog doesn't exists!" };

      doc = await blogModel.findOneAndDelete({ _id: ObjectId(docId) });
    } else return { hasError: true, error: 'Invalid Key!' };
    return doc;
  } catch (err) {
    logger.error(err);
    return { error: err.message };
  }
};
