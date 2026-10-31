import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';

export const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, search, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('category', 'name color type')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id }).populate('category');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, date, paymentMethod, notes } = req.body;

    if (!title || !amount || !type || !category) {
      return res.status(400).json({ success: false, message: 'Title, amount, type, and category are required' });
    }

    // Validate category belongs to user
    const validCategory = await Category.findOne({ _id: category, user: req.user._id });
    if (!validCategory) {
      return res.status(400).json({ success: false, message: 'Selected category does not exist' });
    }

    if (validCategory.type !== type) {
      return res.status(400).json({
        success: false,
        message: `Category '${validCategory.name}' belongs to ${validCategory.type}, but transaction is ${type}`
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      title,
      amount: Number(amount),
      type,
      category,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || ''
    });

    const populated = await Transaction.findById(transaction._id).populate('category', 'name color type');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const { title, amount, type, category, date, paymentMethod, notes } = req.body;

    if (category) {
      const validCategory = await Category.findOne({ _id: category, user: req.user._id });
      if (!validCategory) {
        return res.status(400).json({ success: false, message: 'Selected category does not exist' });
      }
      const targetType = type || transaction.type;
      if (validCategory.type !== targetType) {
        return res.status(400).json({
          success: false,
          message: `Category type '${validCategory.type}' does not match transaction type '${targetType}'`
        });
      }
      transaction.category = category;
    }

    if (title) transaction.title = title;
    if (amount) transaction.amount = Number(amount);
    if (type) transaction.type = type;
    if (date) transaction.date = new Date(date);
    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();
    const updated = await Transaction.findById(transaction._id).populate('category', 'name color type');

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};