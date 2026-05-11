import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import db from '../../connections/dbMaster.js';

const { Schema } = mongoose;

mongoose.Promise = Promise;

const earlyAccessSchema = new Schema(
  {
    email: { type: String, required: true },
  },
  {
    collection: 'early-access',
    timestamps: true,
  }
);

export default db.model('early-access', earlyAccessSchema);
