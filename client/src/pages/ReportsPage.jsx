import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axiosInstance';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else {
        params.year = year;
      }
      const res = await API.get('/reports', { params });
      setReport(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, year]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setYear(new Date().getFullYear());
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Detailed breakdown of historical trends and payment methods</p>
        </div>
      </div>

      {/* Date Range & Year Filter Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
          <Filter className="w-4 h-4 text-indigo-600" /> Filter Interval:
        </div>

        <select
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value));
            setStartDate('');
            setEndDate('');
          }}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>Year {y}</option>
          ))}
        </select>

        <span className="text-xs text-slate-400 font-semibold uppercase">Or custom range</span>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {(startDate || endDate) && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Reset
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Period Income</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">${report?.totalIncome.toFixed(2)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Period Expenses</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">${report?.totalExpense.toFixed(2)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Net Savings</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">${report?.netSavings.toFixed(2)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Savings Rate</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{report?.savingsRate}%</p>
        </div>
      </div>

      {/* Monthly Trend Line Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Cash Trends & Savings</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report?.monthlyTrends || []}>
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip
                formatter={(val) => `$${Number(val).toLocaleString()}`}
                contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Expense" />
              <Line type="monotone" dataKey="savings" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" name="Net Savings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split Tables: Category Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expenses Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">Expenses by Category</h2>
          <div className="divide-y divide-slate-100">
            {report?.categoryBreakdown?.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No expense items found.</p>
            ) : (
              report?.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                    <span className="text-xs text-slate-400 font-medium">({cat.count} txns)</span>
                  </div>
                  <span className="font-bold text-slate-800">${cat.totalAmount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">Expenses by Payment Method</h2>
          <div className="divide-y divide-slate-100">
            {report?.paymentMethodBreakdown?.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No payment data found.</p>
            ) : (
              report?.paymentMethodBreakdown.map((pm, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{pm._id}</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">${pm.total.toFixed(2)}</span>
                    <span className="block text-xs text-slate-400">({pm.count} txns)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}