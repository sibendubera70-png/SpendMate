import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const API_URL = "http://localhost:5000/api/ai/chat";

const suggestions = [
  "Where am I spending the most money?",
  "How can I reduce my expenses?",
  "Analyze my financial situation.",
  "How can I save more money?",
];

function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm SpendMate AI. I can analyze your transactions and help you improve your financial habits. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);

  // Fetch logged-in user and transaction data
  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoadingData(true);
        setError("");

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          throw new Error("Please log in first.");
        }

        setUser(currentUser);

        const { data: transactions, error: transactionError } =
          await supabase
            .from("transactions")
            .select(
              "title, amount, type, category, transaction_date, description"
            )
            .eq("user_id", currentUser.id)
            .order("transaction_date", { ascending: false });

        if (transactionError) {
          throw transactionError;
        }

        const safeTransactions = transactions || [];

        let totalIncome = 0;
        let totalExpenses = 0;

        const categoryWiseExpenses = {};

        safeTransactions.forEach((transaction) => {
          const amount = Number(transaction.amount) || 0;

          if (transaction.type === "income") {
            totalIncome += amount;
          } else if (transaction.type === "expense") {
            totalExpenses += amount;

            const category = transaction.category || "Other";

            categoryWiseExpenses[category] =
              (categoryWiseExpenses[category] || 0) + amount;
          }
        });

        const summary = {
          totalTransactions: safeTransactions.length,
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          categoryWiseExpenses,
          recentTransactions: safeTransactions.slice(0, 30),
        };

        setFinancialSummary(summary);
      } catch (err) {
        console.error("Financial data error:", err);
        setError(err.message || "Failed to load financial data.");
      } finally {
        setLoadingData(false);
      }
    };

    loadFinancialData();
  }, []);

  // Send message to AI backend
  const sendMessage = async (messageText) => {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    if (!user || !financialSummary) {
      setError("Your financial data is still loading. Please try again.");
      return;
    }

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        role: "user",
        content: trimmedMessage,
      },
    ]);

    setInput("");
    setLoading(true);
    setError("");

    try {
      // Get the current Supabase session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.access_token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: trimmedMessage,
          financialSummary,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get an AI response.");
      }

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content:
            result.reply || "Sorry, I could not generate a response.",
        },
      ]);
    } catch (err) {
      console.error("AI request error:", err);

      setError(err.message || "Something went wrong.");

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Header */}
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl">
              🤖
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                SpendMate AI
              </h1>

              <p className="text-sm text-slate-400">
                Your personal financial assistant
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
              ● AI Assistant
            </span>

            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300">
              {loadingData
                ? "Loading transaction data..."
                : "✓ Connected to your transaction data"}
            </span>
          </div>
        </div>

        {/* Financial Summary */}
        {!loadingData && financialSummary && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Total income</p>
              <h2 className="mt-1 text-xl font-bold text-emerald-400">
                ₹{financialSummary.totalIncome.toFixed(2)}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Total expenses</p>
              <h2 className="mt-1 text-xl font-bold text-red-400">
                ₹{financialSummary.totalExpenses.toFixed(2)}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Balance</p>
              <h2
                className={`mt-1 text-xl font-bold ${
                  financialSummary.balance >= 0
                    ? "text-blue-400"
                    : "text-red-400"
                }`}
              >
                ₹{financialSummary.balance.toFixed(2)}
              </h2>
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Try asking
          </h2>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={loading || loadingData}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex min-h-[450px] flex-col rounded-3xl border border-slate-800 bg-slate-900">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                    message.role === "user"
                      ? "rounded-br-md bg-emerald-500 text-slate-950"
                      : "rounded-bl-md bg-slate-800 text-slate-200"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-slate-800 px-4 py-3 text-sm text-slate-400">
                  SpendMate AI is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 sm:mx-6">
              {error}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-800 p-4 sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  loadingData
                    ? "Loading your financial data..."
                    : "Ask SpendMate AI something..."
                }
                disabled={loading || loadingData}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={
                  loading || loadingData || !input.trim() || !user
                }
                className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Your AI assistant uses your saved transaction summary to provide
              personalized guidance.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;