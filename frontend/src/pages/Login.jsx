import React, { useState } from "react";
import api from "../api/client";

export default function Login({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      onAuth(data.token);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-violet-600 p-14 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3 text-xl font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-700">E</span>ExpenseAI</div>
        <div className="my-auto max-w-lg"><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-100">Money, made clearer</p><h2 className="mt-5 text-5xl font-bold leading-tight">Build better financial habits with every decision.</h2><p className="mt-6 text-lg leading-8 text-blue-100">Track income, understand spending, reach savings goals and get practical insights from one calm dashboard.</p></div>
        <p className="text-sm text-blue-100">Private by design · Built for everyday decisions</p>
      </section>
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfc] px-5 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-100 sm:p-10">
        <div className="mb-8 flex items-center gap-3 text-xl font-extrabold lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">E</span>ExpenseAI</div>
        <h1 className="text-3xl font-bold tracking-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-sm text-slate-500">{mode === "login" ? "Sign in to view your financial overview." : "Start building a clearer picture of your money."}</p>

        <div className="mt-8 space-y-4">

        {mode === "register" && (
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
          {mode === "login" ? "Log in" : "Sign up"}
        </button>

        <button
          type="button"
          className="w-full text-sm font-semibold text-blue-600"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button></div>
      </form>
      </div>
    </div>
  );
}
