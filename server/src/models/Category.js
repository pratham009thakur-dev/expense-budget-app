import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null indicates a global default category
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [40, 'Category name cannot exceed 40 characters']
    },
    type: {
      type: String,
      required: [true, 'Category type is required'],
      enum: ['income', 'expense']
    },
    color: {
      type: String,
      default: '#4F46E5',
      match: [/^#([0-9A-F]{3}){1,2}$/i, 'Please provide a valid HEX color code']
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

categorySchema.index({ user: 1, name: 1, type: 1 });

export default mongoose.model('Category', categorySchema);