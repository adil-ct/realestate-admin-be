import moment from 'moment';
import Logger from '../../config/logger.js';
import Admin from '../admin/model.js';
import User from '../user/model.js'
import Property from '../property/model.js';
import db from '../../connections/dbMaster.js';

const PaymentModel = db.collection('payment');


export const dashboardStatsService = async () => {
  Logger.info('inside dashboard stats service');
  try {
    const thisWeekStart = moment().startOf('week').toISOString();
    const thisWeekEnd = moment().toISOString();

    // Get the start and end dates for the previous week
    const lastWeekStart = moment().startOf('week').subtract(1, 'week').toISOString();
    const lastWeekEnd = moment().endOf('week').subtract(1, 'week').toISOString();

    const totalUserPipeline = [
      {
        $match: {
          isActiveUser: { $ne: false },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$createdAt', new Date(thisWeekStart)] }, { $lte: ['$createdAt', new Date(thisWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$createdAt', new Date(lastWeekStart)] }, { $lt: ['$createdAt', new Date(lastWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const totalAdminPipeline = [
      {
        $match: {},
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$createdAt', new Date(thisWeekStart)] }, { $lte: ['$createdAt', new Date(thisWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$createdAt', new Date(lastWeekStart)] }, { $lt: ['$createdAt', new Date(lastWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];
    const suspendedPipeline = [
      {
        $match: { blockStatus: true },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$blockedAt', new Date(thisWeekStart)] }, { $lte: ['$blockedAt', new Date(thisWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$blockedAt', new Date(lastWeekStart)] }, { $lt: ['$blockedAt', new Date(lastWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const suspendedAdminPipeline = [
      {
        $match: { status: 'Deactive' },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$deactivatedAt', new Date(thisWeekStart)] }, { $lte: ['$deactivatedAt', new Date(thisWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$deactivatedAt', new Date(lastWeekStart)] }, { $lt: ['$deactivatedAt', new Date(lastWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const draftPropertiesPipeline = [
      {
        $match: { status: 'Draft' },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$createdAt', new Date(thisWeekStart)] }, { $lte: ['$createdAt', new Date(thisWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$createdAt', new Date(lastWeekStart)] }, { $lt: ['$createdAt', new Date(lastWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const mintedPropertyPipeline = [
      {
        $match: { status: 'Draft' },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$mintedAt', new Date(thisWeekStart)] }, { $lte: ['$mintedAt', new Date(thisWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ['$mintedAt', new Date(lastWeekStart)] }, { $lt: ['$mintedAt', new Date(lastWeekEnd)] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const onSalePropertyPipeline = [
      {
        $match: { status: 'OnSale' },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gte: ['$crowdSale.startDate', new Date(thisWeekStart)],
                    },
                    { $lte: ['$crowdSale.startDate', new Date(thisWeekEnd)] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gte: ['$crowdSale.startDate', new Date(lastWeekStart)],
                    },
                    { $lt: ['$crowdSale.startDate', new Date(lastWeekEnd)] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];
    
    const totalInvestmentPipeline = [
      {
        $match: { investmentStatus: 'completed' },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gte: ['$createdAt', new Date(thisWeekStart)],
                    },
                    { $lte: ['$createdAt', new Date(thisWeekEnd)] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gte: ['$createdAt', new Date(lastWeekStart)],
                    },
                    { $lt: ['$createdAt', new Date(lastWeekEnd)] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];
    const [totalUser, suspendedUser, totalAdmin, suspendedAdmin, draftProperties, mintedProperty, onSaleProperty,totalInvestment] = await Promise.allSettled([
      User.aggregate(totalUserPipeline),
      User.aggregate(suspendedPipeline),
      Admin.aggregate(totalAdminPipeline),
      Admin.aggregate(suspendedAdminPipeline),
      Property.aggregate(draftPropertiesPipeline),
      Property.aggregate(mintedPropertyPipeline),
      Property.aggregate(onSalePropertyPipeline),
      PaymentModel.aggregate(totalInvestmentPipeline)
    ]);

    const totalUserCount = {
      total: totalUser.status === 'fulfilled' && totalUser.value[0]?.total ? totalUser.value[0].total : 0,
      current: totalUser.status === 'fulfilled' && totalUser.value[0]?.thisWeekCount ? totalUser.value[0].thisWeekCount : 0,
      previous: totalUser.status === 'fulfilled' && totalUser.value[0]?.lastWeekCount ? totalUser.value[0].lastWeekCount : 0,
    };
    const suspendedUserCount = {
      total: suspendedUser.status === 'fulfilled' && suspendedUser.value.length > 0 ? suspendedUser.value[0].total : 0,
      current: suspendedUser.status === 'fulfilled' && suspendedUser.value.length > 0 ? suspendedUser.value[0].thisWeekCount : 0,
      previous: suspendedUser.status === 'fulfilled' && suspendedUser.value.length > 0 ? suspendedUser.value[0].lastWeekCount : 0,
    };

    const totalAdminCount = {
      total: totalAdmin.status === 'fulfilled' && totalAdmin.value[0]?.total ? totalAdmin.value[0].total : 0,
      current: totalAdmin.status === 'fulfilled' && totalAdmin.value[0]?.thisWeekCount ? totalAdmin.value[0].thisWeekCount : 0,
      previous: totalAdmin.status === 'fulfilled' && totalAdmin.value[0]?.lastWeekCount ? totalAdmin.value[0].lastWeekCount : 0,
    };

    const suspendedAdminCount = {
      total: suspendedAdmin.status === 'fulfilled' && suspendedAdmin.value.length > 0 ? suspendedAdmin.value[0].total : 0,
      current: suspendedAdmin.status === 'fulfilled' && suspendedAdmin.value.length > 0 ? suspendedAdmin.value[0].thisWeekCount : 0,
      previous: suspendedAdmin.status === 'fulfilled' && suspendedAdmin.value.length > 0 ? suspendedAdmin.value[0].lastWeekCount : 0,
    };

    const draftPropertiesCount = {
      total: draftProperties.status === 'fulfilled' && draftProperties.value.length > 0 ? draftProperties.value[0].total : 0,
      current: draftProperties.status === 'fulfilled' && draftProperties.value.length > 0 ? draftProperties.value[0].thisWeekCount : 0,
      previous: draftProperties.status === 'fulfilled' && draftProperties.value.length > 0 ? draftProperties.value[0].lastWeekCount : 0,
    };

    const mintedPropertyCount = {
      total: mintedProperty.status === 'fulfilled' && mintedProperty.value.length > 0 ? mintedProperty.value[0].total : 0,
      current: mintedProperty.status === 'fulfilled' && mintedProperty.value.length > 0 ? mintedProperty.value[0].thisWeekCount : 0,
      previous: mintedProperty.status === 'fulfilled' && mintedProperty.value.length > 0 ? mintedProperty.value[0].lastWeekCount : 0,
    };
    const onSalePropertyCount = {
      total: onSaleProperty.status === 'fulfilled' && onSaleProperty.value.length > 0 ? onSaleProperty.value[0].total : 0,
      current: onSaleProperty.status === 'fulfilled' && onSaleProperty.value.length > 0 ? onSaleProperty.value[0].thisWeekCount : 0,
      previous: onSaleProperty.status === 'fulfilled' && onSaleProperty.value.length > 0 ? onSaleProperty.value[0].lastWeekCount : 0,
    };

    

    const totalInvestmentCount = {
      total: totalInvestment.status === 'fulfilled' && totalInvestment.value.length > 0 ? totalInvestment.value[0].total : 0,
      current: totalInvestment.status === 'fulfilled' && totalInvestment.value.length > 0 ? totalInvestment.value[0].thisWeekCount : 0,
      previous: totalInvestment.status === 'fulfilled' && totalInvestment.value.length > 0 ? totalInvestment.value[0].lastWeekCount : 0,
    };
    
    return {
      totalUserCount,
      suspendedUserCount,
      totalAdminCount,
      suspendedAdminCount,
      draftPropertiesCount,
      mintedPropertyCount,
      onSalePropertyCount,
      totalInvestmentCount
    };
  } catch (err) {
    Logger.error(err.message);
    return { error: err.message };
  }
};
