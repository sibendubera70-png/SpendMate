import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

const getCurrentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthDate = (month) => `${month}-01`;

export default function Budget() {
  const [user, setUser] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [formData, setFormData] = useState({
    category: "Food",
    amount: "",
  });

  useEffect(() => {
    loadUserAndData();
  }, [selectedMonth]);

  async function loadUserAndData() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setError("Please log in first.");
        return;
      }

      setUser(user);

      const monthStart = `${selectedMonth}-01`;
      const nextMonthDate = new Date(`${selectedMonth}-01T00:00:00`);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

      const nextMonth = `${nextMonthDate.getFullYear()}-${String(
        nextMonthDate.getMonth() + 1
      ).padStart(2, "0")}-01`;

      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", monthStart)
        .order("created_at", { ascending: false });

      if (budgetError) throw budgetError;

      const { data: transactionData, error: transactionError } =
        await supabase
          .from("transactions")
          .select("*")
          .gte("transaction_date", monthStart)
          .lt("transaction_date", nextMonth)
          .eq("type", "expense");

      if (transactionError) throw transactionError;

      setBudgets(budgetData || []);
      setTransactions(transactionData || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load budget data.");
    } finally {
      setLoading(false);
    }
  }

  function getSpentAmount(category) {
    return transactions
      .filter(
        (transaction) =>
          transaction.category?.toLowerCase() === category.toLowerCase()
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  }

  function openCreateForm() {
    setEditingBudget(null);
    setFormData({
      category: "Food",
      amount: "",
    });
    setShowForm(true);
  }

  function openEditForm(budget) {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount,
    });
    setShowForm(true);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Please enter a valid budget amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const budgetPayload = {
        category: formData.category,
        amount: Number(formData.amount),
        month: getMonthDate(selectedMonth),
      };

      if (editingBudget) {
        const { error: updateError } = await supabase
          .from("budgets")
          .update(budgetPayload)
          .eq("id", editingBudget.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("budgets").insert([
          {
            ...budgetPayload,
            user_id: user.id,
          },
        ]);

        if (insertError) throw insertError;
      }

      setShowForm(false);
      setEditingBudget(null);
      setFormData({
        category: "Food",
        amount: "",
      });

      await loadUserAndData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBudget(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const { error: deleteError } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setBudgets((previous) => previous.filter((budget) => budget.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete budget.");
    }
  }

  const totalBudget = useMemo(() => {
    return budgets.reduce((total, budget) => total + Number(budget.amount), 0);
  }, [budgets]);

  const totalSpent = useMemo(() => {
    return transactions.reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );
  }, [transactions]);

  const remainingBudget = totalBudget - totalSpent;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold">
              <Wallet className="text-emerald-400" />
              Budget Management
            </h1>

            <p className="mt-2 text-slate-400">
              Set monthly spending limits and track your expenses.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
            />

            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
            >
              <Plus size={18} />
              Add Budget
            </button>

            <button
              onClick={loadUserAndData}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 transition hover:bg-slate-800"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Budget</p>
            <h2 className="mt-2 text-3xl font-bold text-emerald-400">
              ₹{totalBudget.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Spent</p>
            <h2 className="mt-2 text-3xl font-bold text-orange-400">
              ₹{totalSpent.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Remaining Budget</p>
            <h2
              className={`mt-2 text-3xl font-bold ${
                remainingBudget < 0
                  ? "text-red-400"
                  : "text-blue-400"
              }`}
            >
              ₹{remainingBudget.toFixed(2)}
            </h2>
          </div>
        </div>

        {/* Budget Cards */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            Loading budgets...
          </div>
        ) : budgets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
            <Wallet className="mx-auto mb-4 text-slate-500" size={42} />
            <h2 className="text-xl font-semibold">No budgets yet</h2>
            <p className="mt-2 text-slate-400">
              Create your first budget for this month.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {budgets.map((budget) => {
              const budgetAmount = Number(budget.amount);
              const spentAmount = getSpentAmount(budget.category);
              const percentage =
                budgetAmount > 0
                  ? Math.min((spentAmount / budgetAmount) * 100, 100)
                  : 0;

              const exceeded = spentAmount > budgetAmount;
              const almostExceeded =
                spentAmount >= budgetAmount * 0.8 && !exceeded;

              return (
                <div
                  key={budget.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {budget.category}
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        Monthly limit: ₹{budgetAmount.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(budget)}
                        className="rounded-lg p-2 text-blue-400 transition hover:bg-blue-400/10"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => deleteBudget(budget.id)}
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-400/10"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3 flex justify-between text-sm">
                    <span className="text-slate-400">Spent</span>
                    <span className="font-semibold">
                      ₹{spentAmount.toFixed(2)} / ₹{budgetAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        exceeded
                          ? "bg-red-500"
                          : almostExceeded
                          ? "bg-yellow-400"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm">
                    {exceeded ? (
                      <>
                        <AlertTriangle size={18} className="text-red-400" />
                        <span className="text-red-400">
                          Budget exceeded by ₹
                          {(spentAmount - budgetAmount).toFixed(2)}
                        </span>
                      </>
                    ) : almostExceeded ? (
                      <>
                        <AlertTriangle
                          size={18}
                          className="text-yellow-400"
                        />
                        <span className="text-yellow-400">
                          You are close to your budget limit.
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle
                          size={18}
                          className="text-emerald-400"
                        />
                        <span className="text-emerald-400">
                          ₹{(budgetAmount - spentAmount).toFixed(2)} remaining
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">
              {editingBudget ? "Edit Budget" : "Create Budget"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Category
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Budget Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold hover:bg-emerald-600 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingBudget
                    ? "Update Budget"
                    : "Create Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}