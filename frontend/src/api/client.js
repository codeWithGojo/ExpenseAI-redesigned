import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function fail(message, status = 400) {
  const error = new Error(message);
  error.response = { status, data: { error: message } };
  throw error;
}

function activeEmail() {
  const token = localStorage.getItem("token") || "";
  if (!token.startsWith("demo:")) fail("Please log in again.", 401);
  return token.slice(5);
}

function storeKey() {
  return `expenseai:demo-data:${activeEmail()}`;
}

function seedData(email) {
  if (email !== "demo@expenseai.app") return { expenses: [], incomes: [], goals: [] };
  return {
    expenses: [
      { id: "e1", amount: 18500, category: "Food & dining", note: "Groceries", date: new Date().toISOString() },
      { id: "e2", amount: 7200, category: "Transport", note: "Weekly transport", date: new Date(Date.now() - 86400000).toISOString() },
    ],
    incomes: [{ id: "i1", amount: 150000, source: "Freelance project", date: new Date().toISOString() }],
    goals: [{ id: "g1", title: "New laptop", targetAmount: 600000, savedAmount: 120000, deadline: null }],
  };
}

function getData() {
  const key = storeKey();
  const saved = read(key, null);
  if (saved) return saved;
  const seeded = seedData(activeEmail());
  write(key, seeded);
  return seeded;
}

function saveData(data) {
  write(storeKey(), data);
}

function insights(data) {
  const income = data.incomes.reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = data.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const rate = income ? Math.round(((income - expenses) / income) * 100) : 0;
  const tip = !income
    ? "Add your income first so ExpenseAI can calculate a useful savings rate."
    : rate >= 20
      ? `You are currently retaining about ${rate}% of recorded income — a strong savings position.`
      : `Your current savings rate is about ${rate}%. Review your largest spending category for an easy first improvement.`;
  return { tips: [tip], savingsRate: rate };
}

const demoApi = {
  async get(path) {
    const data = getData();
    if (path === "/expenses") return { data: data.expenses };
    if (path === "/income") return { data: data.incomes };
    if (path === "/goals") return { data: data.goals };
    if (path === "/ai/insights") return { data: insights(data) };
    fail("Unknown demo endpoint", 404);
  },

  async post(path, payload) {
    if (path === "/auth/register") {
      const email = String(payload.email || "").trim().toLowerCase();
      if (!payload.name?.trim() || !email || String(payload.password || "").length < 6) {
        fail("Enter your name, a valid email and a password of at least 6 characters.");
      }
      const users = read("expenseai:demo-users", {});
      if (users[email]) fail("An account with this email already exists.");
      users[email] = { name: payload.name.trim(), password: payload.password };
      write("expenseai:demo-users", users);
      return { data: { token: `demo:${email}` } };
    }

    if (path === "/auth/login") {
      const email = String(payload.email || "").trim().toLowerCase();
      const users = read("expenseai:demo-users", {});
      const isDemo = email === "demo@expenseai.app" && payload.password === "demo1234";
      if (!isDemo && users[email]?.password !== payload.password) fail("Incorrect email or password.", 401);
      return { data: { token: `demo:${email}` } };
    }

    const data = getData();
    const now = new Date().toISOString();
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
    if (path === "/expenses") data.expenses.unshift({ ...payload, id, amount: Number(payload.amount), date: now });
    else if (path === "/income") data.incomes.unshift({ ...payload, id, amount: Number(payload.amount), date: now });
    else if (path === "/goals") data.goals.unshift({ ...payload, id, targetAmount: Number(payload.targetAmount), savedAmount: 0, deadline: payload.deadline || null });
    else if (path === "/ai/chat") {
      const summary = insights(data);
      return { data: { reply: `${summary.tips[0]} This portfolio demo gives rule-based guidance and does not send your message to an external AI model.` } };
    } else fail("Unknown demo endpoint", 404);
    saveData(data);
    return { data: { ok: true } };
  },

  async delete(path) {
    const [, kind, id] = path.split("/");
    const data = getData();
    const key = kind === "income" ? "incomes" : kind;
    if (!Array.isArray(data[key])) fail("Unknown demo endpoint", 404);
    data[key] = data[key].filter((item) => item.id !== id);
    saveData(data);
    return { data: { ok: true } };
  },
};

const liveApi = axios.create({ baseURL: apiUrl || "/api" });

liveApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

liveApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("expenseai:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export default apiUrl ? liveApi : demoApi;
