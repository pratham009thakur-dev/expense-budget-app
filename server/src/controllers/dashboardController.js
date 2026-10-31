import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Lifetime Totals
    const lifetimeStats = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    lifetimeStats.forEach((stat) => {
      if (stat._id === 'income') totalIncome = stat.total;
      if (stat._id === 'expense') totalExpenses = stat.total;
    });

    const currentBalance = totalIncome - totalExpenses;

    // Current Month Totals
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    monthlyStats.forEach((stat) => {
      if (stat._id === 'income') monthlyIncome = stat.total;
      if (stat._id === 'expense') monthlyExpenses = stat.total;
    });
    const monthlySavings = monthlyIncome - monthlyExpenses;

    // Monthly breakdown for last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format 6 months timeline chart data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      trendMap[key] = { name: key, income: 0, expense: 0 };
    }

    monthlyTrends.forEach((item) => {
      const key = `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`;
      if (trendMap[key]) {
        if (item._id.type === 'income') trendMap[key].income = item.total;
        if (item._id.type === 'expense') trendMap[key].expense = item.total;
      }
    });

    const incomeVsExpenseData = Object.values(trendMap);

    // Current Month Expense Category Breakdown
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          value: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $project: {
          name: '$categoryDetails.name',
          color: '$categoryDetails.color',
          value: 1
        }
      },
      { $sort: { value: -1 } }
    ]);

    // Recent 5 Transactions
    const recentTransactions = await Transaction.find({ user: userId })
      .populate('category', 'name color type')
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          currentBalance,
          monthlyIncome,
          monthlyExpenses,
          monthlySavings
        },
        incomeVsExpenseData,
        categoryBreakdown,
        recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};