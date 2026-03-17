# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Primary artifact is **ThunderBill ⚡** — a GST-compliant Invoice/Billing System for small businesses and freelancers in India.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **Auth**: Custom session-based auth (bcryptjs + express-session + connect-pg-simple)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── thunderbill/        # ThunderBill React frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## ThunderBill Features

- **Custom Auth**: Register/Login with username, email, phone, password (bcrypt hashed)
- **Forgot Password**: OTP-based flow (OTP printed to console in dev mode, 10-min expiry)
- **Session**: httpOnly cookie (name: `thunderbill_session`) stored in PostgreSQL via connect-pg-simple
- **Clients CRUD**: Manage clients with name, email, phone, GSTIN, address
- **Items CRUD**: Products/services with HSN code, rate, GST percentage
- **Invoices**: Create with dynamic line items, auto-calculate CGST/SGST, grand total; mark as Paid/Partial/Unpaid
- **Invoice Numbers**: Auto-generated TB-YEAR-NNNN format
- **PDF Export**: GET /api/invoices/:id/pdf returns printable HTML invoice
- **Dashboard**: Total due, overdue count, total paid, recent invoices

## DB Schema

- `users` — id, username, email, phone, password_hash, created_at
- `clients` — id, name, email, phone, gstin, address, user_id, created_at
- `items` — id, name, hsn_code, rate, gst_percent, user_id, created_at
- `invoices` — id, invoice_number, date, client_id, subtotal, gst_amount, grand_total, status, due_date, user_id, created_at
- `invoice_items` — id, invoice_id, description, quantity, rate, gst_percent, amount
- `user_sessions` — (auto-created by connect-pg-simple)

## API Routes

All routes under `/api`. Protected routes require session cookie.

### Auth (public)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-otp`

### Protected
- `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/:id`
- `GET/POST /api/items`, `GET/PUT/DELETE /api/items/:id`
- `GET/POST /api/invoices`, `GET/PUT/DELETE /api/invoices/:id`
- `PATCH /api/invoices/:id/status`
- `GET /api/invoices/:id/pdf`
- `GET /api/dashboard`

## Running

- Frontend: `pnpm --filter @workspace/thunderbill run dev`
- API: `pnpm --filter @workspace/api-server run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
