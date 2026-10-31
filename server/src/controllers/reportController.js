import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

export const getReports = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const { startDate, endDate, year } = req.query;

    let filterStartDate;
    let filterEndDate;

    if (startDate && endDate) {
      filterStartDate = new Date(startDate);
      filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999);
    } else {
      const selectedYear = parseInt(year, 10) || new Date().getFullYear();
      filterStartDate = new Date(selectedYear, 0, 1);
      filterEndDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    }

    const matchQuery = {
      user: userId,
      date: { $gte: filterStartDate, $lte: filterEndDate }
    };

    // Aggregate totals for the period
    const totals = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    totals.forEach((item) => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpense = item.total;
    });

    // Monthly aggregation for the selected period
    const monthlySummary = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};

    monthlySummary.forEach((item) => {
      const key = `${monthNames[item._id.month - 1]}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: key, income: 0, expense: 0, savings: 0 };
      }
      if (item._id.type === 'income') monthlyMap[key].income = item.total;
      if (item._id.type === 'expense') monthlyMap[key].expense = item.total;
      monthlyMap[key].savings = monthlyMap[key].income - monthlyMap[key].expense;
    });

    // Category-wise Breakdown for Expenses
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { ...matchQuery, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          color: '$category.color',
          totalAmount: 1,
          count: 1
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Payment method breakdown
    const paymentMethodBreakdown = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
        monthlyTrends: Object.values(monthlyMap),
        categoryBreakdown,
        paymentMethodBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};