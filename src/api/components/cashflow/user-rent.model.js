import mongoose from 'mongoose';
import db from '../../connections/dbMaster.js';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const RentSchema = new Schema(
  {
    _user: { type: ObjectId, ref: 'user', required: true },
    _property: { type: ObjectId, ref: 'property', required: true },
    _monthlyRent: { type: ObjectId, ref: 'monthlyRent', required: true },
    amount: { type: String, required: true }, // refers to number of tokens
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isUsdcTransferred: { type: Boolean, default: false },
    transactionId: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'userRent',
  }
);

export default db.model('userRent', RentSchema);
