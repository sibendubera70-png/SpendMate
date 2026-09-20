import { useState } from "react";
import { supabase } from "../lib/supabase";

function AddTransaction({ onTransactionAdded }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title || !amount || Number(amount) <= 0) {
      setMessage("Please enter a valid title and amount.");
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        title,
        amount: Number(amount),
        type,
        category,
        description,
        transaction_date: date || new Date().toISOString().split("T")[0],
      },
    ]);

    if (error) {
      console.error("Transaction error:", error.message);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Transaction added successfully!");

    setTitle("");
    setAmount("");
    setDescription("");
    setDate("");

    if (onTransactionAdded) {
      onTransactionAdded();
    }

    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-emerald-950 bg-[#0b211c] p-6"
    >
      <h2 className="text-xl font-semibold text-white">
        Add Transaction
      </h2>

      <input
        type="text"
        placeholder="Transaction title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-xl border border-emerald-900 bg-[#081b17] p-3 text-white outline-none focus:border-emerald-500"
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        className="w-full rounded-xl border border-emerald-900 bg-[#081b17] p-3 text-white outline-none focus:border-emerald-500"
      />

      <select
        value={type}
        onChange={(event) => setType(event.target.value)}
        className="w-full rounded-xl border border-emerald-900 bg-[#081b17] p-3 text-white outline-none"
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>

      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="w-full rounded-xl border border-emerald-900 bg-[#081b17] p-3 text-white outline-none"
      >
        <option value="Food">Food</option>
        <option value="Transport">Transport</option>
        <option value="Shopping">Shopping</option>
        <option value="Bills">Bills</option>
        <option value="Education">Education</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Salary">Salary</option>
        <option value="Freelance">Freelance</option>
        <option value="Other">Other</option>
      </select>

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows="3"
        className="w-full rounded-xl border border-emerald-900 bg-[#081b17] p-3 text-white outline-none focus:border-emerald-500"
      />

      <input
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        className="w-full rounded-xl border border-emerald-900 bg-[#081b17] p-3 text-white outline-none"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 p-3 font-semibold text-[#061412] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Transaction"}
      </button>

      {message && (
        <p className="text-center text-sm text-emerald-400">{message}</p>
      )}
    </form>
  );
}

export default AddTransaction;