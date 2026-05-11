import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import db from '../../connections/dbMaster.js';
import dateFormats from '../../helpers/date.js';

const { Schema } = mongoose;

mongoose.Promise = Promise;

const adminSchema = new Schema(
  {
    email: {
      type: String,
      require: true,
    },
    userType: {
      type: String,
      default: 'admin',
      enum: ['admin'],
    },
    password: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
    },
    mobileNumber: {
      type: Number,
    },
    expiresAt: {
      type: Date,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    twoFA: {
      sms: {
        type: Boolean,
        default: false,
      },
      none: {
        type: Boolean,
        default: true,
      },
    },
    forgotPasswordRequest: {
      type: Boolean,
      default: false,
    },
    forceUpdatePassword: {
      type: Boolean,
      default: false,
    },
    tempPasswordExpiry: {
      type: Date,
      default: dateFormats.tempPasswordExpiryTime(),
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Deactive'],
    },
    deactivatedAt: {
      type: Date,
    },
    name: {
      type: String,
      require: true,
    },
    passwordResetToken: String,
  },
  {
    collection: 'admin',
    timestamps: true,
  }
);

adminSchema.pre('save', async function savePassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

export default db.model('admin', adminSchema);
