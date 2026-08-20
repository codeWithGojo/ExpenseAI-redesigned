"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";

type View = "home" | "expenses" | "detail";
type IconName =
  | "home"
  | "wallet"
  | "plus"
  | "chart"
  | "bell"
  | "eye"
  | "arrow"
  | "chevron"
  | "food"
  | "shopping"
  | "transport"
  | "bill"
  | "health"
  | "subscription"
  | "sparkle"
  | "close"
  | "check";

type Transaction = {
  merchant: string;
  account: string;
  amount: number;
  date: string;
  icon: IconName;
  tone: string;
};

type Category = {
  name: string;
  spent: number;
  budget: number;
  icon: IconName;
  tone: string;
  color: string;
};

const income = 420_000;
const totalSpent = 214_650;
const spendPercent = (totalSpent / income) * 100;

const transactions: Transaction[] = [
  { merchant: "Market Square", account: "Food & groceries", amount: -18_400, date: "Today, 9:42 AM", icon: "food", tone: "orange" },
  { merchant: "Bolt", account: "Transport · Visa 4821", amount: -4_850, date: "Yesterday, 7:18 PM", icon: "transport", tone: "purple" },
  { merchant: "Netflix", account: "Monthly subscription", amount: -4_400, date: "18 Aug, 6:00 AM", icon: "subscription", tone: "navy" },
  { merchant: "HealthPlus", account: "Healthcare", amount: -8_250, date: "16 Aug, 2:26 PM", icon: "health", tone: "green" },
  { merchant: "Salary credit", account: "GTBank · Current", amount: 420_000, date: "01 Aug, 8:04 AM", icon: "wallet", tone: "coral" },
];

const categories: Category[] = [
  { name: "Food & Drinks", spent: 68_400, budget: 90_000, icon: "food", tone: "orange", color: "#ff7a59" },
  { name: "Shopping", spent: 48_250, budget: 70_000, icon: "shopping", tone: "purple", color: "#7c3aed" },
  { name: "Transport", spent: 36_800, budget: 50_000, icon: "transport", tone: "navy", color: "#24243a" },
  { name: "Bills & Utilities", spent: 31_200, budget: 40_000, icon: "bill", tone: "blue", color: "#4f8cff" },
  { name: "Healthcare", spent: 18_500, budget: 25_000, icon: "health", tone: "green", color: "#20b486" },
  { name: "Subscriptions", spent: 11_500, budget: 15_000, icon: "subscription", tone: "pink", color: "#ef5da8" },
];

const monthSpend = [
  { month: "Mar", amount: 174_200 },
  { month: "Apr", amount: 231_400 },
  { month: "May", amount: 196_800 },
  { month: "Jun", amount: 287_100 },
  { month: "Jul", amount: 248_600 },
  { month: "Aug", amount: totalSpent, current: true },
];

const weekDays = [
  { label: "Mon", date: 17 },
  { label: "Tue", date: 18 },
  { label: "Wed", date: 19 },
  { label: "Thu", date: 20 },
  { label: "Fri", date: 21 },
  { label: "Sat", date: 22 },
  { label: "Sun", date: 23 },
];

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatNaira(value: number) {
  return naira.format(value).replace("NGN", "₦");
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" /></>,
    wallet: <><path d="M4 6.5h14.5A1.5 1.5 0 0 1 20 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" /><path d="M15 11h5v5h-5a2.5 2.5 0 0 1 0-5Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    chart: <><path d="M5 20V10M12 20V4M19 20v-7" /><path d="M3 20h18" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    food: <><path d="M6 3v8M9 3v8M6 7h3M7.5 11v10" /><path d="M16 3c-2 3-2 8 1 10v8M17 13h2V3c-3 1-4 5-3 10Z" /></>,
    shopping: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    transport: <><path d="M5 16h14l-1-8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2l-1 8Z" /><path d="M4 12h16M7 16v3M17 16v3M8 9h8" /></>,
    bill: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    health: <><path d="M12 20S4 15.4 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20Z" /><path d="M12 9v5M9.5 11.5h5" /></>,
    subscription: <><rect x="4" y="5" width="16" height="14" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></>,
    sparkle: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4 10-10" />,
  };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function CalendarStrip({ selectedDay, onSelect, monthShift, onMonthShift }: { selectedDay: number; onSelect: (day: number) => void; monthShift: number; onMonthShift: (value: number) => void }) {
  const label = useMemo(() => {
    const date = new Date(Date.UTC(2026, 7 + monthShift, 20));
    return new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  }, [monthShift]);

  return <section className="calendar-card" aria-label="Expense date selector">
    <div className="calendar-heading">
      <button onClick={() => onMonthShift(monthShift - 1)} aria-label="Previous month"><Icon name="chevron" /></button>
      <strong>{label}</strong>
      <button className="next" onClick={() => onMonthShift(monthShift + 1)} aria-label="Next month"><Icon name="chevron" /></button>
    </div>
    <div className="calendar-days">
      {weekDays.map((item) => <button key={item.date} className={selectedDay === item.date ? "active" : ""} onClick={() => onSelect(item.date)}>
        <small>{item.label}</small><span>{item.date}</span>{item.date === 20 && monthShift === 0 ? <i /> : null}
      </button>)}
    </div>
  </section>;
}

