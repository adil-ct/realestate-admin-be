import Joi from 'joi';

export const attomIdValidator = (attomId) => {
  const Schema = Joi.number().required();

  const validation = Schema.validate(attomId);
  let hasError = false;
  let error = '';

  if (validation.error) {
    error = validation.error.details[0].message;
    error = error.replace(/"/g, '');
    hasError = true;
  }

  return { error, hasError, sanitizedData: validation.value };
};

export const createPropertyValidator = (data) => {
  const mainSchema = {
    attomId: Joi.number().required(),
  };
  const Schema = Joi.object(mainSchema).required();

  const validation = Schema.validate(data);
  let hasError = false;
  let error = '';

  if (validation.error) {
    error = validation.error.details[0].message;
    error = error.replace(/"/g, '');
    hasError = true;
  }

  return { error, hasError, sanitizedData: validation.value };
};

export const updatePropertyValidator = (data) => {
  const fileSchema = Joi.object({
    contentType: Joi.string().required(),
    key: Joi.string().required(),
    path: Joi.string().required(),
    url: Joi.string().required(),
    sizeInMegaByte: Joi.number().optional(),
    createdAt: Joi.date(),
    _id: Joi.string().optional(),
  });
  const contingencyVar = {
    name: Joi.string().allow('').optional(),
    value: Joi.number(),
    applicable: Joi.bool(),
  };
  const optionalVal = {
    value: Joi.number().optional(),
    isEnabled: Joi.bool(),
  };

  const investorAccessListSchema = Joi.object({
    _id: Joi.string(),
    id: Joi.string(),
    email: Joi.string(),
    name: Joi.string(),
  });

  const mainSchema = {
    attom: Joi.object({
      apn: Joi.string(),
      lotsize1: Joi.number(),
      lotsize2: Joi.number(),
      area: Joi.number(),
      lotnum: Joi.string(),
      blockNumber: Joi.string(),
      locationType: Joi.string(),
      country: Joi.string(),
      state: Joi.string(),
      city: Joi.string(),
      areaTaxCode: Joi.string(),
      line1: Joi.string(),
      line2: Joi.string(),
      zipCode: Joi.string(),
      latitude: Joi.string(),
      longitude: Joi.string(),
      propertyClass: Joi.string(),
      propertyType: Joi.string(),
      yearBuilt: Joi.number(),
      bathTotal: Joi.number(),
      bedrooms: Joi.number(),
      levels: Joi.number(),
      avmlastmonthvalue: Joi.number(),
      avmamountchange: Joi.number(),
      avmpercentchange: Joi.number(),
    }),
    otherInfo: Joi.object({
      title: Joi.string(),
      _market: Joi.string(),
      _manager: Joi.string(),
      _owner: Joi.string(),
      isOccupied: Joi.bool(),
      occupiedLabel: Joi.string(),
      tags: Joi.array().items(Joi.string()),
      description: Joi.string(),
      descriptionHeading: Joi.string(),
      descriptionSubHeading: Joi.string(),
      checkoutHeading: Joi.string(),
      checkoutDescription: Joi.string(),
      pool: Joi.bool(),
      fireplace: Joi.bool(),
      garage: Joi.bool(),
      quote: Joi.string(),
      isTrending: Joi.bool(),
      isHidden: Joi.bool(),
      interestRate: Joi.number(),
      loanTerm: Joi.number(),
      purchaseDate: Joi.date(),
      firstDividendsDate: Joi.date(),
      statusDescription: Joi.string(),
      financedByName: Joi.string(),
      financedByImage: fileSchema,
      managedByName: Joi.string(),
      managedByImage: fileSchema,
    }),
    financials: Joi.object({
      assetValue: Joi.number(),
      closingCost: Joi.number(),
      maintenanceReserve: Joi.number(),
      interest: Joi.number().optional(),
      vacancyReserve: Joi.number(),
      mogulBuyerFee: Joi.number(),
      mogulSellerFee: Joi.number(),
      contingencyVar1: Joi.object(contingencyVar),
      contingencyVar2: Joi.object(contingencyVar),
      contingencyVar3: Joi.object(contingencyVar),
      contingencyVar4: Joi.object(contingencyVar),
      currentEquity: Joi.number(),
      currentDebt: Joi.number(),
      sellerEquity: Joi.number(),
      mogulEquityToBuy: Joi.number(),
      mogulEquityToSell: Joi.number(),
      platformResaleFee: Joi.number(),
      yearlyInvReturn: Joi.string(),
      projectedInvGain: Joi.string(),
      defaultRentGrowth: Joi.number(),
      defaultAnnualAppreciation: Joi.number(),
      defaultTokensPurchased: Joi.number(),
      leveragedCashflowMargin: Joi.string(),
      defaultMonthlyRent: Joi.number(),
      maintenanceReserveBal: Joi.any(),
      vacancyReserveBal: Joi.any(),
      threshold: Joi.any(),
      maintenanceReserveAccountId: Joi.string(),
      vacancyReserveAccountId: Joi.string(),
      mercuryToken: Joi.string(),
      recipientId: Joi.string(),
      brexPaymentInstrumentId: Joi.string(),
      mercuryRentAccountUuid: Joi.string(),
      brexRentAccountRecipientId: Joi.string(),
    }),
    documents: Joi.object({
      main: fileSchema,
      others: Joi.array().items(fileSchema.required()),
    }),
    images: Joi.object({
      list: Joi.array().items(fileSchema.required()),
      mainImage: Joi.number().integer(),
    }),
    video: fileSchema.allow(null),
    cashflow: Joi.object({
      monthlyRent: Joi.number(), // Need to handle separately
      rentalDocument: fileSchema, // Need to handle separately
      principal: Joi.number(),
      interest: Joi.number(),
      taxes: Joi.number(),
      insurance: Joi.number(),
      propertyMgtFee: Joi.object(optionalVal),
      LLCAdministrationFee: Joi.object(optionalVal),
      HOAFee: Joi.object(optionalVal),
      annualRentGrowth: Joi.number(),
      maxMaintenanceFee: Joi.number(),
      maxVacancyFee: Joi.number(),
      _monthlyRent: Joi.any(),
      _rentalPeriod: Joi.any(),
    }),
    buyProcess: Joi.array().items(
      Joi.object({
        name: Joi.string(),
        description: Joi.string(),
        date: Joi.date(),
        status: Joi.string().valid('Completed', 'Pending'),
      })
    ),
    crowdSale: Joi.object({
      numberOfTokens: Joi.number().integer(),
      startDate: Joi.date().min('now'),
      stopDate: Joi.date().min(Joi.ref('startDate')),
      minInvestment: Joi.number(),
    }),
    rationale: Joi.object({
      heading: Joi.string(),
      description: Joi.string(),
    }),
    underwriting: Joi.object({
      monthlyRentalIncomeBase: Joi.number(),
      monthlyRentalIncomeBear: Joi.number(),
      monthlyRentalIncomeBull: Joi.number(),
      rentalIncomeGrowthRateBase: Joi.number(),
      rentalIncomeGrowthRateBear: Joi.number(),
      rentalIncomeGrowthRateBull: Joi.number(),
      yearlyPropertyTaxesBase: Joi.number(),
      hoaDuesBase: Joi.number(),
      homeownersInsuranceBase: Joi.number(),
      propertyManagementBase: Joi.number(),
      miscCostsBase: Joi.number(),
      expensesGrowthRateBase: Joi.number(),
      expensesGrowthRateBear: Joi.number(),
      expensesGrowthRateBull: Joi.number(),
      valueGrowthRateBase: Joi.number(),
      valueGrowthRateBear: Joi.number(),
      valueGrowthRateBull: Joi.number(),
      yearsBase: Joi.number(),
      yearsBear: Joi.number(),
      yearsBull: Joi.number(),
    }),
    investorAccessStatus: Joi.boolean(),
    investorAccessList: Joi.array().items(investorAccessListSchema),
    stripeConnect: Joi.string(),
  };
  const Schema = Joi.object(mainSchema).required();

  const validation = Schema.validate(data);
  let hasError = false;
  let error = '';

  if (validation.error) {
    error = validation.error.details[0].message;
    error = error.replace(/"/g, '');
    hasError = true;
  }

  return { error, hasError, sanitizedData: validation.value };
};

export const updateMintedPropertyValidator = (data) => {
  const fileSchema = Joi.object({
    contentType: Joi.string().required(),
    key: Joi.string().required(),
    path: Joi.string().required(),
    url: Joi.string().required(),
    sizeInMegaByte: Joi.number().optional(),
    createdAt: Joi.date(),
  });
  const optionalVal = {
    value: Joi.number().optional(),
    isEnabled: Joi.bool(),
  };

  const investorAccessListSchema = Joi.object({
    _id: Joi.string(),
    id: Joi.string(),
    email: Joi.string(),
    name: Joi.string(),
  });

  const mainSchema = {
    attom: Joi.object({
      apn: Joi.string(),
      lotsize1: Joi.number(),
      lotsize2: Joi.number(),
      area: Joi.number(),
      lotnum: Joi.string(),
      blockNumber: Joi.string(),
      locationType: Joi.string(),
      city: Joi.string(),
      areaTaxCode: Joi.string(),
      line1: Joi.string(),
      line2: Joi.string(),
      latitude: Joi.string(),
      longitude: Joi.string(),
      propertyClass: Joi.string(),
      propertyType: Joi.string(),
      yearBuilt: Joi.number(),
      bathTotal: Joi.number(),
      bedrooms: Joi.number(),
      levels: Joi.number(),
      avmlastmonthvalue: Joi.number(),
      avmamountchange: Joi.number(),
      avmpercentchange: Joi.number(),
    }),
    otherInfo: Joi.object({
      title: Joi.string(),
      _market: Joi.string(),
      _manager: Joi.string(),
      isOccupied: Joi.bool(),
      occupiedLabel: Joi.string(),
      tags: Joi.array().items(Joi.string()),
      description: Joi.string(),
      descriptionHeading: Joi.string(),
      descriptionSubHeading: Joi.string(),
      checkoutHeading: Joi.string(),
      checkoutDescription: Joi.string(),
      pool: Joi.bool(),
      fireplace: Joi.bool(),
      garage: Joi.bool(),
      quote: Joi.string(),
      isTrending: Joi.bool(),
      isHidden: Joi.bool(),
      interestRate: Joi.number(),
      loanTerm: Joi.number(),
      purchaseDate: Joi.date(),
      firstDividendsDate: Joi.date(),
      statusDescription: Joi.string(),
      financedByName: Joi.string(),
      financedByImage: fileSchema,
      managedByName: Joi.string(),
      managedByImage: fileSchema,
    }).optional(),
    financials: Joi.object({
      assetValue: Joi.number(),
      interest: Joi.number().optional(),
      currentEquity: Joi.number(),
      currentDebt: Joi.number(),
      platformResaleFee: Joi.number(),
      yearlyInvReturn: Joi.string(),
      projectedInvGain: Joi.string(),
      defaultRentGrowth: Joi.number(),
      defaultAnnualAppreciation: Joi.number(),
      defaultTokensPurchased: Joi.number(),
      leveragedCashflowMargin: Joi.string(),
      defaultMonthlyRent: Joi.number(),
      maintenanceReserveBal: Joi.any(),
      vacancyReserveBal: Joi.any(),
      threshold: Joi.any(),
      maintenanceReserveAccountId: Joi.string(),
      vacancyReserveAccountId: Joi.string(),
      mercuryToken: Joi.string(),
      recipientId: Joi.string(),
      brexPaymentInstrumentId: Joi.string(),
      mercuryRentAccountUuid: Joi.string(),
      brexRentAccountRecipientId: Joi.string(),
    }),
    documents: Joi.object({
      others: Joi.array().items(fileSchema.required()),
    }),
    images: Joi.object({
      list: Joi.array().items(fileSchema.required()),
      mainImage: Joi.number().integer(),
    }),
    video: fileSchema.allow(null),
    cashflow: Joi.object({
      monthlyRent: Joi.number(), // Need to handle separately
      rentalDocument: fileSchema, // Need to handle separately
      interest: Joi.number(),
      principal: Joi.number(),
      taxes: Joi.number(),
      insurance: Joi.number(),
      propertyMgtFee: Joi.object(optionalVal),
      LLCAdministrationFee: Joi.object(optionalVal),
      HOAFee: Joi.object(optionalVal),
      annualRentGrowth: Joi.number(),
      maxMaintenanceFee: Joi.number(),
      maxVacancyFee: Joi.number(),
      _monthlyRent: Joi.any(),
      _rentalPeriod: Joi.any(),
    }),
    buyProcess: Joi.array().items(
      Joi.object({
        name: Joi.string(),
        description: Joi.string(),
        date: Joi.date(),
        status: Joi.string().valid('Completed', 'Pending'),
      })
    ),
    crowdSale: Joi.object({
      startDate: Joi.date(),
      stopDate: Joi.date(),
      minInvestment: Joi.number(),
    }),
    rationale: Joi.object({
      heading: Joi.string(),
      description: Joi.string(),
    }),
    underwriting: Joi.object({
      monthlyRentalIncomeBase: Joi.number(),
      monthlyRentalIncomeBear: Joi.number(),
      monthlyRentalIncomeBull: Joi.number(),
      rentalIncomeGrowthRateBase: Joi.number(),
      rentalIncomeGrowthRateBear: Joi.number(),
      rentalIncomeGrowthRateBull: Joi.number(),
      yearlyPropertyTaxesBase: Joi.number(),
      hoaDuesBase: Joi.number(),
      homeownersInsuranceBase: Joi.number(),
      propertyManagementBase: Joi.number(),
      miscCostsBase: Joi.number(),
      expensesGrowthRateBase: Joi.number(),
      expensesGrowthRateBear: Joi.number(),
      expensesGrowthRateBull: Joi.number(),
      valueGrowthRateBase: Joi.number(),
      valueGrowthRateBear: Joi.number(),
      valueGrowthRateBull: Joi.number(),
      yearsBase: Joi.number(),
      yearsBear: Joi.number(),
      yearsBull: Joi.number(),
    }),
    blockchainAddress: Joi.string(),
    investorAccessStatus: Joi.boolean(),
    investorAccessList: Joi.array().items(investorAccessListSchema),
    stripeConnect: Joi.string(),
    fireblocks: Joi.object().optional(),
    mintedAt: Joi.date().optional(),
    rentalDocuments: Joi.array(),
  };
  const Schema = Joi.object(mainSchema).required();

  const validation = Schema.validate(data);
  let hasError = false;
  let error = '';

  if (validation.error) {
    error = validation.error.details[0].message;
    error = error.replace(/"/g, '');
    hasError = true;
  }

  return { error, hasError, sanitizedData: validation.value };
};

export const getAllPropertiesValidator = (data) => {
  const mainSchema = {
    title: Joi.string(),
    startIndex: Joi.number(),
    itemsPerPage: Joi.number(),
    sendData: Joi.string(),
    status: Joi.string().valid('Draft', 'Minted', 'OnSale').optional(),
  };
  const Schema = Joi.object(mainSchema).required();

  const validation = Schema.validate(data);
  let hasError = false;
  let error = '';

  if (validation.error) {
    error = validation.error.details[0].message;
    error = error.replace(/"/g, '');
    hasError = true;
  }

  return { error, hasError, sanitizedData: validation.value };
};

export const checkPropertyReadyToMint = (data) => {
  const fileSchema = Joi.object({
    contentType: Joi.string().required(),
    key: Joi.string().required(),
    path: Joi.string().required(),
    url: Joi.string().required(),
    sizeInMegaByte: Joi.number().optional(),
    createdAt: Joi.date(),
  })
    .options({ presence: 'required' })
    .required()
    .unknown();
  const contingencyVar = {
    name: Joi.string().allow('').optional(),
    value: Joi.number().optional(),
    applicable: Joi.bool(),
  };
  const optionalVal = {
    value: Joi.number().optional(),
    isEnabled: Joi.bool(),
  };
  const versionedVal = (type) => {
    return Joi.array().items(
      Joi.object({
        updatedAt: Joi.date(),
        value: type,
      }).unknown()
    );
  };

  const mainSchema = {
    _id: Joi.string(),
    attom: Joi.object({
      attomId: Joi.number(),
      apn: Joi.string(),
      lotsize1: Joi.number(),
      lotsize2: Joi.number(),
      area: Joi.number(),
      lotnum: Joi.string(),
      blockNumber: Joi.string(),
      locationType: Joi.string(),
      country: Joi.string(),
      state: Joi.string(),
      city: Joi.string(),
      areaTaxCode: Joi.string(),
      line1: Joi.string(),
      line2: Joi.string(),
      zipCode: Joi.string(),
      latitude: Joi.string(),
      longitude: Joi.string(),
      propertyClass: Joi.string(),
      propertyType: Joi.string(),
      yearBuilt: Joi.number(),
      bathTotal: Joi.number(),
      bedrooms: Joi.number(),
      levels: Joi.number(),
      avmlastmonthvalue: Joi.number(),
      avmamountchange: Joi.number(),
      avmpercentchange: Joi.number(),
    })
      .options({ presence: 'required' })
      .required(),
    otherInfo: Joi.object({
      title: Joi.string(),
      _market: Joi.string(),
      _manager: Joi.string(),
      _owner: Joi.string(),
      isOccupied: Joi.bool(),
      occupiedLabel: Joi.string(),
      tags: Joi.array().items(Joi.string()).options({ presence: 'required' }).required(),
      description: Joi.string(),
      descriptionHeading: Joi.string().optional(),
      descriptionSubHeading: Joi.string().optional(),
      checkoutHeading: Joi.string().optional(),
      checkoutDescription: Joi.string().optional(),
      pool: Joi.bool(),
      fireplace: Joi.bool(),
      garage: Joi.bool(),
      quote: Joi.string(),
      isTrending: Joi.bool(),
      isHidden: Joi.bool(),
      interestRate: Joi.number(),
      loanTerm: Joi.number(),
      purchaseDate: Joi.date(),
      firstDividendsDate: Joi.date(),
      statusDescription: Joi.string(),
      financedByName: Joi.string(),
      financedByImage: fileSchema,
      managedByName: Joi.string(),
      managedByImage: fileSchema,
    })
      .options({ presence: 'required' })
      .required()
      .unknown(),
    financials: Joi.object({
      assetValue: Joi.number(),
      closingCost: Joi.number(),
      interest: Joi.number().optional(),
      maintenanceReserve: Joi.number(),
      vacancyReserve: Joi.number(),
      mogulBuyerFee: Joi.number(),
      mogulSellerFee: Joi.number(),
      contingencyVar1: Joi.object(contingencyVar).options({ presence: 'required' }).required().unknown(),
      contingencyVar2: Joi.object(contingencyVar).options({ presence: 'required' }).required().unknown(),
      contingencyVar3: Joi.object(contingencyVar).options({ presence: 'required' }).required().unknown(),
      contingencyVar4: Joi.object(contingencyVar).options({ presence: 'required' }).required().unknown(),
      currentEquity: Joi.number(),
      currentDebt: Joi.number(),
      sellerEquity: Joi.number(),
      mogulEquityToBuy: Joi.number(),
      mogulEquityToSell: Joi.number(),
      platformResaleFee: Joi.number(),
      yearlyInvReturn: Joi.string(),
      projectedInvGain: Joi.string(),
      defaultRentGrowth: Joi.number(),
      defaultAnnualAppreciation: Joi.number(),
      defaultTokensPurchased: Joi.number(),
      propertyValues: versionedVal(Joi.number()),
      assetValues: versionedVal(Joi.number()).optional().allow(null),
      leveragedCashflowMargin: Joi.array(),
      defaultMonthlyRent: Joi.number(),
    })
      .options({ presence: 'required' })
      .required()
      .unknown(),
    documents: Joi.object({
      main: fileSchema,
      others: Joi.array().items(fileSchema).options({ presence: 'required' }).required(),
    }).unknown(),
    images: Joi.object({
      list: Joi.array().items(fileSchema).options({ presence: 'required' }).required(),
      mainImage: Joi.number().integer(),
    })
      .options({ presence: 'required' })
      .required()
      .unknown(),
    cashflow: Joi.object({
      monthlyRent: versionedVal(Joi.number()),
      rentalDocuments: versionedVal(fileSchema),
      principal: Joi.number(),
      interest: Joi.number(),
      taxes: Joi.number(),
      insurance: Joi.number(),
      propertyMgtFee: Joi.object(optionalVal).options({ presence: 'required' }).optional().unknown(),
      LLCAdministrationFee: Joi.object(optionalVal).options({ presence: 'required' }).optional().unknown(),
      HOAFee: Joi.object(optionalVal).options({ presence: 'required' }).optional().unknown(),
      annualRentGrowth: Joi.number(),
      maxMaintenanceFee: Joi.number(),
      maxVacancyFee: Joi.number(),
      _monthlyRent: Joi.any().optional(),
      _rentalPeriod: Joi.any().optional(),
    }).unknown(),
    buyProcess: Joi.array()
      .items(
        Joi.object({
          name: Joi.string(),
          description: Joi.string(),
          date: Joi.date(),
          status: Joi.string().valid('Completed', 'Pending').optional(),
        })
          .options({ presence: 'required' })
          .required()
          .unknown()
      )
      .options({ presence: 'required' })
      .required(),
    crowdSale: Joi.object({
      numberOfTokens: Joi.number().integer(),
      startDate: Joi.date(),
      stopDate: Joi.date(),
    })
      .options({ presence: 'required' })
      .required()
      .unknown(),
    status: Joi.string().valid('Draft').required(),
  };
  const Schema = Joi.object(mainSchema).options({ presence: 'required' }).unknown().required();

  const validation = Schema.validate(data);
  let hasError = false;
  let error = '';

  if (validation.error) {
    error = validation.error.details[0].message;
    error = error.replace(/"/g, '');
    hasError = true;
  }

  return { error, hasError, sanitizedData: validation.value };
};
