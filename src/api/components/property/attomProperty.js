import mongoose from 'mongoose';
import db from '../../connections/dbMaster.js';

const { Schema } = mongoose;

const attomPropertySchema = new Schema(
  {
    attomId: { type: Number, unique: true },
    data: { type: Object, required: true },
  },
  {
    collection: 'attomProperty',
    timestamps: true,
  }
);

export default db.model('attomProperty', attomPropertySchema);
