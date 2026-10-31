import React, { useState, useEffect } from 'react';
import API from '../api/axiosInstance';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Trash2, Tags, AlertCircle } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [actionError, setActionError] = useState('');

  // Form
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#4F46E5');
  const [creating, setCreating] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await API.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionError('');
    setCreating(true);
    try {
      await API.post('/categories', { name, type, color });
      setName('');
      fetchCategories();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionError('');
    try {
      await API.delete(`/categories/${deleteId}`);
      setDeleteId(null);
      fetchCategories();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Cannot delete category');
      setDeleteId(null);
    }
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">Configure custom categorization for tracking and budgets</p>
      </div>

      {actionError && (
        <div className="flex items-center gap-3 p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{actionError}</p>
        </div>
      )}

      {/* Create Category Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Tags className="w-5 h-5 text-indigo-600" /> Add Custom Category
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Software Subscriptions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 p-1 border border-slate-300 rounded-xl cursor-pointer"
              />
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {creating ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Category Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center justify-between">
            <span>Expense Categories</span>
            <span className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full font-semibold">
              {expenseCategories.length} items
            </span>
          </h3>
          <div className="divide-y divide-slate-100">
            {expenseCategories.map((c) => (
              <div key={c._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color }}></div>
                  <span className="text-sm font-medium text-slate-700">{c.name}</span>
                </div>
                <button
                  onClick={() => setDeleteId(c._id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Income Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center justify-between">
            <span>Income Categories</span>
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-semibold">
              {incomeCategories.length} items
            </span>
          </h3>
          <div className="divide-y divide-slate-100">
            {incomeCategories.map((c) => (
              <div key={c._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color }}></div>
                  <span className="text-sm font-medium text-slate-700">{c.name}</span>
                </div>
                <button
                  onClick={() => setDeleteId(c._id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete Category"
        message="Are you sure you want to remove this category? If transactions or budgets use it, removal will be prevented."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}