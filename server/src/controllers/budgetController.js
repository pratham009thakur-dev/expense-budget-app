import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';

export const getBudgets = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const month = parseInt(req.query.month, 10) || currentMonth;
    const year = parseInt(req.query.year, 10) || currentYear;

    const budgets = await Budget.find({ user: req.user._id, month, year }).populate('category', 'name color type');

    // Aggregate expenses for that month & year for each category
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const expenseAgg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);

    const expenseMap = {};
    expenseAgg.forEach((item) => {
      expenseMap[item._id.toString()] = item.totalSpent;
    });

    const budgetsWithProgress = budgets.map((b) => {
      const spent = expenseMap[b.category._id.toString()] || 0;
      const remaining = Math.max(0, b.amount - spent);
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      let status = 'normal';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      return {
        _id: b._id,
        category: b.category,
        amount: b.amount,
        month: b.month,
        year: b.year,
        spent,
        remaining,
        percentage,
        status
      };
    });

    res.status(200).json({ success: true, data: budgetsWithProgress });
  } catch (error) {
    next(error);
  }
};

export const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;

    if (!category || !amount || !month || !year) {
      return res.status(400).json({ success: false, message: 'All budget parameters are required' });
    }

    const cat = await Category.findOne({ _id: category, user: req.user._id, type: 'expense' });
    if (!cat) {
      return res.status(400).json({ success: false, message: 'Valid expense category is required for budget' });
    }

    const existingBudget = await Budget.findOne({
      user: req.user._id,
      category,
      month: Number(month),
      year: Number(year)
    });

    if (existingBudget) {
      return res.status(400).json({ success: false, message: 'A budget already exists for this category in the selected month' });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category,
      amount: Number(amount),
      month: Number(month),
      year: Number(year)
    });

    const populated = await Budget.findById(budget._id).populate('category', 'name color type');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount is required' });
    }

    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    budget.amount = Number(amount);
    await budget.save();

    const populated = await Budget.findById(budget._id).populate('category', 'name color type');
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    res.status(200).json({ success: true, message: 'Budget removed successfully' });
  } catch (error) {
    next(error);
  }
};