import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "../lib/supabase";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const getCurrentMonth = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

export default function Insights() {
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, [selectedMonth]);

  async function fetchTransactions() {
    try {
      setLoading(true);
      setError("");

      const monthStart = `${selectedMonth}-01`;

      const nextMonthDate = new Date(`${monthStart}T00:00:00`);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

      const nextMonth = `${nextMonthDate.getFullYear()}-${String(
        nextMonthDate.getMonth() + 1
      ).padStart(2, "0")}-01`;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in first.");
        return;
      }

      const { data, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .gte("transaction_date", monthStart)
        .lt("transaction_date", nextMonth)
        .order("transaction_date", { ascending: true });

      if (transactionError) throw transactionError;

      setTransactions(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load insights.");
    } finally {
      setLoading(false);
    }
  }

  const expenses = useMemo(
    () => transactions.filter((item) => item.type === "expense"),
    [transactions]
  );

  const income = useMemo(
    () => transactions.filter((item) => item.type === "income"),
    [transactions]
  );

  const totalIncome = income.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const balance = totalIncome - totalExpenses;

  const categoryData = useMemo(() => {
    const categoryTotals = {};

    expenses.forEach((transaction) => {
      const category = transaction.category || "Other";

      categoryTotals[category] =
        (categoryTotals[category] || 0) + Number(transaction.amount);
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const highestCategory = categoryData[0];

  const dailyData = useMemo(() => {
    const dailyTotals = {};

    expenses.forEach((transaction) => {
      const date = transaction.transaction_date;

      dailyTotals[date] =
        (dailyTotals[date] || 0) + Number(transaction.amount);
    });

    return Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        date,
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [expenses]);

  function getFinancialTip() {
    if (totalExpenses === 0) {
      return "You have no recorded expenses this month. Start tracking your spending to understand your financial habits.";
    }

    if (totalIncome === 0) {
      return "No income has been recorded. Add your income entries to calculate your savings rate.";
    }

    if (totalExpenses > totalIncome) {
      return "Your expenses are higher than your income. Review your largest spending categories and consider reducing non-essential expenses.";
    }

    if (totalExpenses > totalIncome * 0.8) {
      return "You are spending more than 80% of your income. Try setting category-wise budgets and keeping an emergency fund.";
    }

    if (highestCategory) {
      return `Your highest spending category is ${highestCategory.category}. Review this category to find possible savings.`;
    }

    return "Keep tracking your income and expenses regularly to improve your financial awareness.";
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold">
              <BarChart3 className="text-emerald-400" />
              Financial Insights
            </h1>

            <p className="mt-2 text-slate-400">
              Understand your spending habits and financial performance.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
            />

            <button
              onClick={fetchTransactions}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 hover:bg-slate-800"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            Loading insights...
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="mb-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400">Total Income</p>
                  <TrendingUp className="text-emerald-400" />
                </div>

                <h2 className="mt-3 text-3xl font-bold text-emerald-400">
                  ₹{totalIncome.toFixed(2)}
                </h2>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400">Total Expenses</p>
                  <TrendingDown className="text-red-400" />
                </div>

                <h2 className="mt-3 text-3xl font-bold text-red-400">
                  ₹{totalExpenses.toFixed(2)}
                </h2>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400">Net Balance</p>
                  <Wallet className="text-blue-400" />
                </div>

                <h2
                  className={`mt-3 text-3xl font-bold ${
                    balance >= 0 ? "text-blue-400" : "text-red-400"
                  }`}
                >
                  ₹{balance.toFixed(2)}
                </h2>
              </div>
            </div>

            {/* Highest Category */}
            <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-2 text-xl font-semibold">
                Highest Spending Category
              </h2>

              {highestCategory ? (
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-2xl font-bold text-orange-400">
                    {highestCategory.category}
                  </p>

                  <p className="text-lg text-slate-300">
                    ₹{highestCategory.amount.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400">
                  No expense data available for this month.
                </p>
              )}
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-5 text-xl font-semibold">
                  Spending by Category
                </h2>

                {categoryData.length === 0 ? (
                  <p className="py-16 text-center text-slate-400">
                    No category data available.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={entry.category}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) => `₹${Number(value).toFixed(2)}`}
                      />

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-5 text-xl font-semibold">
                  Daily Spending
                </h2>

                {dailyData.length === 0 ? (
                  <p className="py-16 text-center text-slate-400">
                    No daily spending data available.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                      <XAxis dataKey="date" stroke="#94a3b8" />

                      <YAxis stroke="#94a3b8" />

                      <Tooltip
                        formatter={(value) => `₹${Number(value).toFixed(2)}`}
                      />

                      <Bar dataKey="amount" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Financial Tip */}
            <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <div className="flex items-start gap-3">
                <Lightbulb
                  className="mt-1 shrink-0 text-yellow-400"
                  size={24}
                />

                <div>
                  <h2 className="text-xl font-semibold text-emerald-300">
                    Financial Tip
                  </h2>

                  <p className="mt-2 leading-7 text-slate-300">
                    {getFinancialTip()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}