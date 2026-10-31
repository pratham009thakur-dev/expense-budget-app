import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

export const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user._id };
    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, type, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be income or expense' });
    }

    const exists = await Category.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      type
    });

    if (exists) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = await Category.create({
      user: req.user._id,
      name: name.trim(),
      type,
      color: color || '#4F46E5',
      isDefault: false
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if category is currently used in transactions
    const transactionCount = await Transaction.countDocuments({ category: req.params.id });
    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is associated with ${transactionCount} transaction(s).`
      });
    }

    // Check if category is tied to any active budgets
    const budgetCount = await Budget.countDocuments({ category: req.params.id });
    if (budgetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is associated with ${budgetCount} budget plan(s).`
      });
    }

    await Category.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};