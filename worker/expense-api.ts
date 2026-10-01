export interface Database {
  prepare(sql: string): Statement;
}
interface Statement {
  bind(...values: unknown[]): Statement;
  all(): Promise<{ results: Record<string, unknown>[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
export const categories = ["Fuel", "Maintenance", "Driver allowance", "Tolls & parking", "Insurance", "Office", "Food & Drinks", "Transport", "Bills & Utilities", "Other"];
const json = (value: unknown, status = 200) => Response.json(value, {status, headers: {"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"}});
export const validMonth = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0,4)) >= 2000 && Number(value.slice(0,4)) <= 2100;
export const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !validMonth(value.slice(0,7))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
};
export function amount(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") throw new Error("Enter a valid amount.");
  const text = String(value);
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error("Use a positive amount with at most two decimal places.");
  const kobo = Math.round(Number(text) * 100);
  if (!Number.isSafeInteger(kobo) || kobo <= 0 || kobo > 100_000_000_000) throw new Error("Amount must be greater than zero and no more than ₦1 billion.");
  return kobo;
}
export function bounded(value: unknown, max: number, required = false) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > max || (required && !text)) throw new Error(`Enter ${required ? "a value" : "text"} of at most ${max} characters.`);
  return text;
}
export function uuid(value: unknown) { return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value); }
export async function handleExpenseApi(request: Request, db?: Database): Promise<Response> {
  const url = new URL(request.url);
  const owner = request.headers.get("oai-authenticated-user-id");
  if (!owner) return json({error: "Sign in to access your business records."}, 401);
  if (!db) return json({error: "Records are temporarily unavailable. Please try again."}, 503);
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    if ((origin && origin !== url.origin) || request.headers.get("sec-fetch-site") === "cross-site") return json({error: "Request origin is not allowed."}, 403);
  }
  try {
    if (url.pathname === "/api/workspace" && request.method === "GET") {
      const month = url.searchParams.get("month") || new Date().toISOString().slice(0,7);
      if (!validMonth(month)) return json({error: "Choose a valid month."}, 400);
      const start = `${month}-01`;
      const end = new Date(Date.UTC(Number(month.slice(0,4)), Number(month.slice(5,7)),1)).toISOString().slice(0,10);
      const historyStart = new Date(Date.UTC(Number(month.slice(0,4)), Number(month.slice(5,7))-6,1)).toISOString().slice(0,10);
      const [profile, records, limits, history, goals] = await Promise.all([
        db.prepare("SELECT business_name FROM business_profiles WHERE owner_id = ?").bind(owner).all(),
        db.prepare("SELECT id, kind, amount_kobo, category, description, date, vehicle, trip FROM transactions WHERE owner_id = ? AND deleted = 0 AND date >= ? AND date < ? ORDER BY date DESC, created_at DESC").bind(owner,start,end).all(),
        db.prepare("SELECT category, amount_kobo FROM budgets WHERE owner_id = ? AND month = ?").bind(owner,month).all(),
        db.prepare("SELECT substr(date,1,7) AS month, sum(amount_kobo) AS amount_kobo FROM transactions WHERE owner_id = ? AND deleted = 0 AND kind = 'expense' AND date >= ? AND date < ? GROUP BY substr(date,1,7)").bind(owner,historyStart,end).all(),
        db.prepare("SELECT id,name,target_kobo,saved_kobo FROM savings_goals WHERE owner_id = ? ORDER BY created_at DESC").bind(owner).all(),
      ]);
      return json({businessName: profile.results[0]?.business_name || "My business", email: request.headers.get("oai-authenticated-user-email") || "", month, transactions: records.results, budgets: limits.results, history: history.results, goals: goals.results});
    }
    if (request.method === "DELETE" && url.pathname.startsWith("/api/transactions/")) {
      const id = url.pathname.split("/").pop();
      if (!uuid(id)) return json({error: "Invalid transaction."},400);
      const result = await db.prepare("UPDATE transactions SET deleted = 1 WHERE id = ? AND owner_id = ? AND deleted = 0").bind(id,owner).run();
      return result.meta.changes ? json({ok:true}) : json({error:"Transaction not found."},404);
    }
    if (request.method !== "POST" && request.method !== "PUT") return json({error:"Endpoint not found."},404);
    if (!request.headers.get("content-type")?.includes("application/json")) return json({error:"Send JSON data."},415);
    const bodyText = await request.text();
    if (bodyText.length > 32768) return json({error:"Request is too large."},413);
    let body: Record<string,unknown>;
    try { body = JSON.parse(bodyText); } catch { return json({error:"Invalid JSON."},400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({error:"Invalid data."},400);
    if (url.pathname === "/api/goals" && request.method === "POST") {
      if (!uuid(body.id)) return json({error:"Invalid goal reference."},400);
      const name=bounded(body.name,100,true),target=amount(body.target);
      const saved=/^0+(\.0{1,2})?$/.test(String(body.saved))?0:amount(body.saved);
      if(saved>target)return json({error:"Saved amount cannot exceed the goal target."},400);
      const previous=await db.prepare("SELECT owner_id,name,target_kobo,saved_kobo FROM savings_goals WHERE id = ?").bind(body.id).all();
      if(previous.results.length){const old=previous.results[0];return old.owner_id===owner&&old.name===name&&old.target_kobo===target&&old.saved_kobo===saved?json({ok:true}):json({error:"That goal reference is already in use. Reopen the form."},409);}
      await db.prepare("INSERT INTO savings_goals (id,owner_id,name,target_kobo,saved_kobo,created_at) VALUES (?,?,?,?,?,?)").bind(body.id,owner,name,target,saved,new Date().toISOString()).run();return json({ok:true},201);
    }
    if (url.pathname.startsWith("/api/goals/") && request.method === "PUT") {
      const id=url.pathname.split('/').pop();if(!uuid(id))return json({error:"Invalid goal reference."},400);
      const saved=/^0+(\.0{1,2})?$/.test(String(body.saved))?0:amount(body.saved);
      const previous=await db.prepare("SELECT target_kobo FROM savings_goals WHERE id = ? AND owner_id = ?").bind(id,owner).all();
      if(!previous.results.length)return json({error:"Goal not found."},404);
      if(saved>Number(previous.results[0].target_kobo))return json({error:"Saved amount cannot exceed the goal target."},400);
      await db.prepare("UPDATE savings_goals SET saved_kobo = ? WHERE id = ? AND owner_id = ?").bind(saved,id,owner).run();return json({ok:true});
    }
    if (url.pathname === "/api/workspace" && request.method === "PUT") {
      const name = bounded(body.businessName,100,true);
      await db.prepare("INSERT INTO business_profiles (owner_id,business_name) VALUES (?,?) ON CONFLICT(owner_id) DO UPDATE SET business_name = excluded.business_name").bind(owner,name).run();
      return json({ok:true});
    }
    if (url.pathname === "/api/budgets" && request.method === "POST") {
      const month = bounded(body.month,7,true), category = bounded(body.category,40,true);
      if (!validMonth(month) || !categories.includes(category)) return json({error:"Choose a valid month and expense category."},400);
      await db.prepare("INSERT INTO budgets (id,owner_id,month,category,amount_kobo) VALUES (?,?,?,?,?) ON CONFLICT(owner_id,month,category) DO UPDATE SET amount_kobo = excluded.amount_kobo").bind(crypto.randomUUID(),owner,month,category,amount(body.amount)).run();
      return json({ok:true});
    }
    if (url.pathname === "/api/transactions" && request.method === "POST") {
      if (!uuid(body.id)) return json({error:"Invalid transaction reference."},400);
      const kind = body.kind, category = bounded(body.category,40,true), date = bounded(body.date,10,true);
      if ((kind !== "income" && kind !== "expense") || !validDate(date) || (kind === "expense" ? !categories.includes(category) : category !== "Business income")) return json({error:"Check the transaction type, category and date."},400);
      const values = [body.id,owner,kind,amount(body.amount),category,bounded(body.description,200,true),date,bounded(body.vehicle,80),bounded(body.trip,120),new Date().toISOString()];
      // Retrying the same request cannot create a second charge in the ledger.
      const previous = await db.prepare("SELECT owner_id, kind, amount_kobo, category, description, date, vehicle, trip FROM transactions WHERE id = ?").bind(body.id).all();
      if (previous.results.length) {
        const old = previous.results[0];
        const fields = ["owner_id","kind","amount_kobo","category","description","date","vehicle","trip"];
        if (!fields.every((field,i)=>old[field]===values[i+1])) return json({error:"That reference is already in use. Reopen the form and try again."},409);
        return json({ok:true},200);
      }
      await db.prepare("INSERT INTO transactions (id,owner_id,kind,amount_kobo,category,description,date,vehicle,trip,created_at,deleted) VALUES (?,?,?,?,?,?,?,?,?,?,0)").bind(...values).run();
      return json({ok:true},201);
    }
    return json({error:"Endpoint not found."},404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/^(Enter |Use a positive|Amount must)/.test(message)) return json({error:message},400);
    console.error("ExpenseAI records unavailable", error);
    return json({error:"Could not save or load records. Your input has been kept; please try again."},503);
  }
}
