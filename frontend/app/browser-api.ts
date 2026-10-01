import {browserStore} from "./browser-store";
import {amount,bounded,categories,uuid,validDate,validMonth} from "../worker/expense-api";
type Row={id:string;kind:"income"|"expense";amount_kobo:number;category:string;description:string;date:string;vehicle:string;trip:string;created_at:string;deleted:number};
type Goal={id:string;name:string;target_kobo:number;saved_kobo:number;created_at:string};
type Budget={month:string;category:string;amount_kobo:number};
type State={businessName:string;transactions:Row[];budgets:Budget[];goals:Goal[]};
const store=browserStore<State>("expenseai-public-ledger-v1",()=>({businessName:"My business",transactions:[],budgets:[],goals:[]}));
export async function browserExpenseApi<T>(path:string,method:string,body?:unknown,signal?:AbortSignal):Promise<T>{
  if(signal?.aborted)throw new DOMException("Aborted","AbortError");
  const url=new URL(path,"https://local.invalid");
  const result=await store(method!=="GET",state=>{
    if(!state||!Array.isArray(state.transactions)||!Array.isArray(state.budgets)||!Array.isArray(state.goals))throw new Error("Saved records cannot be read. Your browser records have been kept.");
    if(url.pathname==="/api/workspace"&&method==="GET"){
      const month=url.searchParams.get("month")||new Date().toISOString().slice(0,7);
      if(!validMonth(month))throw new Error("Choose a valid month.");
      const end=new Date(Date.UTC(+month.slice(0,4),+month.slice(5,7),1)).toISOString().slice(0,10);
      const start=month+"-01",historyStart=new Date(Date.UTC(+month.slice(0,4),+month.slice(5,7)-6,1)).toISOString().slice(0,10);
      const rows=state.transactions.filter(r=>!r.deleted),history=new Map<string,number>();
      for(const r of rows)if(r.kind==="expense"&&r.date>=historyStart&&r.date<end){const m=r.date.slice(0,7);history.set(m,(history.get(m)||0)+r.amount_kobo);}
      return {businessName:state.businessName,email:"Saved on this browser",month,transactions:rows.filter(r=>r.date>=start&&r.date<end).sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at)),budgets:state.budgets.filter(b=>b.month===month),history:[...history].map(([month,amount_kobo])=>({month,amount_kobo})),goals:[...state.goals].sort((a,b)=>b.created_at.localeCompare(a.created_at))};
    }
    const id=url.pathname.split("/")[3];
    if(method==="DELETE"&&url.pathname.startsWith("/api/transactions/")&&uuid(id)){
      const row=state.transactions.find(r=>r.id===id&&!r.deleted);if(!row)throw new Error("Transaction not found.");row.deleted=1;return {ok:true};
    }
    if(!body||typeof body!=="object"||Array.isArray(body))throw new Error("Invalid record data.");const b=body as Record<string,unknown>;
    if(method==="PUT"&&url.pathname==="/api/workspace"){state.businessName=bounded(b.businessName,100,true);return {ok:true};}
    if(method==="POST"&&url.pathname==="/api/budgets"){
      const month=bounded(b.month,7,true),category=bounded(b.category,40,true);
      if(!validMonth(month)||!categories.includes(category))throw new Error("Choose a valid month and expense category.");
      const limit=amount(b.amount),old=state.budgets.find(r=>r.month===month&&r.category===category);
      if(old)old.amount_kobo=limit;else state.budgets.push({month,category,amount_kobo:limit});return {ok:true};
    }
    if(method==="POST"&&url.pathname==="/api/transactions"){
      if(!uuid(b.id))throw new Error("Invalid transaction reference.");const kind=b.kind,category=bounded(b.category,40,true),date=bounded(b.date,10,true);
      if((kind!=="income"&&kind!=="expense")||!validDate(date)||(kind==="expense"?!categories.includes(category):category!=="Business income"))throw new Error("Check the transaction type, category and date.");
      const row:Row={id:String(b.id),kind,amount_kobo:amount(b.amount),category,description:bounded(b.description,200,true),date,vehicle:bounded(b.vehicle,80),trip:bounded(b.trip,120),created_at:new Date().toISOString(),deleted:0};
      const old=state.transactions.find(r=>r.id===row.id);
      if(old){if(Object.keys(row).filter(k=>k!=="created_at"&&k!=="deleted").some(k=>old[k as keyof Row]!==row[k as keyof Row]))throw new Error("That reference is already in use. Reopen the form and try again.");}
      else state.transactions.push(row);return {ok:true};
    }
    if(method==="POST"&&url.pathname==="/api/goals"){
      if(!uuid(b.id))throw new Error("Invalid goal reference.");const name=bounded(b.name,100,true),target=amount(b.target),saved=/^0+(\.0{1,2})?$/.test(String(b.saved))?0:amount(b.saved);
      if(saved>target)throw new Error("Saved amount cannot exceed the goal target.");
      const goal:Goal={id:String(b.id),name,target_kobo:target,saved_kobo:saved,created_at:new Date().toISOString()},old=state.goals.find(g=>g.id===goal.id);
      if(old){if(old.name!==name||old.target_kobo!==target||old.saved_kobo!==saved)throw new Error("That goal reference is already in use. Reopen the form.");}else state.goals.push(goal);return {ok:true};
    }
    if(method==="PUT"&&url.pathname.startsWith("/api/goals/")&&uuid(id)){
      const goal=state.goals.find(g=>g.id===id);if(!goal)throw new Error("Goal not found.");const saved=/^0+(\.0{1,2})?$/.test(String(b.saved))?0:amount(b.saved);
      if(saved>goal.target_kobo)throw new Error("Saved amount cannot exceed the goal target.");goal.saved_kobo=saved;return {ok:true};
    }
    throw new Error("Endpoint not found.");
  });
  if(signal?.aborted)throw new DOMException("Aborted","AbortError");return result as T;
}
