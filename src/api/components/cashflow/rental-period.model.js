import mongoose from 'mongoose';
import db from '../../connections/dbMaster.js';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const RentalPeriodSchema = new Schema(
  {
    startDate: { type: Date },
    endDate: { type: Date },
    rentalDuration: { type: Number },
    reason: { type: String },
    isDismissed: { type: Boolean, default: false },
    _property: { type: ObjectId, ref: 'property' },

    _createdBy: { type: ObjectId, ref: 'admin', select: false },
    _updatedBy: { type: ObjectId, ref: 'admin', select: false },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'rentalPeriod',
  }
);

export default db.model('rentalPeriod', RentalPeriodSchema);
