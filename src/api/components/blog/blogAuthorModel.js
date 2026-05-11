import mongoose from 'mongoose';
import db from '../../connections/dbMaster.js';

const { Schema } = mongoose;

const fileType = {
  contentType: {
    type: String,
  },
  key: { type: String },
  path: { type: String },
  url: { type: String },
  sizeInMegaByte: Number,
};

const blogAuthorSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePic: {
      type: fileType,
      default: {},
    },
    isHidden: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'blog-author',
  }
);

export default db.model('blog-author', blogAuthorSchema);
