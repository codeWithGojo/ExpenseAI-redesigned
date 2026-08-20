# ExpenseAI

ExpenseAI is a Naira-first expense dashboard designed to make category insights actionable, not decorative.

**Live interactive preview:** https://expense-ai-redesigned.vercel.app/

## Responsive product flow

1. **Home** — profile and notifications, dark balance card, six-month spending analytics, and recent transactions.
2. **Expenses** — month and weekday selector, salary vs. expense summaries, and category budget progress.
3. **Total expense** — monthly spending headline, percentage of income used, category donut chart, legend, and totals.

The interface uses a purple primary palette, coral/orange accents, white cards, a light-gray canvas, and rounded responsive surfaces throughout. Currency stays in Nigerian Naira.

## Why I built it

Most budgeting apps I tried showed where money went after the month ended, but did not explain what to do next—especially for everyday Naira spending. ExpenseAI fills that gap by surfacing patterns early and turning them into simple, useful guidance.

## Built / Learned / Challenge

- **Built:** JWT authentication and per-user isolation in the Express/Prisma API.
- **Learned:** Rule-based financial insight logic can be genuinely useful when it connects budget limits, category spikes, and recurring payments to clear next actions.
- **Challenge:** Category breakdowns are easy to make attractive; the harder work is choosing comparisons that help someone change a spending habit.

## Stack

- **Frontend:** React, Vite, responsive CSS
- **Backend:** Node.js, Express, Prisma
- **Authentication:** JWT
- **Insights:** Rule-based financial coach

## Run locally

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at http://localhost:5173.

For the API:

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

The API runs at http://localhost:5000.

## Deployment note

The public Vercel experience is an interactive frontend showcase. The repository also contains the authenticated backend; connect it to a persistent production database and environment variables before using real financial data.
