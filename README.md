# ExpenseAI business pilot

A private Naira-first ledger for a small business, with transport-company fields.

## Working flows

- Account-scoped business name, income, expenses and category budgets stored in D1.
- Integer kobo amounts, transaction dates, vehicle and trip references.
- Monthly totals and six-month expense history derived from saved records.
- Search, date and vehicle filters; CSV export follows those filters and escapes spreadsheet formulas.
- Validation, retry-safe transaction references, soft removal and recoverable errors.
- New accounts start empty. No sample financial figures or browser-stored records.

## Access and scope

This is the existing owner-private Sites deployment. The dispatcher supplies the authenticated user ID; every read and write is scoped to it. An API request without a user identity receives 401. Origin checks protect write requests. A business currently belongs to one signed-in account; shared staff roles, receipt uploads and billing are not implemented. Insights are deterministic descriptions of recorded activity, not a generative AI service or bank integration.

The public Vercel release uses the same dashboard with browser-only storage; the private Sites ledger retains account-scoped D1 storage.

## Development

Keep `.openai/hosting.json` and its existing project ID. D1 is bound as `DB`. Add schema changes to `db/schema.ts`, generate migrations with `npm run db:generate`, and preserve applied migrations. The API is routed through `worker/expense-api.ts`.

```sh
npm run install:ci
node --test tests/records.test.mjs
npx tsc --noEmit
npm run build
```

The database tests use disposable on-disk SQLite records and cover reopen persistence, account isolation, month filtering, cents, budgets, duplicate requests, validation and removal. Cloudflare runtime declarations in `types/` were generated with the installed Wrangler version.

## Public Vercel release

The public Vercel build uses `NEXT_PUBLIC_STORAGE_MODE=browser`. New records are stored in IndexedDB on the visitor's browser, without a login. They do not sync across devices and clearing site data removes them. No private account records are included. Private Sites builds keep the existing identity-bound D1 API.

The existing Vercel project uses the `frontend` root directory. That folder is a self-contained public build generated from the canonical root application. Run `node scripts/sync-public.mjs` after editing the shared dashboard. Its dependencies and assets resolve inside the configured build root.