function Header({ view, onBack, onNotify }: { view: View; onBack: () => void; onNotify: () => void }) {
  const title = view === "home" ? "Home" : view === "expenses" ? "Expenses" : "Total expense";
  return <header className="mobile-header">
    {view === "detail" ? <button className="round-button back-button" onClick={onBack} aria-label="Back to expenses"><Icon name="chevron" /></button> : <div className="avatar" aria-label="Favour Imegu profile">FI</div>}
    <div><p>{view === "home" ? "Good morning" : "Money overview"}</p><h1>{title}</h1></div>
    <button className="round-button bell-button" onClick={onNotify} aria-label="Notifications"><Icon name="bell" /><span /></button>
  </header>;
}

function BottomNav({ view, navigate, onAdd }: { view: View; navigate: (view: View) => void; onAdd: () => void }) {
  return <nav className="bottom-nav" aria-label="App navigation">
    <button className={view === "home" ? "active" : ""} onClick={() => navigate("home")}><Icon name="home" /><span>Home</span></button>
    <button className={view === "expenses" || view === "detail" ? "active" : ""} onClick={() => navigate("expenses")}><Icon name="wallet" /><span>Expenses</span></button>
    <button className="add-button" onClick={onAdd} aria-label="Add an expense"><Icon name="plus" /></button>
    <button onClick={() => { navigate("home"); window.setTimeout(() => document.getElementById("project-story")?.scrollIntoView({ behavior: "smooth" }), 60); }}><Icon name="sparkle" /><span>Story</span></button>
    <button onClick={() => navigate("detail")}><Icon name="chart" /><span>Insights</span></button>
  </nav>;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [selectedDay, setSelectedDay] = useState(20);
  const [monthShift, setMonthShift] = useState(0);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalOpen(false);
    notify("Expense added to this month.");
  }

  return <main className="app-shell">
    <aside className="side-nav">
      <button className="brand" onClick={() => navigate("home")}><span><Icon name="sparkle" /></span>ExpenseAI</button>
      <p className="nav-label">Workspace</p>
      <button className={view === "home" ? "active" : ""} onClick={() => navigate("home")}><Icon name="home" />Overview</button>
      <button className={view === "expenses" || view === "detail" ? "active" : ""} onClick={() => navigate("expenses")}><Icon name="wallet" />Expenses</button>
      <button onClick={() => navigate("detail")}><Icon name="chart" />Insights</button>
      <div className="side-insight"><Icon name="sparkle" /><strong>Smart check-in</strong><p>Your food spend is still inside this month’s limit.</p><button onClick={() => navigate("detail")}>See breakdown <Icon name="arrow" /></button></div>
      <div className="side-profile"><div className="avatar">FI</div><div><strong>Favour Imegu</strong><small>Personal account</small></div></div>
    </aside>

    <div className="workspace">
      <Header view={view} onBack={() => navigate("expenses")} onNotify={() => notify("You’re all caught up.")} />

      {view === "home" && <HomeScreen
        balanceVisible={balanceVisible}
        setBalanceVisible={setBalanceVisible}
        showAll={showAll}
        setShowAll={setShowAll}
        navigate={navigate}
      />}

      {view === "expenses" && <ExpensesScreen
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        monthShift={monthShift}
        setMonthShift={setMonthShift}
        navigate={navigate}
      />}

      {view === "detail" && <DetailScreen
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        monthShift={monthShift}
        setMonthShift={setMonthShift}
      />}
    </div>

    <BottomNav view={view} navigate={navigate} onAdd={() => setModalOpen(true)} />

    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setModalOpen(false)}>
      <form className="expense-modal" onSubmit={addExpense}>
        <div className="modal-heading"><div><p className="eyebrow">New transaction</p><h2>Add an expense</h2></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Close"><Icon name="close" /></button></div>
        <label>Amount<div className="amount-input"><span>₦</span><input required inputMode="decimal" placeholder="0" /></div></label>
        <label>What was it for?<input required placeholder="e.g. Lunch at Chicken Republic" /></label>
        <label>Category<select defaultValue="Food & Drinks">{categories.map((category) => <option key={category.name}>{category.name}</option>)}</select></label>
        <button className="primary-action">Save expense <Icon name="arrow" /></button>
      </form>
    </div>}

    {toast && <div className="toast" role="status"><Icon name="check" />{toast}</div>}
  </main>;
}

