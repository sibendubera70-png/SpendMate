import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.get("/", (req, res) => {
  res.json({
    message: "SpendMate AI server is running",
  });
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authorization token is required.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid or expired token.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      error: "Authentication failed.",
    });
  }
};

// AI chat route
app.post("/api/ai/chat", authenticateUser, async (req, res) => {
  try {
    const { message, financialSummary } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "A valid message is required.",
      });
    }

    const safeSummary =
      financialSummary && typeof financialSummary === "object"
        ? financialSummary
        : {
            totalTransactions: 0,
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0,
            categoryWiseExpenses: {},
            recentTransactions: [],
          };

    const systemPrompt = `
You are SpendMate AI, a personal finance assistant.

User ID: ${req.user.id}

Rules:
- Give clear, practical, beginner-friendly explanations.
- Use Indian Rupees (₹) when discussing amounts.
- Analyze only the financial summary provided below.
- Do not invent transactions or financial figures.
- If the data is insufficient, clearly say so.
- Do not provide guaranteed investment returns.
- Do not claim to be a professional financial advisor.
- Keep responses concise and useful.
- Never request passwords, API keys, or sensitive credentials.

Financial summary:
${JSON.stringify(safeSummary, null, 2)}
`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message.trim(),
        },
      ],
      temperature: 0.4,
      max_tokens: 700,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response.";

    return res.json({ reply });
  } catch (error) {
    console.error("Groq API error:", error.message);

    return res.status(500).json({
      error: "Failed to generate AI response.",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SpendMate AI server running on port ${PORT}`);
});