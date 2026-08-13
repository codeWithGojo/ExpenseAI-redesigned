const express = require("express");
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// List (with optional search/category filter)
router.get("/", async (req, res) => {
  const { search, category } = req.query;
  const expenses = await prisma.expense.findMany({
    where: {
      userId: req.userId,
      ...(category ? { category } : {}),
      ...(search ? { note: { contains: search } } : {}),
    },
    orderBy: { date: "desc" },
  });
  res.json(expenses);
});

router.post("/", async (req, res) => {
  const { amount, category, note, date } = req.body;
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !String(category || "").trim()) {
    return res.status(400).json({ error: "amount and category are required" });
  }
  if (date && Number.isNaN(Date.parse(date))) return res.status(400).json({ error: "date must be valid" });
  const expense = await prisma.expense.create({
    data: {
      amount: parsedAmount,
      category: String(category).trim(),
      note: note ? String(note).trim().slice(0, 500) : null,
      date: date ? new Date(date) : undefined,
      userId: req.userId,
    },
  });
  res.status(201).json(expense);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ error: "Expense not found" });
  }
  const { amount, category, note, date } = req.body;
  if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) return res.status(400).json({ error: "amount must be greater than zero" });
  if (category !== undefined && !String(category).trim()) return res.status(400).json({ error: "category is required" });
  if (date !== undefined && Number.isNaN(Date.parse(date))) return res.status(400).json({ error: "date must be valid" });
  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(amount !== undefined ? { amount: Number(amount) } : {}),
      ...(category !== undefined ? { category: String(category).trim() } : {}),
      ...(note !== undefined ? { note: note ? String(note).trim().slice(0, 500) : null } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
    },
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ error: "Expense not found" });
  }
  await prisma.expense.delete({ where: { id } });
  res.status(204).send();
});

module.exports = router;
