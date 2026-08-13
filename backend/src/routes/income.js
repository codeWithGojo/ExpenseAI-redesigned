const express = require("express");
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const incomes = await prisma.income.findMany({
    where: { userId: req.userId },
    orderBy: { date: "desc" },
  });
  res.json(incomes);
});

router.post("/", async (req, res) => {
  const { amount, source, date } = req.body;
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !String(source || "").trim()) {
    return res.status(400).json({ error: "amount and source are required" });
  }
  if (date && Number.isNaN(Date.parse(date))) return res.status(400).json({ error: "date must be valid" });
  const income = await prisma.income.create({
    data: {
      amount: parsedAmount,
      source: String(source).trim(),
      date: date ? new Date(date) : undefined,
      userId: req.userId,
    },
  });
  res.status(201).json(income);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.income.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ error: "Income not found" });
  }
  await prisma.income.delete({ where: { id } });
  res.status(204).send();
});

module.exports = router;
