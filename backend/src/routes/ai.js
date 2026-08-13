const express = require("express");
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Rule-based financial coach — works out of the box with zero external
// API keys. Swap the analyze() function for a call to an LLM provider
// (OpenAI, Anthropic, etc.) once you're ready to plug one in.
function analyze({ expenses, incomes, goals }) {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const balance = totalIncome - totalExpenses;

  const byCategory = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  const tips = [];

  if (totalIncome > 0 && totalExpenses > totalIncome * 0.9) {
    tips.push("You're spending over 90% of your income — consider cutting discretionary spend this month.");
  }
  if (topCategory) {
    const [category, amount] = topCategory;
    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
    tips.push(`"${category}" is your biggest expense category at ${pct}% of total spend.`);
  }
  for (const g of goals) {
    if (g.targetAmount > 0) {
      const pct = Math.round((g.savedAmount / g.targetAmount) * 100);
      if (pct < 100) {
        tips.push(`You're ${pct}% of the way to your "${g.title}" goal — keep going.`);
      }
    }
  }
  if (tips.length === 0) {
    tips.push("Add a few expenses and incomes so I can start giving you personalized tips.");
  }

  return { totalIncome, totalExpenses, balance, topCategory: topCategory?.[0] || null, tips };
}

router.get("/insights", async (req, res) => {
  const [expenses, incomes, goals] = await Promise.all([
    prisma.expense.findMany({ where: { userId: req.userId } }),
    prisma.income.findMany({ where: { userId: req.userId } }),
    prisma.goal.findMany({ where: { userId: req.userId } }),
  ]);
  res.json(analyze({ expenses, incomes, goals }));
});

// Simple chat-style endpoint. Currently rule-based; wire up a real LLM
// call here (see backend README section) when you're ready.
router.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!String(message || "").trim()) return res.status(400).json({ error: "message is required" });
  const [expenses, incomes, goals] = await Promise.all([
    prisma.expense.findMany({ where: { userId: req.userId } }),
    prisma.income.findMany({ where: { userId: req.userId } }),
    prisma.goal.findMany({ where: { userId: req.userId } }),
  ]);
  const insights = analyze({ expenses, incomes, goals });

  let reply;
  const lower = (message || "").toLowerCase();
  if (lower.includes("save") || lower.includes("goal")) {
    reply = insights.tips.find((t) => t.includes("goal")) || "Set a goal in the Goals tab and I'll track your progress toward it.";
  } else if (lower.includes("spend") || lower.includes("expense")) {
    reply = `You've spent ${insights.totalExpenses.toFixed(2)} total. ${insights.tips[0]}`;
  } else {
    reply = insights.tips.join(" ");
  }

  res.json({ reply });
});

module.exports = router;
