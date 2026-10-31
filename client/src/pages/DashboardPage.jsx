import React, { useEffect, useState } from 'react';
import API from '../api/axiosInstance';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/dashboard/stats');
        setData(res.data.data);
      } catch (err) {
        setError('Failed to fetch dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
        {error}
      </div>
    );
  }

  const { summary, incomeVsExpenseData, categoryBreakdown, recentTransactions } = data;

  const statCards = [
    {
      title: 'Current Balance',
      amount: summary.currentBalance,
      icon: Wallet,
      color: 'bg-indigo-600 text-white',
      badge: 'Lifetime Net'
    },
    {
      title: 'Monthly Income',
      amount: summary.monthlyIncome,
      icon: TrendingUp,
      color: 'bg-emerald-500 text-white',
      badge: 'This Month'
    },
    {
      title: 'Monthly Expenses',
      amount: summary.monthlyExpenses,
      icon: TrendingDown,
      color: 'bg-rose-500 text-white',
      badge: 'This Month'
    },
    {
      title: 'Monthly Savings',
      amount: summary.monthlySavings,
      icon: PiggyBank,
      color: 'bg-blue-500 text-white',
      badge: 'Net Surplus'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of cash flow and expenses</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl shadow-sm self-start">
          <Calendar className="w-4 h-4 text-indigo-600" />
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2.5 rounded-xl ${card.color} shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">
                  ${Number(card.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
                <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {card.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Cash Flow History (Last 6 Months)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" name="Expense" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Donut */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Category Breakdown (This Month)</h2>
          {categoryBreakdown.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-slate-400">
              No expenses recorded this month
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => `$${Number(val).toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No recent transactions registered yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div key={tx._id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{tx.title}</h4>
                      <p className="text-xs text-slate-400">
                        {tx.category?.name || 'Uncategorized'} • {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {isIncome ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </p>
                    <span className="text-xs text-slate-400">{tx.paymentMethod}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}