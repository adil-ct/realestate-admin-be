import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import db from '../../connections/dbMaster.js';

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

mongoose.Promise = Promise;

const userSchema = new Schema(
  {
    userType: {
      type: String,
      default: 'investor',
      enum: ['investor', 'property_manager'],
    },
    propertyManager: [
      {
        propertyId: { type: ObjectId, ref: 'property' },
      },
    ],
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      // required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerifiationExpiry: Date,
    passwordUpdatedAt: {
      type: Date,
    },
    personalDetailsCheck: {
      type: Boolean,
      default: false,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    dob: {
      type: Date,
    },
    countryCode: {
      type: String,
    },
    mobileNumber: {
      type: Number,
    },
    country: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    address1: {
      type: String,
      trim: true,
    },
    address2: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: Number,
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    profilePic: String,
    securityCheck: {
      type: Boolean,
      default: false,
    },
    twoFA: {
      authenticator: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      none: {
        type: Boolean,
        default: true,
      },
    },
    kycStatus: {
      type: String,
      default: 'pending',
      enum: ['pending', 'complete'],
    },
    kycId: {
      type: String,
    },
    bank: [
      {
        type: {
          type: String,
          enum: ['wire', 'ACH'],
        },
        id: String,
        trackingRef: String,
        description: String,
        accountNumber: String,
      },
    ],
    cards: [
      {
        cardNumber: Number,
        cvv: Number,
        expMonth: Number,
        expYear: Number,
        type: String,
      },
    ],
    walletId: String,
    blockchainAddress: String,
    authenticatorSecret: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    earlyAccess: {
      type: Boolean,
      default: false,
    },
    temporaryPassword: String,
    temporaryPasswordSent: {
      type: Boolean,
      default: false,
    },
    tempPasswordExpiry: Date,
    forceUpdatePassword: {
      type: Boolean,
      default: false,
    },
    blockStatus: {
      type: Boolean,
      default: false,
    },
    blacklistType: {
      type: String,
      enum: ['complete', 'fromInvestments'],
    },
    blockReason: String,
    blockedAt: {
      type: Date,
    },
    personName: String,
    companyName: String,
    registeredProperty: {
      type: Boolean,
      default: false,
    },
    isActiveUser: {
      type: Boolean,
      default: true,
    },
    venly: {
      walletId: String,
      pincode: String,
    },
    fireblocks: {
      vaultId: String,
    },
  },
  {
    collection: 'user',
    timestamps: true,
  }
);

userSchema.methods.checkPassword = async (enteredPassword) => {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default db.model('user', userSchema);