function HomeScreen({ balanceVisible, setBalanceVisible, showAll, setShowAll, navigate }: { balanceVisible: boolean; setBalanceVisible: (value: boolean) => void; showAll: boolean; setShowAll: (value: boolean) => void; navigate: (view: View) => void }) {
  const maxSpend = Math.max(...monthSpend.map((item) => item.amount));
  return <div className="screen home-screen">
    <div className="desktop-title"><div><p className="eyebrow">Thursday, 20 August</p><h1>Good morning, Favour.</h1></div><button className="notification-pill"><Icon name="bell" /><span>No new alerts</span></button></div>
    <section className="balance-card">
      <div className="balance-orb orb-one" /><div className="balance-orb orb-two" />
      <div className="card-top"><span>Total balance</span><button onClick={() => setBalanceVisible(!balanceVisible)} aria-label={balanceVisible ? "Hide balance" : "Show balance"}><Icon name="eye" /></button></div>
      <strong>{balanceVisible ? formatNaira(1_248_750) : "₦ •••••••"}</strong>
      <div className="card-bottom"><div><small>Card number</small><span>•••• &nbsp;•••• &nbsp;•••• &nbsp;4821</span></div><div className="network-mark"><i /><i /></div></div>
    </section>

    <div className="dashboard-grid">
      <section className="panel analytics-card">
        <div className="section-title"><div><p className="eyebrow">Spending pattern</p><h2>Analytics</h2></div><button>Last 6 months <Icon name="chevron" /></button></div>
        <div className="chart-summary"><div><strong>{formatNaira(totalSpent)}</strong><small>Spent in August</small></div><span className="good-change">12% less than July</span></div>
        <div className="month-chart" aria-label="Monthly spending from March to August">
          {monthSpend.map((item) => <div className={item.current ? "month-column current" : "month-column"} key={item.month}>
            <span className="chart-value">{Math.round(item.amount / 1000)}k</span>
            <div className="bar-track"><i style={{ height: `${Math.max(24, (item.amount / maxSpend) * 100)}%` }} /></div>
            <small>{item.month}</small>
          </div>)}
        </div>
      </section>

      <section className="panel transactions-card">
        <div className="section-title"><div><p className="eyebrow">Latest activity</p><h2>Transactions</h2></div><button onClick={() => setShowAll(!showAll)}>{showAll ? "Show less" : "View all"}</button></div>
        <div className="transaction-list">
          {transactions.slice(0, showAll ? transactions.length : 3).map((transaction) => <article className="transaction" key={transaction.merchant}>
            <span className={`merchant-icon ${transaction.tone}`}><Icon name={transaction.icon} /></span>
            <div className="transaction-name"><strong>{transaction.merchant}</strong><small>{transaction.account}</small></div>
            <div className={transaction.amount > 0 ? "transaction-amount positive" : "transaction-amount"}><strong>{transaction.amount > 0 ? "+" : "−"}{formatNaira(Math.abs(transaction.amount))}</strong><small>{transaction.date}</small></div>
          </article>)}
        </div>
      </section>
    </div>

    <section className="story-panel" id="project-story">
      <div className="story-intro"><span className="story-kicker"><Icon name="sparkle" /> Why I built it</span><h2>I wanted more than a chart telling me where my money went.</h2><p>Most budgeting apps I found felt generic: they showed the damage after the month was over, but rarely explained what to do next—especially for day-to-day spending in Naira. I built ExpenseAI to spot the pattern early and turn it into advice I could actually use.</p></div>
      <div className="story-grid">
        <article><span>01</span><p className="eyebrow">Built</p><h3>Private by default</h3><p>JWT authentication and per-user data isolation, so every transaction and insight belongs to the right account.</p></article>
        <article><span>02</span><p className="eyebrow">Learned</p><h3>Rules can still feel smart</h3><p>I learned how to turn budget limits, category spikes and recurring payments into short financial insights without pretending every alert needs AI.</p></article>
        <article><span>03</span><p className="eyebrow">Challenge</p><h3>Useful, not decorative</h3><p>The hard part was choosing breakdowns that help someone change a habit. Making a colourful chart was easy; making it worth checking was not.</p></article>
      </div>
      <button className="story-cta" onClick={() => navigate("expenses")}>Explore the expense flow <Icon name="arrow" /></button>
    </section>
  </div>;
}

