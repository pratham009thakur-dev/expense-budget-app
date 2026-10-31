import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axiosInstance';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories?type=expense');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setCategoryId(categories.length > 0 ? categories[0]._id : '');
    setAmount('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBudget(b);
    setCategoryId(b.category._id);
    setAmount(b.amount);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingBudget) {
        await API.put(`/budgets/${editingBudget._id}`, { amount });
      } else {
        await API.post('/budgets', { category: categoryId, amount, month, year });
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save budget target');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await API.delete(`/budgets/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchBudgets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Budget Plans</h1>
          <p className="text-sm text-slate-500 mt-1">Set monthly financial boundaries and track your expenditures</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" /> Add Budget
          </button>
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading budget records...</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">No category budgets established for this month.</p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold text-sm rounded-xl hover:bg-indigo-100 transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const isExceeded = b.status === 'exceeded';
            const isWarning = b.status === 'warning';

            return (
              <div
                key={b._id}
                className={`bg-white rounded-2xl p-6 border shadow-sm transition flex flex-col justify-between ${
                  isExceeded
                    ? 'border-red-300 ring-2 ring-red-100'
                    : isWarning
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: b.category?.color || '#6366f1' }}></div>
                      <h3 className="font-bold text-slate-800 text-base">{b.category?.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(b._id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-semibold">Spent</span>
                      <span className="text-xl font-bold text-slate-800">${b.spent.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block uppercase font-semibold">Budget Cap</span>
                      <span className="text-xl font-bold text-slate-500">${b.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    {isExceeded ? (
                      <span className="flex items-center gap-1 text-red-600 font-bold">
                        <AlertCircle className="w-4 h-4" /> Exceeded limit
                      </span>
                    ) : isWarning ? (
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <AlertTriangle className="w-4 h-4" /> Approaching cap
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> On Track
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500">
                    {isExceeded ? `Over by $${(b.spent - b.amount).toFixed(2)}` : `$${b.remaining.toFixed(2)} remaining`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingBudget ? 'Update Budget Cap' : 'Define Category Budget'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {formError}
              </p>
            )}

            <form onSubmit={handleSaveBudget} className="mt-4 space-y-4">
              {!editingBudget && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Amount ($)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition"
                >
                  {editingBudget ? 'Save Changes' : 'Establish Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Delete Budget Target"
        message="Are you sure you want to delete this monthly budget threshold?"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}