import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  LogOut,
  BarChart3,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { supabase } from "../lib/supabase";
import AddTransaction from "../components/AddTransaction";

export default function Dashboard() {
  const navigate = useNavigate();

  const animationStyles = `
    @keyframes spendmate-fade-up {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spendmate-scale-in {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .spendmate-fade-up { animation: spendmate-fade-up 0.55s ease-out both; }
    .spendmate-scale-in { animation: spendmate-scale-in 0.45s ease-out both; }
    .spendmate-delay-1 { animation-delay: 80ms; }
    .spendmate-delay-2 { animation-delay: 160ms; }
    .spendmate-delay-3 { animation-delay: 240ms; }
    .spendmate-delay-4 { animation-delay: 320ms; }
    @media (prefers-reduced-motion: reduce) {
      .spendmate-fade-up, .spendmate-scale-in { animation: none !important; }
    }
  `;

  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // --------------------------------------------------
  // Get logged-in user
  // --------------------------------------------------

  useEffect(() => {
    const initializeDashboard = async () => {
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !currentUser) {
        setErrorMessage("Please log in to view your dashboard.");
        setLoading(false);
        return;
      }

      setUser(currentUser);
      await fetchTransactions();
    };

    initializeDashboard();
  }, []);

  // --------------------------------------------------
  // Fetch transactions
  // --------------------------------------------------

  const fetchTransactions = async (showLoader = false) => {
    try {
      if (showLoader) {
        setRefreshing(true);
      }

      setErrorMessage("");

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        throw new Error("User is not logged in.");
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("transaction_date", { ascending: false });

      if (error) {
        throw error;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error("Fetch transactions error:", error);
      setErrorMessage(error.message || "Unable to load transactions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --------------------------------------------------
  // Filter transactions by selected month
  // --------------------------------------------------

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate =
        transaction.transaction_date || transaction.created_at;

      return transactionDate?.slice(0, 7) === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // --------------------------------------------------
  // Monthly calculations
  // --------------------------------------------------

  const totalIncome = useMemo(() => {
    return monthlyTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  }, [monthlyTransactions]);

  const totalExpenses = useMemo(() => {
    return monthlyTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  }, [monthlyTransactions]);

  const totalBalance = totalIncome - totalExpenses;

  const transactionCount = monthlyTransactions.length;

  // --------------------------------------------------
  // Category-wise expense data
  // --------------------------------------------------

  const categoryData = useMemo(() => {
    const categoryTotals = {};

    monthlyTransactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        const category = transaction.category?.trim() || "Other";

        categoryTotals[category] =
          (categoryTotals[category] || 0) + Number(transaction.amount || 0);
      });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [monthlyTransactions]);

  // --------------------------------------------------
  // Weekly spending data
  // --------------------------------------------------

  const weeklyData = useMemo(() => {
    const weeks = {
      "Week 1": 0,
      "Week 2": 0,
      "Week 3": 0,
      "Week 4": 0,
      "Week 5": 0,
    };

    monthlyTransactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        const date = new Date(transaction.transaction_date);
        const day = date.getDate();

        let weekName = "Week 1";

        if (day >= 8 && day <= 14) {
          weekName = "Week 2";
        } else if (day >= 15 && day <= 21) {
          weekName = "Week 3";
        } else if (day >= 22 && day <= 28) {
          weekName = "Week 4";
        } else if (day >= 29) {
          weekName = "Week 5";
        }

        weeks[weekName] += Number(transaction.amount || 0);
      });

    return Object.entries(weeks).map(([week, amount]) => ({
      week,
      amount,
    }));
  }, [monthlyTransactions]);

  // --------------------------------------------------
  // Income vs expense chart
  // --------------------------------------------------

  const incomeExpenseData = [
    {
      name: "Selected Month",
      Income: totalIncome,
      Expenses: totalExpenses,
    },
  ];

  // --------------------------------------------------
  // Currency formatter
  // --------------------------------------------------

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  // --------------------------------------------------
  // Delete transaction
  // --------------------------------------------------

  const handleDeleteTransaction = async (transactionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    try {
      setErrorMessage("");

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (error) {
        throw error;
      }

      await fetchTransactions(true);
    } catch (error) {
      console.error("Delete transaction error:", error);
      setErrorMessage(`Delete failed: ${error.message}`);
    }
  };

  // --------------------------------------------------
  // Open edit modal
  // --------------------------------------------------

  const handleEditClick = (transaction) => {
    setEditingTransaction({
      id: transaction.id,
      title: transaction.title || "",
      amount: transaction.amount || "",
      type: transaction.type || "expense",
      category: transaction.category || "",
      description: transaction.description || "",
      transaction_date:
        transaction.transaction_date ||
        new Date().toISOString().split("T")[0],
    });
  };

  // --------------------------------------------------
  // Update transaction
  // --------------------------------------------------

  const handleUpdateTransaction = async (event) => {
    event.preventDefault();

    if (!editingTransaction.title.trim()) {
      setErrorMessage("Please enter a transaction title.");
      return;
    }

    if (
      !editingTransaction.amount ||
      Number(editingTransaction.amount) <= 0
    ) {
      setErrorMessage("Please enter a valid amount.");
      return;
    }

    try {
      setEditLoading(true);
      setErrorMessage("");

      const updatedData = {
        title: editingTransaction.title.trim(),
        amount: Number(editingTransaction.amount),
        type: editingTransaction.type,
        category: editingTransaction.category.trim(),
        description: editingTransaction.description.trim(),
        transaction_date: editingTransaction.transaction_date,
      };

      const { error } = await supabase
        .from("transactions")
        .update(updatedData)
        .eq("id", editingTransaction.id);

      if (error) {
        throw error;
      }

      setEditingTransaction(null);
      await fetchTransactions(true);
    } catch (error) {
      console.error("Update transaction error:", error);
      setErrorMessage(`Update failed: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // --------------------------------------------------
  // Chart colors
  // --------------------------------------------------

  const chartColors = [
    "#06b6d4",
    "#8b5cf6",
    "#22c55e",
    "#f97316",
    "#eab308",
    "#ec4899",
    "#3b82f6",
    "#ef4444",
  ];

  // --------------------------------------------------
  // Render dashboard
  // --------------------------------------------------

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="spendmate-fade-up flex flex-col gap-4 border-b border-slate-800 bg-slate-900 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">SpendMate</h1>

          <p className="mt-1 text-sm text-slate-400">
            Welcome back, {user?.email?.split("@")[0] || "User"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fetchTransactions(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 transition hover:bg-red-700"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto spendmate-fade-up max-w-7xl space-y-8 p-4 sm:p-6">
        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            <AlertCircle size={20} />
            <p>{errorMessage}</p>

            <button
              onClick={() => setErrorMessage("")}
              className="ml-auto rounded p-1 hover:bg-red-500/20"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Month selector */}
        <section className="spendmate-scale-in flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="text-cyan-400" />
              <h2 className="text-xl font-semibold">Monthly Analytics</h2>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Analyze your income and expenses by month.
            </p>
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </section>

        {/* Quick Actions */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 spendmate-fade-up">
          <button
            type="button"
            onClick={() => navigate("/budget")}
            className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600 text-left transition hover:-translate-y-1 hover:border-cyan-500 hover:bg-slate-800"
          >
            <div className="mb-3 flex items-center justify-between">
              <PiggyBank className="text-cyan-400" size={28} />
              <ArrowUpRight
                className="text-slate-500 transition group-hover:text-cyan-400"
                size={20}
              />
            </div>
            <h3 className="text-lg font-semibold">Manage Budgets</h3>
            <p className="mt-1 text-sm text-slate-400">
              Set monthly budgets and track your spending limits.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/insights")}
            className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600 text-left transition hover:-translate-y-1 hover:border-purple-500 hover:bg-slate-800"
          >
            <div className="mb-3 flex items-center justify-between">
              <BarChart3 className="text-purple-400" size={28} />
              <ArrowUpRight
                className="text-slate-500 transition group-hover:text-purple-400"
                size={20}
              />
            </div>
            <h3 className="text-lg font-semibold">View Insights</h3>
            <p className="mt-1 text-sm text-slate-400">
              Explore detailed financial reports and spending patterns.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/recurring")}
            className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600 text-left transition hover:-translate-y-1 hover:border-green-500 hover:bg-slate-800 sm:col-span-2 lg:col-span-1"
          >
            <div className="mb-3 flex items-center justify-between">
              <RefreshCw className="text-green-400" size={28} />
              <ArrowUpRight
                className="text-slate-500 transition group-hover:text-green-400"
                size={20}
              />
            </div>
            <h3 className="text-lg font-semibold">Recurring Transactions</h3>
            <p className="mt-1 text-sm text-slate-400">
              Manage your regular income and expense entries.
            </p>
          </button>
        </section>

        {/* Statistics cards */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 spendmate-fade-up">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-slate-400">Monthly Balance</p>
              <Wallet className="text-cyan-400" />
            </div>

            <h2 className="text-3xl font-bold">
              {formatCurrency(totalBalance)}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Income minus expenses
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-slate-400">Monthly Income</p>
              <ArrowUpRight className="text-green-400" />
            </div>

            <h2 className="text-3xl font-bold text-green-400">
              {formatCurrency(totalIncome)}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Total money received
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-slate-400">Monthly Expenses</p>
              <ArrowDownRight className="text-red-400" />
            </div>

            <h2 className="text-3xl font-bold text-red-400">
              {formatCurrency(totalExpenses)}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Total money spent
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-slate-400">Transactions</p>
              <PiggyBank className="text-purple-400" />
            </div>

            <h2 className="text-3xl font-bold text-purple-400">
              {transactionCount}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Transactions this month
            </p>
          </div>
        </section>

        {/* Add transaction */}
        <section className="spendmate-fade-up rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:border-slate-700">
          <div className="mb-5 flex items-center gap-3">
            <Plus className="text-cyan-400" />
            <h2 className="text-xl font-semibold">Add Transaction</h2>
          </div>

          <AddTransaction
            onTransactionAdded={() => fetchTransactions(true)}
          />
        </section>

        {/* Income and expense chart */}
        <section className="spendmate-fade-up rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:border-slate-700">
          <div className="mb-6 flex items-center gap-3">
            <BarChart3 className="text-cyan-400" />
            <h2 className="text-xl font-semibold">
              Income vs Expenses
            </h2>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpenseData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />

                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />

                <Legend />

                <Bar dataKey="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="Expenses"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Category-wise chart */}
        <section className="spendmate-fade-up rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:border-slate-700">
          <h2 className="mb-6 text-xl font-semibold">
            Category-wise Expenses
          </h2>

          {categoryData.length === 0 ? (
            <p className="py-10 text-center text-slate-400">
              No expense data available for this month.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {categoryData.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between rounded-lg bg-slate-800 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            chartColors[index % chartColors.length],
                        }}
                      />

                      <span>{category.name}</span>
                    </div>

                    <span className="font-semibold text-red-400">
                      {formatCurrency(category.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Weekly spending insights */}
        <section className="spendmate-fade-up rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:border-slate-700">
          <h2 className="mb-6 text-xl font-semibold">
            Weekly Spending Insights
          </h2>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />

                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Weekly Spending"
                  stroke="#f97316"
                  strokeWidth={3}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 rounded-xl bg-slate-800 p-4">
            <p className="text-sm text-slate-300">
              {totalExpenses === 0
                ? "No expenses recorded for this month."
                : totalExpenses > totalIncome && totalIncome > 0
                ? "Your expenses are higher than your income this month. Consider reviewing your spending."
                : "Review your weekly spending to identify areas where you can save money."}
            </p>
          </div>
        </section>

        {/* Recent transactions */}
        <section className="spendmate-fade-up rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:border-slate-700">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Transactions for Selected Month
            </h2>

            <button
              onClick={() => fetchTransactions(true)}
              disabled={refreshing}
              className="rounded-lg bg-slate-800 p-2 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw
                size={20}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>

          {loading ? (
            <p className="text-slate-400">Loading transactions...</p>
          ) : monthlyTransactions.length === 0 ? (
            <p className="py-8 text-center text-slate-400">
              No transactions found for this month.
            </p>
          ) : (
            <div className="space-y-3">
              {monthlyTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">
                      {transaction.title}
                    </h3>

                    <p className="text-sm text-slate-400">
                      {transaction.category || "General"} •{" "}
                      {transaction.transaction_date}
                    </p>

                    {transaction.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p
                      className={`font-bold ${
                        transaction.type === "income"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>

                    <button
                      onClick={() => handleEditClick(transaction)}
                      className="rounded-lg bg-blue-600 p-2 transition hover:bg-blue-700"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteTransaction(transaction.id)
                      }
                      className="rounded-lg bg-red-600 p-2 transition hover:bg-red-700"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Edit modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Transaction</h2>

              <button
                onClick={() => setEditingTransaction(null)}
                className="rounded-lg p-2 hover:bg-slate-800"
              >
                <X />
              </button>
            </div>

            <form
              onSubmit={handleUpdateTransaction}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Title"
                value={editingTransaction.title}
                onChange={(event) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    title: event.target.value,
                  })
                }
                className="w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-cyan-400"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={editingTransaction.amount}
                onChange={(event) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    amount: event.target.value,
                  })
                }
                className="w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-cyan-400"
              />

              <select
                value={editingTransaction.type}
                onChange={(event) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    type: event.target.value,
                  })
                }
                className="w-full rounded-lg bg-slate-800 p-3 outline-none"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>

              <input
                type="text"
                placeholder="Category"
                value={editingTransaction.category}
                onChange={(event) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    category: event.target.value,
                  })
                }
                className="w-full rounded-lg bg-slate-800 p-3 outline-none"
              />

              <input
                type="date"
                value={editingTransaction.transaction_date}
                onChange={(event) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    transaction_date: event.target.value,
                  })
                }
                className="w-full rounded-lg bg-slate-800 p-3 outline-none"
              />

              <textarea
                placeholder="Description"
                value={editingTransaction.description}
                onChange={(event) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    description: event.target.value,
                  })
                }
                rows="3"
                className="w-full rounded-lg bg-slate-800 p-3 outline-none"
              />

              <button
                type="submit"
                disabled={editLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 p-3 font-semibold transition hover:bg-cyan-700 disabled:opacity-50"
              >
                <Save size={18} />

                {editLoading ? "Updating..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}