function ExpensesScreen({ selectedDay, setSelectedDay, monthShift, setMonthShift, navigate }: { selectedDay: number; setSelectedDay: (day: number) => void; monthShift: number; setMonthShift: (value: number) => void; navigate: (view: View) => void }) {
  return <div className="screen expenses-screen">
    <div className="desktop-title"><div><p className="eyebrow">Monthly activity</p><h1>Where your money went.</h1></div><span className="date-pill">August 2026</span></div>
    <CalendarStrip selectedDay={selectedDay} onSelect={setSelectedDay} monthShift={monthShift} onMonthShift={setMonthShift} />
    <div className="summary-cards">
      <article className="summary-card salary"><div className="summary-label"><span>Total salary</span><button aria-label="Salary options">•••</button></div><strong>{formatNaira(income)}</strong><div><span className="mini-card-icon"><Icon name="wallet" /></span><p>GTBank Current<small>•••• 4821</small></p></div></article>
      <button className="summary-card expense" onClick={() => navigate("detail")}><div className="summary-label"><span>Total expense</span><i>Open <Icon name="chevron" /></i></div><strong>{formatNaira(totalSpent)}</strong><div><span className="mini-card-icon"><Icon name="wallet" /></span><p>Visa debit<small>•••• 4821</small></p></div></button>
    </div>

    <section className="panel category-panel">
      <div className="section-title"><div><p className="eyebrow">Budget health</p><h2>Category breakdown</h2></div><button onClick={() => navigate("detail")}>View analytics <Icon name="arrow" /></button></div>
      <div className="category-list">
        {categories.map((category) => {
          const percentage = Math.round((category.spent / category.budget) * 100);
          return <article className="category-row" key={category.name}>
            <span className={`category-icon ${category.tone}`}><Icon name={category.icon} /></span>
            <div className="category-content">
              <div className="category-heading"><div><strong>{category.name}</strong><small>{formatNaira(category.spent)} of {formatNaira(category.budget)}</small></div><b>{percentage}%</b></div>
              <div className="progress-track"><i style={{ width: `${percentage}%`, background: category.color }} /></div>
            </div>
          </article>;
        })}
      </div>
    </section>
  </div>;
}

function DetailScreen({ selectedDay, setSelectedDay, monthShift, setMonthShift }: { selectedDay: number; setSelectedDay: (day: number) => void; monthShift: number; setMonthShift: (value: number) => void }) {
  let start = 0;
  const segments = categories.map((category) => {
    const end = start + (category.spent / totalSpent) * 100;
    const segment = `${category.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
    start = end;
    return segment;
  }).join(", ");

  return <div className="screen detail-screen">
    <div className="desktop-title"><div><p className="eyebrow">Expense insight</p><h1>Your month, explained.</h1></div><span className="date-pill">Updated today</span></div>
    <CalendarStrip selectedDay={selectedDay} onSelect={setSelectedDay} monthShift={monthShift} onMonthShift={setMonthShift} />

    <section className="spend-headline">
      <div><p>You have spent</p><h2>{formatNaira(totalSpent)} <span>this month.</span></h2><small>That is {spendPercent.toFixed(1)}% of your August income.</small></div>
      <div className="income-meter"><div className="meter-label"><strong>{spendPercent.toFixed(1)}% spent</strong><span>{(100 - spendPercent).toFixed(1)}% left</span></div><div className="income-track"><i style={{ width: `${spendPercent}%` }} /></div><p><Icon name="sparkle" /> You have {formatNaira(income - totalSpent)} left from this month’s income.</p></div>
    </section>

    <section className="panel detail-analytics">
      <div className="section-title"><div><p className="eyebrow">All categories</p><h2>Expense analytics</h2></div><span className="legend-total">100% accounted for</span></div>
      <div className="pie-layout">
        <div className="pie-wrap"><div className="pie-chart" style={{ background: `conic-gradient(${segments})` }} role="img" aria-label="Expense pie chart by category"><div><small>Total spent</small><strong>{formatNaira(totalSpent)}</strong></div></div></div>
        <div className="pie-legend">
          {categories.map((category) => <article key={category.name}><span style={{ background: category.color }} /><div><strong>{category.name}</strong><small>{((category.spent / totalSpent) * 100).toFixed(1)}% of spend</small></div><b>{formatNaira(category.spent)}</b></article>)}
        </div>
      </div>
    </section>

    <section className="insight-banner"><span><Icon name="sparkle" /></span><div><p className="eyebrow">ExpenseAI noticed</p><h3>Food is your biggest category, but it is still under budget.</h3><p>You can spend up to {formatNaira(21_600)} more before hitting the limit you set for August.</p></div></section>
  </div>;
}
