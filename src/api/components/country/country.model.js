import mongoose from 'mongoose';
import db from '../../connections/dbMaster.js';

const { Schema } = mongoose;

const schema = new Schema(
  {
    iso2: String,
    iso3: String,
    name: String,
    state: String,
    cities: [String],
  },
  {
    autoIndex: true,
    versionKey: false,
    timestamps: true,
  }
);

export const countryModel = db.model('country', schema);
