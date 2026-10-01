"use client";

import {FormEvent, ReactNode, useCallback, useEffect, useRef, useState} from "react";
import {browserMode} from "./browser-store";
import {browserExpenseApi} from "./browser-api";
type View = "home" | "expenses" | "detail";
type IconName = "home" | "wallet" | "plus" | "chart" | "bell" | "eye" | "arrow" | "chevron" | "food" | "shopping" | "transport" | "bill" | "health" | "subscription" | "sparkle" | "close" | "check";
type RecordRow = {id:string; kind:"income"|"expense"; amount_kobo:number; category:string; description:string; date:string; vehicle:string; trip:string};
type Goal = {id:string;name:string;target_kobo:number;saved_kobo:number};
type Workspace = {goals:Goal[];businessName:string; email:string; month:string; transactions:RecordRow[]; budgets:{category:string;amount_kobo:number}[]; history:{month:string;amount_kobo:number}[]};
const categoryStyles = [
  {name:"Fuel",icon:"transport",tone:"orange",color:"#ff7a59"},
  {name:"Maintenance",icon:"transport",tone:"purple",color:"#7c3aed"},
  {name:"Driver allowance",icon:"wallet",tone:"navy",color:"#24243a"},
  {name:"Tolls & parking",icon:"transport",tone:"blue",color:"#4f8cff"},
  {name:"Insurance",icon:"health",tone:"green",color:"#168d68"},
  {name:"Office",icon:"bill",tone:"pink",color:"#c13b79"},
  {name:"Food & Drinks",icon:"food",tone:"orange",color:"#bc5637"},
  {name:"Transport",icon:"transport",tone:"navy",color:"#4f4e66"},
  {name:"Bills & Utilities",icon:"bill",tone:"blue",color:"#2864be"},
  {name:"Other",icon:"wallet",tone:"purple",color:"#8c73a2"},
] as const;
const today = () => new Intl.DateTimeFormat("sv-SE",{timeZone:"Africa/Lagos",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const money = (kobo:number) => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:2}).format(kobo/100);
const monthLabel = (month:string) => new Intl.DateTimeFormat("en-NG",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(month+"-01T00:00:00Z"));
const shiftMonth = (month:string,shift:number) => new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7))-1+shift,1)).toISOString().slice(0,7);
async function api<T=Record<string,unknown>>(path:string, method="GET", body?:unknown, signal?:AbortSignal) {
  if(browserMode)return browserExpenseApi<T>(path,method,body,signal);
  const response=await fetch(path,{method,signal,credentials:"same-origin",headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});
  const data=await response.json();
  if(!response.ok) throw new Error(typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Please try again.");
  return data as T;
}
function csvCell(value:unknown) {const text=String(value??"");const safe=/^[=+\-@\t\r]/.test(text.trimStart())?"'"+text:text;return '"'+safe.replaceAll('"','""')+'"';}
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


export default function Home() {
  const [view,setView]=useState<View>("home");
  const [month,setMonth]=useState(today().slice(0,7));
  const [workspace,setWorkspace]=useState<Workspace|null>(null);
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState("");
  const [saving,setSaving]=useState(false);
  const [formError,setFormError]=useState("");
  const [notice,setNotice]=useState("");
  const [visible,setVisible]=useState(true);
  const [search,setSearch]=useState("");
  const [vehicle,setVehicle]=useState("");
  const [day,setDay]=useState("");
  const [recordType,setRecordType]=useState("all");
  const [editingGoal,setEditingGoal]=useState<Goal|null>(null);
  const [dialogType,setDialogType]=useState<"transaction"|"budget"|"business"|"delete"|"goal">("transaction");
  const [kind,setKind]=useState<"income"|"expense">("expense");
  const [deleteRow,setDeleteRow]=useState<RecordRow|null>(null);
  const [requestId,setRequestId]=useState("");
  const dialog=useRef<HTMLDialogElement>(null);
  const saveForm=useRef<HTMLFormElement>(null);
  const monthRef=useRef(month);monthRef.current=month;
  const load=useCallback(async(selected:string,signal?:AbortSignal)=>{
    setLoading(true);setLoadError("");
    try {const data=await api<Workspace>("/api/workspace?month="+selected,"GET",undefined,signal);if(monthRef.current===selected&&!signal?.aborted)setWorkspace(data);}
    catch(error){if(!signal?.aborted)setLoadError(error instanceof Error?error.message:"Could not load records.");}
    finally{if(monthRef.current===selected&&!signal?.aborted)setLoading(false);}
  },[]);
  useEffect(()=>{const controller=new AbortController();setDay("");setVehicle("");void load(month,controller.signal);return()=>controller.abort();},[month,load]);
  const ready=!!workspace&&workspace.month===month&&!loading&&!loadError;
  const records=ready?workspace.transactions:[];
  const income=records.filter(r=>r.kind==="income").reduce((s,r)=>s+r.amount_kobo,0);
  const spent=records.filter(r=>r.kind==="expense").reduce((s,r)=>s+r.amount_kobo,0);
  const categories=categoryStyles.map(style=>({...style,spent:records.filter(r=>r.kind==="expense"&&r.category===style.name).reduce((s,r)=>s+r.amount_kobo,0),budget:workspace?.budgets.find(b=>b.category===style.name)?.amount_kobo||0}));
  const used=categories.filter(c=>c.spent||c.budget);
  const filtered=records.filter(r=>(recordType==="all"||r.kind===recordType)&&(!vehicle||r.vehicle===vehicle)&&(!day||r.date===day)&&(!search||[r.description,r.category,r.vehicle,r.trip].join(" ").toLowerCase().includes(search.toLowerCase())));
  const vehicles=Array.from(new Set(records.map(r=>r.vehicle).filter(Boolean))).sort();
  const history=Array.from({length:6},(_,i)=>{const key=shiftMonth(month,i-5);return {month:key,amount:ready?workspace.history.find(h=>h.month===key)?.amount_kobo||0:0};});
  const goalRows=ready?workspace.goals||[]:[];
  const totalBudget=categories.reduce((sum,c)=>sum+c.budget,0);
  const budgetedSpend=categories.filter(c=>c.budget>0).reduce((sum,c)=>sum+c.spent,0);
  const unbudgetedSpend=spent-budgetedSpend;
  const vehicleRows=vehicles.map(name=>{const rows=records.filter(r=>r.vehicle===name);return {name,income:rows.filter(r=>r.kind==="income").reduce((sum,r)=>sum+r.amount_kobo,0),spent:rows.filter(r=>r.kind==="expense").reduce((sum,r)=>sum+r.amount_kobo,0),count:rows.length};});
  const max=Math.max(1,...history.map(h=>h.amount));
  const biggest=[...categories].sort((a,b)=>b.spent-a.spent)[0];
  const overBudget=used.filter(c=>c.budget>0&&c.spent>c.budget);
  const insight=!records.length?"Add income and expenses to see your business activity.":overBudget.length?`${overBudget.map(c=>c.name).join(", ")} ${overBudget.length===1?"is":"are"} above the budget you set.`:spent>income?`Recorded expenses exceed income by ${money(spent-income)} this month.`:biggest?.spent?`${biggest.name} is your largest expense category at ${money(biggest.spent)}.`:"Income has been recorded. Add expenses as they occur.";
  function navigate(next:View){setView(next);setNotice("");window.scrollTo({top:0,behavior:"auto"});}
  function open(type:typeof dialogType,transactionKind:typeof kind="expense",row?:RecordRow){setDialogType(type);setKind(transactionKind);setDeleteRow(row||null);setEditingGoal(null);setRequestId(crypto.randomUUID());setFormError("");setNotice("");saveForm.current?.reset();dialog.current?.showModal();}
  function close(){if(!saving)dialog.current?.close();}
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=new FormData(event.currentTarget);setSaving(true);setFormError("");
    try {
      if(dialogType==="transaction")await api("/api/transactions","POST",{id:requestId,kind,amount:form.get("amount"),category:kind==="income"?"Business income":form.get("category"),description:form.get("description"),date:form.get("date"),vehicle:form.get("vehicle"),trip:form.get("trip")});
      else if(dialogType==="budget")await api("/api/budgets","POST",{month,category:form.get("category"),amount:form.get("amount")});
      else if(dialogType==="goal"){if(editingGoal)await api("/api/goals/"+editingGoal.id,"PUT",{saved:form.get("saved")});else await api("/api/goals","POST",{id:requestId,name:form.get("name"),target:form.get("target"),saved:form.get("saved")});}
      else if(dialogType==="business")await api("/api/workspace","PUT",{businessName:form.get("businessName")});
      else if(deleteRow)await api("/api/transactions/"+deleteRow.id,"DELETE");
      dialog.current?.close();setNotice(dialogType==="delete"?"Transaction removed.":dialogType==="budget"?"Monthly budget saved.":dialogType==="business"?"Business name saved.":dialogType==="goal"?"Savings goal saved.":"Transaction saved.");await load(monthRef.current);
    } catch(error){setFormError(error instanceof Error?error.message:"Could not save. Please try again.");}
    finally{setSaving(false);}
  }
  function exportReport(){
    const rows=[["Date","Type","Description","Category","Amount (NGN)","Vehicle","Trip"],...filtered.map(r=>[r.date,r.kind,r.description,r.category,(r.amount_kobo/100).toFixed(2),r.vehicle,r.trip])];
    const blob=new Blob(["\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`expenseai-${month}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice(`${filtered.length} transactions exported.`);
  }
  const recordList=(items:RecordRow[])=>items.length?<div className="transaction-list">{items.map(row=><article className="transaction" key={row.id}><span className={`merchant-icon ${row.kind==="income"?"green":categoryStyles.find(c=>c.name===row.category)?.tone||"navy"}`}><Icon name={row.kind==="income"?"wallet":categoryStyles.find(c=>c.name===row.category)?.icon||"wallet"}/></span><div className="transaction-name"><strong>{row.description}</strong><small>{row.category}{row.vehicle?` · ${row.vehicle}`:""}{row.trip?` · ${row.trip}`:""}</small></div><div className={row.kind==="income"?"transaction-amount positive":"transaction-amount"}><strong>{row.kind==="income"?"+":"−"}{money(row.amount_kobo)}</strong><small>{row.date}</small></div><button className="remove-record" onClick={()=>open("delete","expense",row)} aria-label={`Remove ${row.description}`}>Remove</button></article>)}</div>:<div className="empty-records"><h3>{records.length?"No matching transactions":"No transactions yet"}</h3><p>{records.length?"Change your filters to see other records.":"Record your first income or expense for this month."}</p></div>;
  return <main className="app-shell">
    <aside className="side-nav"><button className="brand" onClick={()=>navigate("home")}><span><Icon name="wallet"/></span>ExpenseAI</button><p className="nav-label">Business workspace</p>{([['home','Overview','home'],['expenses','Transactions','wallet'],['detail','Reports & budgets','chart']] as const).map(([key,label,icon])=><button key={key} className={view===key?"active":""} onClick={()=>navigate(key)}><Icon name={icon}/>{label}</button>)}<div className="side-insight"><strong>Monthly check-in</strong><p>{ready?insight:browserMode?"Records are saved on this browser. Export CSV reports to keep a copy.":"Your business records stay with your account."}</p></div><div className="side-profile"><div className="avatar">{(workspace?.businessName||"EA").slice(0,2).toUpperCase()}</div><div><strong>{workspace?.businessName||"ExpenseAI"}</strong><small>{workspace?.email||"Private workspace"}</small></div></div>{!browserMode&&<a className="account-link" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a>}</aside>
    <div className="workspace"><header className="mobile-header"><div className="avatar">EA</div><div><p>{workspace?.businessName||"Business workspace"}</p><h1>{view==="home"?"Overview":view==="expenses"?"Transactions":"Reports & budgets"}</h1></div><button className="round-button" onClick={()=>open("business")} disabled={!ready} aria-label="Edit business name"><Icon name="wallet"/></button></header>
      <div className="screen"><div className="desktop-title"><div><p className="eyebrow">{workspace?.businessName||"Business workspace"} / {monthLabel(month)}</p><h1>{view==="home"?"A clearer view of your money.":view==="expenses"?"Every trip. Every transaction.":"Plan ahead. Stay in control."}</h1><p className="workspace-subtitle">{view==="home"?"Track your business, make room for what comes next.":view==="expenses"?"Your income and costs, together in one place.":"See where spending goes and how your goals are moving."}</p></div><button className="secondary-action" disabled={!ready} onClick={()=>open("business")}>Edit business name</button></div>
      <div className="ledger-toolbar"><label>Month<input type="month" min="2000-01" max="2100-12" value={month} onChange={e=>e.target.value&&setMonth(e.target.value)}/></label><div className="toolbar-actions"><button className="secondary-action" disabled={!ready} onClick={()=>open("transaction","income")}>Add income</button><button className="primary-action" disabled={!ready} onClick={()=>open("transaction","expense")}>Add expense</button></div></div>
      {notice&&<p className="inline-notice" role="status">{notice}</p>}
      {browserMode&&<p className="browser-storage-note">Saved on this browser only. Records do not sync between devices. Clearing site data removes them; export CSV reports to keep a copy.</p>}
      {loadError?<section className="records-error" role="alert"><h2>Could not load records</h2><p>{loadError}</p><button className="secondary-action" onClick={()=>load(month)}>Try again</button>{!browserMode&&<a href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT</a>}</section>:loading?<section className="ledger-skeleton" aria-label="Loading business records" aria-busy="true"><div/><div/><div/></section>:ready&&<>
      {view==="home"&&<><div className="overview-kpis"><section className="balance-card"><div className="card-top"><span>Recorded net income · {monthLabel(month)}</span><button onClick={()=>setVisible(!visible)} aria-label={visible?"Hide amount":"Show amount"}><Icon name="eye"/></button></div><strong>{visible?money(income-spent):"₦ •••••••"}</strong><div className="card-bottom"><div><small>Recorded income</small><span>{visible?money(income):"••••"}</span></div><div><small>Recorded expenses</small><span>{visible?money(spent):"••••"}</span></div></div></section><article className="kpi-card"><span className="kpi-icon"><Icon name="wallet"/></span><p>Recorded income</p><strong>{visible?money(income):"••••"}</strong><small>{records.filter(r=>r.kind==="income").length} income records this month</small></article><article className="kpi-card"><span className="kpi-icon cost"><Icon name="transport"/></span><p>Recorded expenses</p><strong>{visible?money(spent):"••••"}</strong><small>{records.filter(r=>r.kind==="expense").length} expense records this month</small></article></div><div className="dashboard-grid"><section className="panel analytics-card"><div className="section-title"><div><p className="eyebrow">Six-month view</p><h2>Expense history</h2></div></div><div className="chart-summary"><div><strong>{money(spent)}</strong><small>{monthLabel(month)}</small></div></div><div className="month-chart" aria-label="Recorded expenses by month">{history.map(item=><div className={`month-column ${item.month===month?"current":""}`} key={item.month}><span className="chart-value">{money(item.amount)}</span><div className="bar-track"><i style={{height:`${item.amount/max*100}%`}}/></div><small>{new Intl.DateTimeFormat("en-NG",{month:"short",timeZone:"UTC"}).format(new Date(item.month+"-01"))}</small></div>)}</div></section><section className="panel transactions-card"><div className="section-title"><h2>Recent transactions</h2><button onClick={()=>navigate("expenses")}>View all</button></div>{recordList(records.slice(0,4))}</section></div><section className="insight-banner"><span><Icon name="chart"/></span><div><p className="eyebrow">Based on your records</p><h3>{insight}</h3></div></section></>}
      {(view==="expenses"||view==="detail")&&<><div className="summary-cards"><article className="summary-card salary"><div className="summary-label"><span>Recorded income</span></div><strong>{money(income)}</strong></article><article className="summary-card expense"><div className="summary-label"><span>Recorded expenses</span></div><strong>{money(spent)}</strong></article></div>
      <section className="panel transactions-card"><div className="section-title"><div><p className="eyebrow">{monthLabel(month)}</p><h2>{view==="expenses"?"Transactions":"Monthly report"}</h2></div><button className="secondary-action" disabled={!filtered.length} onClick={exportReport}>Export CSV</button></div><div className="record-filters"><label>Type<select value={recordType} onChange={e=>setRecordType(e.target.value)}><option value="all">All transactions</option><option value="income">Income</option><option value="expense">Expenses</option></select></label><label>Search<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Description, category or trip"/></label><label>Vehicle<select value={vehicle} onChange={e=>setVehicle(e.target.value)}><option value="">All vehicles</option>{vehicles.map(v=><option key={v}>{v}</option>)}</select></label><label>Date<input type="date" min={month+"-01"} max={new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10)} value={day} onChange={e=>setDay(e.target.value)}/></label></div><div className="report-totals"><span>{filtered.length} records</span>{(search||vehicle||day||recordType!=="all")&&<button className="clear-filters" onClick={()=>{setSearch("");setVehicle("");setDay("");setRecordType("all");}}>Clear filters</button>}<span>Income: {money(filtered.filter(r=>r.kind==="income").reduce((s,r)=>s+r.amount_kobo,0))}</span><span>Expenses: {money(filtered.filter(r=>r.kind==="expense").reduce((s,r)=>s+r.amount_kobo,0))}</span></div>{recordList(filtered)}</section></>}
      {(view==="home"||view==="detail")&&<div className="planning-grid"><section className="panel budget-overview"><div className="section-title"><div><p className="eyebrow">Monthly plan</p><h2>Room in your budget</h2></div><button onClick={()=>view==="home"?navigate("detail"):open("budget")}>{view==="home"?"Manage budgets":"Set budget"} ↗</button></div>{totalBudget?<><div className="budget-headline"><strong className={budgetedSpend>totalBudget?"budget-over":""}>{money(Math.abs(totalBudget-budgetedSpend))}</strong><span>{budgetedSpend>totalBudget?"over your category limits":"remaining in budgeted categories"}</span></div><div className="progress-track"><i style={{width:`${Math.min(100,budgetedSpend/totalBudget*100)}%`,background:budgetedSpend>totalBudget?"#b42318":"#2563eb"}}/></div><p className="budget-caption">{money(budgetedSpend)} spent against {money(totalBudget)} in limits.</p>{unbudgetedSpend>0&&<p className="budget-caption">{money(unbudgetedSpend)} in other categories has no budget yet.</p>}</>:<div className="empty-records"><h3>Give your spending a plan.</h3><p>Set limits for fuel, maintenance and the costs that matter to you.</p><button className="secondary-action" onClick={()=>open("budget")}>Set your first budget</button></div>}</section><section className="panel goals-panel"><div className="section-title"><div><p className="eyebrow">Build a little breathing room</p><h2>Savings goals</h2></div><button onClick={()=>open("goal")}>New goal +</button></div>{!goalRows.length?<div className="empty-records"><h3>Your next milestone.</h3><p>Keep track of an emergency reserve, a new vehicle or a business goal.</p></div>:goalRows.map(goal=><article className="goal-row" key={goal.id}><div><strong>{goal.name}</strong><button onClick={()=>{open("goal");setEditingGoal(goal);}}>Update</button></div><p>{money(goal.saved_kobo)} <span>of {money(goal.target_kobo)}</span><b>{Math.round(goal.saved_kobo/goal.target_kobo*100)}%</b></p><div className="progress-track"><i style={{width:`${Math.min(100,goal.saved_kobo/goal.target_kobo*100)}%`,background:"#168d68"}}/></div></article>)}<p className="budget-caption">Manually tracked amounts. Goals do not move money or change your ledger.</p></section></div>}
      {view==="detail"&&<section className="panel vehicle-panel"><div className="section-title"><div><p className="eyebrow">Transport operations</p><h2>Vehicle performance</h2></div><span className="table-caption">{vehicles.length} vehicles this month</span></div>{!vehicleRows.length?<div className="empty-records"><p>Add a vehicle reference to transactions to compare recorded income and costs.</p></div>:<div className="table-scroll"><table className="vehicle-table"><thead><tr><th>Vehicle</th><th>Income</th><th>Expenses</th><th>Recorded net</th></tr></thead><tbody>{vehicleRows.map(v=><tr key={v.name}><th>{v.name}<small>{v.count} records</small></th><td>{money(v.income)}</td><td>{money(v.spent)}</td><td className={v.income-v.spent<0?"budget-over":"positive"}>{money(v.income-v.spent)}</td></tr>)}</tbody></table><p className="budget-caption">Only transactions with vehicle references appear here.</p></div>}</section>}
      {view==="detail"&&<section className="panel category-panel"><div className="section-title"><div><p className="eyebrow">{monthLabel(month)}</p><h2>Category budgets</h2></div><button className="secondary-action" onClick={()=>open("budget")}>Set budget</button></div>{!used.length?<div className="empty-records"><p>Set a monthly category budget or record an expense to begin.</p></div>:<div className="category-list">{used.map(category=><article className="category-row" key={category.name}><span className={`category-icon ${category.tone}`}><Icon name={category.icon}/></span><div className="category-content"><div className="category-heading"><div><strong>{category.name}</strong><small>{money(category.spent)}{category.budget?` of ${money(category.budget)}`:" · No budget set"}</small></div>{category.budget>0&&<b className={category.spent>category.budget?"budget-over":""}>{Math.round(category.spent/category.budget*100)}%</b>}</div>{category.budget>0&&<div className="progress-track"><i style={{width:`${Math.min(100,category.spent/category.budget*100)}%`,background:category.spent>category.budget?"#b42318":category.color}}/></div>}</div></article>)}</div>}</section>}
      </>}
      </div></div>
    <nav className="bottom-nav" aria-label="App navigation"><button className={view==="home"?"active":""} onClick={()=>navigate("home")}><Icon name="home"/><span>Overview</span></button><button className={view==="expenses"?"active":""} onClick={()=>navigate("expenses")}><Icon name="wallet"/><span>Transactions</span></button><button className="add-button" disabled={!ready} onClick={()=>open("transaction")} aria-label="Add an expense"><Icon name="plus"/></button><button onClick={()=>navigate("detail")} className={view==="detail"?"active":""}><Icon name="chart"/><span>Reports</span></button><button disabled={!ready} onClick={()=>open("business")}><Icon name="wallet"/><span>Business</span></button></nav>
    <dialog ref={dialog} className="expense-dialog" aria-labelledby="dialog-title" onCancel={e=>saving&&e.preventDefault()}><form ref={saveForm} className="expense-modal" onSubmit={submit}><div className="modal-heading"><h2 id="dialog-title">{dialogType==="transaction"?`Add ${kind}`:dialogType==="budget"?"Set monthly budget":dialogType==="business"?"Business name":dialogType==="goal"?(editingGoal?"Update savings goal":"New savings goal"):"Remove transaction?"}</h2><button type="button" onClick={close} disabled={saving} aria-label="Close"><Icon name="close"/></button></div>
      {dialogType==="goal"&&<><p className="form-help">Track money you have set aside. This does not transfer funds.</p>{!editingGoal&&<><label>Goal name<input name="name" required maxLength={100} placeholder="e.g. Vehicle maintenance reserve"/></label><label>Target (₦)<input name="target" type="number" min="0.01" max="1000000000" step="0.01" required/></label></>}<label>Amount already saved (₦)<input key={editingGoal?.id||"new"} name="saved" type="number" min="0" max={editingGoal?editingGoal.target_kobo/100:1000000000} step="0.01" defaultValue={editingGoal?editingGoal.saved_kobo/100:0} required/></label></>}
      {dialogType==="transaction"&&<><label>Amount (₦)<input name="amount" type="number" required min="0.01" max="1000000000" step="0.01" inputMode="decimal" autoFocus/></label><label>{kind==="income"?"Income source":"Description"}<input name="description" required maxLength={200} placeholder={kind==="income"?"e.g. Passenger fares":"e.g. Diesel for the Abuja trip"}/></label><label>Date<input name="date" type="date" defaultValue={today()} min="2000-01-01" max="2100-12-31" required/></label>{kind==="expense"&&<label>Category<select name="category" defaultValue="Fuel">{categoryStyles.map(c=><option key={c.name}>{c.name}</option>)}</select></label>}<div className="form-columns"><label>Vehicle (optional)<input name="vehicle" maxLength={80} placeholder="e.g. BUS-01"/></label><label>Trip (optional)<input name="trip" maxLength={120} placeholder="e.g. PH–Abuja"/></label></div></>}
      {dialogType==="budget"&&<><p>{monthLabel(month)}</p><label>Category<select name="category">{categoryStyles.map(c=><option key={c.name}>{c.name}</option>)}</select></label><label>Monthly limit (₦)<input name="amount" type="number" required min="0.01" max="1000000000" step="0.01" inputMode="decimal"/></label><p className="form-help">Saving replaces the limit for this category and month.</p></>}
      {dialogType==="business"&&<label>Business name<input name="businessName" required maxLength={100} defaultValue={workspace?.businessName} autoFocus/></label>}
      {dialogType==="delete"&&<p>{deleteRow?.description} · {money(deleteRow?.amount_kobo||0)} will be removed from your totals and reports.</p>}
      {formError&&<p className="form-error" role="alert">{formError}</p>}<button className="primary-action" disabled={saving}>{saving?"Saving…":dialogType==="delete"?"Remove transaction":dialogType==="transaction"?`Save ${kind}`:"Save"}</button>
    </form></dialog>
  </main>;
}
