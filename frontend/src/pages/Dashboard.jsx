import React, { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import api from "../api/client";

const COLORS = ["#1570ef", "#12b76a", "#f79009", "#7f56d9", "#f04438", "#06aed4"];
const cash = (value) => `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard({ onLogout }) {
  const [data, setData] = useState({ expenses: [], incomes: [], goals: [], insights: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("overview");
  const [expense, setExpense] = useState({ amount: "", category: "Food & dining", note: "" });
  const [income, setIncome] = useState({ amount: "", source: "" });
  const [goal, setGoal] = useState({ title: "", targetAmount: "", deadline: "" });
  const [chat, setChat] = useState("");
  const [reply, setReply] = useState("");

  async function load() {
    setError("");
    try {
      const [expenses, incomes, goals, insights] = await Promise.all([
        api.get("/expenses"), api.get("/income"), api.get("/goals"), api.get("/ai/insights"),
      ]);
      setData({ expenses: expenses.data, incomes: incomes.data, goals: goals.data, insights: insights.data });
    } catch (err) {
      setError(err.response?.data?.error || "We couldn't load your financial data. Please try again.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const expired = () => onLogout();
    window.addEventListener("expenseai:unauthorized", expired);
    return () => window.removeEventListener("expenseai:unauthorized", expired);
  }, [onLogout]);

  const summary = useMemo(() => {
    const incomeTotal = data.incomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const expenseTotal = data.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    return { income: incomeTotal, expenses: expenseTotal, balance: incomeTotal - expenseTotal };
  }, [data]);
  const chartData = useMemo(() => Object.entries(data.expenses.reduce((out, item) => {
    out[item.category] = (out[item.category] || 0) + Number(item.amount); return out;
  }, {})).map(([name, value]) => ({ name, value })), [data.expenses]);

  async function submit(kind, payload, clear) {
    setError("");
    try { await api.post(`/${kind}`, payload); clear(); setNotice("Saved successfully"); await load(); }
    catch (err) { setError(err.response?.data?.error || "That item could not be saved."); }
  }
  async function remove(kind, id) {
    try { await api.delete(`/${kind}/${id}`); setNotice("Removed successfully"); await load(); }
    catch (err) { setError(err.response?.data?.error || "That item could not be removed."); }
  }
  async function askAI(e) {
    e.preventDefault(); if (!chat.trim()) return;
    try { const response = await api.post("/ai/chat", { message: chat.trim() }); setReply(response.data.reply); setChat(""); }
    catch (err) { setError(err.response?.data?.error || "The coach is unavailable right now."); }
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";
  const button = "rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50";
  const cards = [
    ["Total balance", summary.balance, "Your current net position", "bg-blue-50 text-blue-700"],
    ["Total income", summary.income, "Across all recorded income", "bg-emerald-50 text-emerald-700"],
    ["Total expenses", summary.expenses, `${data.expenses.length} recorded transactions`, "bg-rose-50 text-rose-700"],
  ];
  const navigation = [["overview","Overview"],["transactions","Transactions"],["goals","Savings goals"],["coach","AI coach"]];
  const activeLabel = navigation.find(([id]) => id === tab)?.[1] || "Overview";

  const expenseForm = <FormCard title="Add expense" onSubmit={e => { e.preventDefault(); submit("expenses", expense, () => setExpense({amount:"",category:"Food & dining",note:""})); }} button={button}><input className={field} type="number" min="0.01" step="0.01" required placeholder="Amount" value={expense.amount} onChange={e=>setExpense({...expense,amount:e.target.value})}/><select className={field} value={expense.category} onChange={e=>setExpense({...expense,category:e.target.value})}><option>Food & dining</option><option>Transport</option><option>Utilities</option><option>Shopping</option><option>Other</option></select><input className={field} placeholder="Note (optional)" value={expense.note} onChange={e=>setExpense({...expense,note:e.target.value})}/></FormCard>;
  const incomeForm = <FormCard title="Add income" onSubmit={e => { e.preventDefault(); submit("income", income, () => setIncome({amount:"",source:""})); }} button={button}><input className={field} type="number" min="0.01" step="0.01" required placeholder="Amount" value={income.amount} onChange={e=>setIncome({...income,amount:e.target.value})}/><input className={field} required placeholder="Source" value={income.source} onChange={e=>setIncome({...income,source:e.target.value})}/></FormCard>;
  const goalForm = <FormCard title="New savings goal" onSubmit={e => { e.preventDefault(); submit("goals", goal, () => setGoal({title:"",targetAmount:"",deadline:""})); }} button={button}><input className={field} required placeholder="Goal name" value={goal.title} onChange={e=>setGoal({...goal,title:e.target.value})}/><input className={field} type="number" min="0.01" step="0.01" required placeholder="Target amount" value={goal.targetAmount} onChange={e=>setGoal({...goal,targetAmount:e.target.value})}/><input className={field} type="date" value={goal.deadline} onChange={e=>setGoal({...goal,deadline:e.target.value})}/></FormCard>;

  const expensesList = <List title="Recent expenses" items={data.expenses} empty="No expenses recorded." render={item => <Row key={item.id} title={item.note || item.category} meta={`${item.category} · ${new Date(item.date).toLocaleDateString()}`} amount={`−${cash(item.amount)}`} onDelete={()=>remove("expenses",item.id)}/>} />;
  const incomeList = <List title="Recent income" items={data.incomes} empty="No income recorded." render={item => <Row key={item.id} title={item.source || "Income"} meta={new Date(item.date).toLocaleDateString()} amount={`+${cash(item.amount)}`} onDelete={()=>remove("income",item.id)}/>} />;
  const goalsList = <List title="Savings goals" items={data.goals} empty="No savings goals yet." render={item => <div key={item.id} className="border-t border-slate-100 py-4 first:border-0"><div className="flex justify-between gap-4 text-sm"><strong>{item.title}</strong><span className="text-right">{cash(item.savedAmount)} / {cash(item.targetAmount)}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${Math.min(100,(item.savedAmount/item.targetAmount)*100)}%`}}/></div>{item.deadline && <p className="mt-2 text-xs text-slate-400">Target date: {new Date(item.deadline).toLocaleDateString()}</p>}</div>} />;

  return <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
    <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3 text-xl font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">E</span>Expense<span className="-ml-3 text-blue-600">AI</span></div>
      <nav className="space-y-1" aria-label="Dashboard sections">{navigation.map(([id,label]) => <button type="button" key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${tab === id ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>)}</nav>
      <button onClick={onLogout} className="mt-auto rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600">Log out</button>
    </aside>
    <main className="lg:ml-60">
      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><h1 className="text-lg font-bold">{activeLabel}</h1><p className="text-xs text-slate-500">Track progress and make confident decisions.</p></div><div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">FI</div></header>
      <div className="mx-auto max-w-7xl space-y-5 p-5 sm:p-8">
        <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 lg:hidden" aria-label="Dashboard sections">{navigation.map(([id,label]) => <button type="button" key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${tab === id ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}>{label}</button>)}</nav>
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {notice && <button onClick={() => setNotice("")} className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left text-sm text-emerald-700">✓ {notice}</button>}
        {loading ? <div className="grid min-h-64 place-items-center text-sm text-slate-500">Loading your finances…</div> : <div key={tab}>
          {tab === "overview" && <div className="space-y-5">
            <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white shadow-lg shadow-blue-100"><p className="text-xs font-semibold tracking-widest text-blue-100">TOTAL BALANCE</p><h2 className="mt-2 text-3xl font-bold">{cash(summary.balance)}</h2><p className="mt-2 text-xs text-blue-100">Income minus expenses across your records</p></section>
            <section className="grid gap-4 md:grid-cols-3">{cards.map(([label,value,copy,tone]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${tone}`}>{label}</span><h3 className="mt-4 text-xl font-bold">{cash(value)}</h3><p className="mt-1 text-xs text-slate-500">{copy}</p></article>)}</section>
            <section className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
              <article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-4"><h3 className="font-bold">Spending by category</h3><p className="text-xs text-slate-500">Where your money is going</p></div>{chartData.length ? <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={3}>{chartData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip formatter={(v) => cash(v)}/></PieChart></ResponsiveContainer> : <div className="grid h-64 place-items-center text-sm text-slate-400">Add an expense to see your breakdown.</div>}</article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">Latest AI insight</h3><p className="mt-1 text-xs text-slate-500">Based on your current records</p><div className="mt-5 rounded-xl bg-violet-50 p-4 text-sm leading-6 text-violet-950">{data.insights?.tips?.[0] || "Add some data to unlock personalised insights."}</div><button type="button" onClick={() => setTab("coach")} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">Open AI coach →</button></article>
            </section>
          </div>}

          {tab === "transactions" && <div className="space-y-5"><div><h2 className="text-2xl font-bold">Transactions</h2><p className="mt-1 text-sm text-slate-500">Record money in and money out, then review recent activity.</p></div><section className="grid gap-5 lg:grid-cols-2">{expenseForm}{incomeForm}</section><section className="grid gap-5 lg:grid-cols-2">{expensesList}{incomeList}</section></div>}

          {tab === "goals" && <div className="space-y-5"><div><h2 className="text-2xl font-bold">Savings goals</h2><p className="mt-1 text-sm text-slate-500">Create targets and see how close you are to reaching them.</p></div><section className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">{goalForm}{goalsList}</section></div>}

          {tab === "coach" && <div className="space-y-5"><div><h2 className="text-2xl font-bold">AI coach</h2><p className="mt-1 text-sm text-slate-500">Ask questions about the financial records stored in this demo.</p></div><article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h3 className="font-bold">Your current insight</h3><div className="mt-4 rounded-xl bg-violet-50 p-4 text-sm leading-6 text-violet-950">{data.insights?.tips?.[0] || "Add some data to unlock personalised insights."}</div><form onSubmit={askAI} className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="coach-question">Ask the AI coach</label><input id="coach-question" className={field} value={chat} onChange={e => setChat(e.target.value)} placeholder="Ask about spending, saving or your balance…"/><button className={button}>Ask coach</button></form>{reply && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Coach response</p><p className="mt-2 text-sm leading-6 text-slate-700">{reply}</p></div>}</article></div>}
        </div>}
      </div>
    </main>
  </div>;
}

function FormCard({ title, onSubmit, button, children }) { return <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">{title}</h3>{children}<button className={`${button} w-full`}>Save</button></form>; }
function List({ title, items, empty, render }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-3 font-bold">{title}</h3>{items.length ? items.slice(0,5).map(render) : <p className="py-8 text-center text-sm text-slate-400">{empty}</p>}</article>; }
function Row({ title, meta, amount, onDelete }) { return <div className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-0"><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{title}</strong><span className="text-xs text-slate-400">{meta}</span></div><b className="text-sm">{amount}</b><button onClick={onDelete} aria-label={`Delete ${title}`} className="text-xs text-slate-400 hover:text-rose-600">Delete</button></div>; }
