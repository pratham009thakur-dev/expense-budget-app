import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Category from '../models/Category.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', color: '#10B981' },
  { name: 'Freelance', type: 'income', color: '#3B82F6' },
  { name: 'Investments', type: 'income', color: '#8B5CF6' },
  { name: 'Food & Dining', type: 'expense', color: '#EF4444' },
  { name: 'Rent & Utilities', type: 'expense', color: '#F97316' },
  { name: 'Transportation', type: 'expense', color: '#F59E0B' },
  { name: 'Entertainment', type: 'expense', color: '#EC4899' },
  { name: 'Healthcare', type: 'expense', color: '#06B6D4' },
  { name: 'Shopping', type: 'expense', color: '#6366F1' },
  { name: 'Other', type: 'expense', color: '#64748B' }
];

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });

    // Seed default starter categories scoped to this new user
    const initialCategories = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      user: user._id,
      isDefault: true
    }));
    await Category.insertMany(initialCategories);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};