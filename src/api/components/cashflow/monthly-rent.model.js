import mongoose from 'mongoose';
import db from '../../connections/dbMaster.js';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const fileType = {
  contentType: {
    type: String,
  },
  key: { type: String },
  path: { type: String },
  url: { type: String },
  sizeInMegaByte: Number,
  createdAt: { type: Date, default: () => new Date() },
};

const MonthlyRentSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    _property: { type: ObjectId, ref: 'property', required: true },
    _rentalPeriod: { type: ObjectId, ref: 'rentalPeriod', required: true },
    _manager: { type: ObjectId, ref: 'user', required: true },
    rentalDocument: { type: fileType, required: true },
    document: { type: fileType, required: true },

    rentAmount: { type: Number, required: true },
    managerFee: { type: Number, default: 0 },
    maintenanceFee: { type: Number, default: 0 },
    vacancyFee: { type: Number, default: 0 },
    distributableAmount: { type: Number, default: 0 },
    principal: { type: Number, default: 0 },
    interest: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    HOAFee: { type: Number, default: 0 },
    LLCAdministrationFee: { type: Number, default: 0 },
    contingencyVars: { type: Array },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    isRentReceived: { type: Boolean, default: false },

    _createdBy: { type: ObjectId, ref: 'admin', select: false },
    _updatedBy: { type: ObjectId, ref: 'admin', select: false },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'monthlyRent',
  }
);

export default db.model('monthlyRent', MonthlyRentSchema);
