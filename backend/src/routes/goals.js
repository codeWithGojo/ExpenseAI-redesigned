const express = require("express");
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const goals = await prisma.goal.findMany({ where: { userId: req.userId } });
  res.json(goals);
});

router.post("/", async (req, res) => {
  const { title, targetAmount, deadline } = req.body;
  const parsedTarget = Number(targetAmount);
  if (!String(title || "").trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) {
    return res.status(400).json({ error: "title and targetAmount are required" });
  }
  if (deadline && Number.isNaN(Date.parse(deadline))) return res.status(400).json({ error: "deadline must be valid" });
  const goal = await prisma.goal.create({
    data: {
      title: String(title).trim(),
      targetAmount: parsedTarget,
      deadline: deadline ? new Date(deadline) : undefined,
      userId: req.userId,
    },
  });
  res.status(201).json(goal);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ error: "Goal not found" });
  }
  const { savedAmount, title, targetAmount, deadline } = req.body;
  if (savedAmount !== undefined && (!Number.isFinite(Number(savedAmount)) || Number(savedAmount) < 0)) return res.status(400).json({ error: "savedAmount cannot be negative" });
  if (targetAmount !== undefined && (!Number.isFinite(Number(targetAmount)) || Number(targetAmount) <= 0)) return res.status(400).json({ error: "targetAmount must be greater than zero" });
  if (title !== undefined && !String(title).trim()) return res.status(400).json({ error: "title is required" });
  if (deadline !== undefined && deadline && Number.isNaN(Date.parse(deadline))) return res.status(400).json({ error: "deadline must be valid" });
  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...(savedAmount !== undefined ? { savedAmount: Number(savedAmount) } : {}),
      ...(title !== undefined ? { title: String(title).trim() } : {}),
      ...(targetAmount !== undefined ? { targetAmount: Number(targetAmount) } : {}),
      ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
    },
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ error: "Goal not found" });
  }
  await prisma.goal.delete({ where: { id } });
  res.status(204).send();
});

module.exports = router;
