import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Repeat,
  CalendarDays,
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
  "Salary",
  "Other",
];

const emptyForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "Food",
  frequency: "monthly",
  next_date: "",
  description: "",
};

export default function RecurringTransactions() {
  const [user, setUser] = useState(null);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecurringTransactions();
  }, []);

  async function fetchRecurringTransactions() {
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

      const { data, error: fetchError } = await supabase
        .from("recurring_transactions")
        .select("*")
        .order("next_date", { ascending: true });

      if (fetchError) throw fetchError;

      setRecurringTransactions(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load recurring transactions.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openCreateForm() {
    setEditingItem(null);

    setFormData({
      ...emptyForm,
      next_date: new Date().toISOString().split("T")[0],
    });

    setShowForm(true);
  }

  function openEditForm(item) {
    setEditingItem(item);

    setFormData({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      frequency: item.frequency,
      next_date: item.next_date,
      description: item.description || "",
    });

    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!formData.next_date) {
      setError("Please select the next payment date.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category,
        frequency: formData.frequency,
        next_date: formData.next_date,
        description: formData.description.trim(),
      };

      if (editingItem) {
        const { error: updateError } = await supabase
          .from("recurring_transactions")
          .update(payload)
          .eq("id", editingItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("recurring_transactions")
          .insert([
            {
              ...payload,
              user_id: user.id,
            },
          ]);

        if (insertError) throw insertError;
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData(emptyForm);

      await fetchRecurringTransactions();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save recurring transaction.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this recurring transaction?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const { error: deleteError } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setRecurringTransactions((previous) =>
        previous.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete recurring transaction.");
    }
  }

  function getDaysUntil(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(`${dateString}T00:00:00`);
    targetDate.setHours(0, 0, 0, 0);

    const difference = targetDate.getTime() - today.getTime();

    return Math.round(difference / (1000 * 60 * 60 * 24));
  }

  function getDateStatus(dateString) {
    const days = getDaysUntil(dateString);

    if (days < 0) {
      return {
        text: `${Math.abs(days)} day(s) overdue`,
        className: "text-red-400",
      };
    }

    if (days === 0) {
      return {
        text: "Due today",
        className: "text-yellow-400",
      };
    }

    if (days <= 7) {
      return {
        text: `Due in ${days} day(s)`,
        className: "text-yellow-400",
      };
    }

    return {
      text: `Due in ${days} day(s)`,
      className: "text-emerald-400",
    };
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold">
              <Repeat className="text-emerald-400" />
              Recurring Transactions
            </h1>

            <p className="mt-2 text-slate-400">
              Manage your recurring income and expenses.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchRecurringTransactions}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 hover:bg-slate-800"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold hover:bg-emerald-600"
            >
              <Plus size={18} />
              Add Recurring
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            Loading recurring transactions...
          </div>
        ) : recurringTransactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
            <Repeat
              size={44}
              className="mx-auto mb-4 text-slate-500"
            />

            <h2 className="text-xl font-semibold">
              No recurring transactions
            </h2>

            <p className="mt-2 text-slate-400">
              Add recurring bills, subscriptions, or regular income.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {recurringTransactions.map((item) => {
              const dateStatus = getDateStatus(item.next_date);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">{item.title}</h2>

                      <p className="mt-1 text-sm capitalize text-slate-400">
                        {item.frequency} • {item.category}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(item)}
                        className="rounded-lg p-2 text-blue-400 hover:bg-blue-400/10"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded-lg p-2 text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <p
                    className={`mt-5 text-2xl font-bold ${
                      item.type === "income"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {item.type === "income" ? "+" : "-"}₹
                    {Number(item.amount).toFixed(2)}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <CalendarDays size={17} />
                    Next date: {item.next_date}
                  </div>

                  <p className={`mt-2 text-sm ${dateStatus.className}`}>
                    {dateStatus.text}
                  </p>

                  {item.description && (
                    <p className="mt-3 text-sm text-slate-400">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">
              {editingItem
                ? "Edit Recurring Transaction"
                : "Add Recurring Transaction"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Title
                </label>

                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Netflix Subscription"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Amount
                  </label>

                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Type
                  </label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Category
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
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
                    Frequency
                  </label>

                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Next Payment Date
                </label>

                <input
                  type="date"
                  name="next_date"
                  value={formData.next_date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional description"
                  rows="3"
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-700 px-4 py-3 hover:bg-slate-800"
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
                    : editingItem
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}