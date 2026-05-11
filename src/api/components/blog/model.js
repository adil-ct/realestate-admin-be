import mongoose from 'mongoose';
import db from '../../connections/dbMaster.js';

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const fileType = {
  contentType: {
    type: String,
  },
  key: { type: String },
  path: { type: String },
  url: { type: String },
  sizeInMegaByte: Number,
};

const blogSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: {
      type: fileType,
      default: {},
    },
    blogType: [{ type: ObjectId, ref: 'blog-type' }],
    author: { type: ObjectId, ref: 'blog-author' },
    updatedBy: { type: ObjectId, ref: 'admin' },
    isHidden: { type: Boolean, default: true },
    isOnTop: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'blogs',
  }
);

export default db.model('blogs', blogSchema);
