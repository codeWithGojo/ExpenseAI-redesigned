# ExpenseAI

A full-stack expense tracker with an AI financial coach.

- **Backend:** Node.js + Express + Prisma (SQLite locally, Postgres-ready for production) + JWT auth
- **Frontend:** React + Vite + Tailwind + Recharts
- **AI:** Rule-based coach out of the box (no API key needed) — swap in a real LLM call in `backend/src/routes/ai.js` when ready

## Capabilities

- Register / login (JWT)
- Add, edit, delete, search and categorise expenses
- Track income and calculate a live net balance
- Create savings goals and visualise progress
- Responsive white-theme finance dashboard with category analytics
- Rule-based financial insights and simple question matching
- Per-user data isolation through JWT-protected API routes

## Current limitations

- The “AI” coach is deterministic rules, not a generative model. It cannot reason beyond stored totals, categories and goals.
- Totals are lifetime totals; monthly/date-range reporting is not implemented yet.
- SQLite and floating-point money values are suitable for an MVP, not accounting-grade production. Use Postgres and integer minor units/Decimal before handling real money.
- There is no password reset, email verification, refresh-token flow or multi-factor authentication.
- There are no bank connections, transaction imports, recurring transactions, budgets, notifications or multi-currency conversion.
- The app has no automated backend test suite yet and does not provide financial advice or predictions.

## Fixes in this revision

- Added strict positive-number and valid-date checks for expenses, income and goals.
- Normalised login/register emails and added a minimum password length.
- Added expired-session handling, visible loading/error states and usable empty states.
- Exposed income and savings goals in the dashboard instead of leaving backend features hidden.
- Added server configuration guards, request-size limits and a generic error response.
- Rebuilt the frontend as a responsive white finance interface with accessible forms and Nigerian Naira formatting.

## Run locally

**Backend**
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```
Runs on http://localhost:5000

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173 (proxies `/api` to the backend)

## Run with Docker

```bash
docker-compose up --build
```

## Push to your own GitHub repo

From the project root:

```bash
git init
git add .
git commit -m "Initial ExpenseAI build"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Roadmap (next phases)

- Swap SQLite → Postgres for production (`schema.prisma` provider)
- Replace rule-based AI with a real LLM call (OpenAI/Anthropic) in `ai.js`
- Add fraud/anomaly detection on expenses
- Add recurring expenses + budgets
- Add tests + deploy pipeline (Railway/Render/Vercel)
