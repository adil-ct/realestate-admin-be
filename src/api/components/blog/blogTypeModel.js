import mongoose from 'mongoose';
import db from '../../connections/dbMaster.js';

const { Schema } = mongoose;

const blogTypeSchema = new Schema(
  {
    name: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'blog-type',
  }
);

export default db.model('blog-type', blogTypeSchema);
