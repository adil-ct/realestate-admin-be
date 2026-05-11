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

const propertySchema = new Schema(
  {
    /* Start: Fields to be derived from Attom, Comment represents the api response path */
    attom: {
      attomId: { type: Number, required: true, unique: true }, // identifier.attomId
      apn: String, // identifier.apn
      lotsize1: Number, // lot.lotsize1
      lotsize2: Number, // lot.lotsize2
      area: Number, // building.size.universalsize
      lotnum: String, // lot.lotnum
      blockNumber: String, // area.blockNum
      locationType: String, // area.loctype
      country: String, // address.country
      state: String, // address.countrySubd
      city: String, // address.locality
      areaTaxCode: String, // area.taxcodearea
      line1: String, // address.line1
      line2: String, // address.line2
      zipCode: String, // address.postal1
      latitude: String, // location.latitude
      longitude: String, // location.longitude
      propertyClass: String, // summary.propclass
      propertyType: String, // summary.proptype
      yearBuilt: Number, // summary.yearbuilt
      bathTotal: Number, // building.rooms.bathstotal
      bedrooms: Number, // building.rooms.beds
      levels: Number, // building.summary.levels
      avmlastmonthvalue: Number, // avm.AVMChange.avmlastmonthvalue
      avmamountchange: Number, // avm.AVMChange.avmamountchange
      avmpercentchange: Number, // avm.AVMChange.avmpercentchange
    },
    /* End: Fields to be derived from Attom */

    otherInfo: {
      title: String,
      estateId: String,
      _market: { type: ObjectId, ref: 'market' },
      _manager: { type: ObjectId, ref: 'user' },
      _owner: { type: ObjectId, ref: 'user' },
      isOccupied: { type: Boolean, default: false },
      occupiedLabel: String,
      tags: {
        type: [String],
        default: [],
      },
      description: String,
      descriptionHeading: String,
      descriptionSubHeading: String,
      checkoutHeading: String,
      checkoutDescription: String,
      pool: { type: Boolean, default: false },
      fireplace: { type: Boolean, default: false },
      garage: { type: Boolean, default: false },
      quote: String,
      isTrending: { type: Boolean, default: false },
      isHidden: { type: Boolean, default: true },
      interestRate: Number,
      loanTerm: Number,
      purchaseDate: Date,
      firstDividendsDate: Date,
      statusDescription: String,
      financedByName: String,
      financedByImage: { type: fileType },
      managedByName: String,
      managedByImage: { type: fileType },
    },

    financials: {
      assetValue: { type: Number },
      closingCost: { type: Number },
      maintenanceReserve: { type: Number },
      maintenanceReserveBal: { type: Number },
      maintenanceReserveAccountId: String,
      vacancyReserve: { type: Number },
      vacancyReserveBal: { type: Number },
      vacancyReserveAccountId: String,
      mogulBuyerFee: { type: Number },
      mogulSellerFee: { type: Number },
      contingencyVar1: {
        type: { name: String, value: Number, applicable: Boolean },
        default: { name: '', value: 0, applicable: false },
      },
      contingencyVar2: {
        type: { name: String, value: Number, applicable: Boolean },
        default: { name: '', value: 0, applicable: false },
      },
      contingencyVar3: {
        type: { name: String, value: Number, applicable: Boolean },
        default: { name: '', value: 0, applicable: false },
      },
      contingencyVar4: {
        type: { name: String, value: Number, applicable: Boolean },
        default: { name: '', value: 0, applicable: false },
      },
      currentEquity: { type: Number }, //  for update after minting currenteq += new asset value -  old asset value
      currentDebt: { type: Number },
      sellerEquity: { type: Number },
      mogulEquityToBuy: { type: Number },
      mogulEquityToSell: { type: Number },
      platformResaleFee: { type: Number },
      yearlyInvReturn: { type: String },
      projectedInvGain: { type: String },
      defaultRentGrowth: { type: Number },
      defaultAnnualAppreciation: { type: Number },
      defaultTokensPurchased: { type: Number },
      propertyValues: {
        type: [
          {
            updatedAt: { type: Date, required: true },
            value: { type: Number, required: true }, // to be calculated by BE: totalInvestmentValue = sum(assetValue, closingCost, maintenanceReserve, vacancyReserve, mogulBuyerFee, contingencyVar1, contingencyVar2, contingencyVar3, contingencyVar4)
          },
        ],
      },
      assetValues: {
        type: [
          {
            updatedAt: { type: Date, required: true },
            value: { type: Number, required: true },
          },
        ],
      },
      leveragedCashflowMargin: Array,
      defaultMonthlyRent: { type: Number },
      mercuryToken: String,
      brexPaymentInstrumentId: String,
      mercuryRentAccountUuid: String,
      brexRentAccountRecipientId: String,
    },

    documents: {
      main: {
        type: fileType,
      },
      others: {
        type: [fileType],
        default: [],
      },
    },

    images: {
      list: {
        type: [fileType],
        default: [],
      },
      mainImage: Number, // Integer index in array of images, viz. `images.list`.
    },

    video: {
      type: fileType,
    },

    cashflow: {
      monthlyRent: {
        type: [
          {
            updatedAt: { type: Date, required: true },
            value: { type: Number, required: true },
          },
        ],
      },
      rentBal: { type: Number },
      rentalDocuments: {
        type: [
          {
            updatedAt: { type: Date, required: true },
            value: {
              type: fileType,
              required: true,
            },
          },
        ],
      },
      principal: Number,
      interest: Number,
      taxes: Number,
      mortgage: { type: Number }, // to be calculated by BE: mortgage = sum(principal, interest, taxes)
      insurance: Number,
      propertyMgtFee: {
        type: { value: Number, isEnabled: Boolean },
        default: { isEnabled: false },
      },
      LLCAdministrationFee: {
        type: { value: Number, isEnabled: Boolean },
        default: { isEnabled: false },
        value: Number,
      },
      HOAFee: {
        type: { value: Number, isEnabled: Boolean },
        default: { isEnabled: false },
        value: Number,
      },
      annualRentGrowth: Number,
      maxMaintenanceFee: Number,
      maxVacancyFee: Number,
      _monthlyRent: { type: ObjectId, ref: 'monthlyRent' },
      _rentalPeriod: { type: ObjectId, ref: 'rentalPeriod' },
    },

    buyProcess: {
      type: [
        {
          name: String,
          description: String,
          date: Date,
          status: { type: String, enum: ['Completed', 'Pending'] },
        },
      ],
    },

    crowdSale: {
      numberOfTokens: { type: Number }, // Integer
      tokensForSale: Number,
      tokensSold: Number,
      startDate: Date,
      stopDate: Date,
      isMogulEquityBought: { type: Boolean, default: false },
      targetForSaleOrganizer: Number,
      targetAchieved: Boolean,
      saleOrganizer: { type: ObjectId, ref: 'user' },
      minInvestment: Number,
      status: String,
    },

    status: {
      type: String,
      enum: ['Draft', 'Minted', 'OnSale'],
      default: 'Draft',
    },
    mintedAt: {
      type: Date,
    },
    rationale: {
      heading: String,
      description: String,
    },

    fireblocks: {
      vaultId: String,
    },
    investorAccessStatus: { type: Boolean, default: false },
    investorAccessList: [
      {
        id: ObjectId,
        email: String,
        name: String,
      },
    ],

    blockchainAddress: String,

    underwriting: {
      monthlyRentalIncomeBase: { type: Number, default: 0 },
      monthlyRentalIncomeBear: { type: Number, default: 0 },
      monthlyRentalIncomeBull: { type: Number, default: 0 },
      rentalIncomeGrowthRateBase: { type: Number, default: 0 },
      rentalIncomeGrowthRateBear: { type: Number, default: 0 },
      rentalIncomeGrowthRateBull: { type: Number, default: 0 },
      yearlyPropertyTaxesBase: { type: Number, default: 0 },
      hoaDuesBase: { type: Number, default: 0 },
      homeownersInsuranceBase: { type: Number, default: 0 },
      propertyManagementBase: { type: Number, default: 0 },
      miscCostsBase: { type: Number, default: 0 },
      expensesGrowthRateBase: { type: Number, default: 0 },
      expensesGrowthRateBear: { type: Number, default: 0 },
      expensesGrowthRateBull: { type: Number, default: 0 },
      valueGrowthRateBase: { type: Number, default: 0 },
      valueGrowthRateBear: { type: Number, default: 0 },
      valueGrowthRateBull: { type: Number, default: 0 },
      yearsBase: { type: Number, default: 0 },
      yearsBear: { type: Number, default: 0 },
      yearsBull: { type: Number, default: 0 },
    },
    _createdBy: { type: ObjectId, ref: 'admin', select: false },
    _updatedBy: { type: ObjectId, ref: 'admin', select: false },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'property',
  }
);

export default db.model('property', propertySchema);
