# خرج‌یار

<div align="center">

**A private, Persian-first workspace for personal finance, daily planning, and cryptocurrency portfolio tracking.**

[![Nuxt](https://img.shields.io/badge/Nuxt-4.5-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3.5-42B883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

## Overview

خرج‌یار is a full-stack Nuxt application for managing personal finances in a responsive RTL interface. It combines bank and cash accounting, debt tracking, daily performance planning, and a local cryptocurrency portfolio ledger in one private workspace.

The interface uses Persian dates and typography, displays current Iranian time, and is optimized for mobile, tablet, and desktop screens.

> [!IMPORTANT]
> The cryptocurrency section is a **local portfolio ledger**. It records trades and calculates portfolio performance, but it does not connect to an exchange account or place real orders.

## Features

### Personal Finance

- Multiple bank accounts with custom icons
- Income and expense transactions for each account
- Separate cash wallet and cash transaction history
- Monthly dashboard based on the Jalali calendar
- Bank, cash, income, expense, and net-balance summaries
- Debt and receivable tracking
- Pending and settled debt states

### Daily Planner

- Independent task list for every day
- Previous and next day navigation
- Persian calendar date display
- Task descriptions, editing, completion, and deletion
- Daily completion percentage
- Completed, pending, and total task metrics

### Cryptocurrency Portfolio

- Local buy and sell records for:
  - Bitcoin (`BTC`)
  - Tether (`USDT`)
  - Ethereum (`ETH`)
  - Solana (`SOL`)
  - Litecoin (`LTC`)
  - Dogecoin (`DOGE`)
- Dedicated asset icons and colors
- Weighted average purchase price
- Remaining cost basis
- Realized and unrealized profit/loss
- Overselling protection
- Live Iranian market prices from the public Wallex API
- Automatic market refresh every 60 seconds
- Server-side quote caching and stale-data fallback

### Interface And Security

- Responsive Persian RTL interface
- Mobile bottom navigation and desktop sidebar
- Iranian date and `Asia/Tehran` clock on every page
- Password hashing with Argon2
- Signed, HTTP-only, expiring session cookies
- Per-user ownership checks on application data
- Local Iconify collections for reliable icon rendering

## Currency Units

The application intentionally uses two units:

| Area | Unit | Reason |
| --- | --- | --- |
| Bank, cash, debt, and dashboard | Toman (`تومان`) | Common personal-finance convention in Iran |
| Cryptocurrency trades and live valuation | Iranian rial (`ریال`) | Live Wallex toman quotes are converted to true IRR by multiplying by 10 |

Do not enter toman values in crypto transaction fields. Crypto purchase and sale prices are stored and displayed in rial.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Application | Nuxt 4, Vue 3, TypeScript |
| Styling | Tailwind CSS, Vazirmatn |
| Database | PostgreSQL |
| ORM | Prisma ORM 7 with `@prisma/adapter-pg` |
| Authentication | Argon2 and signed cookies |
| Dates | Jalali Moment and `Intl.DateTimeFormat` |
| Icons | Nuxt Icon and local Iconify collections |
| Market data | Wallex public markets API |

## Requirements

- Node.js `22.19+`, `24.11+`, or `26+`
- npm
- PostgreSQL 12 or newer

Node.js 25 is not in Nuxt's declared support range. Use an active supported release for development and deployment.

## Getting Started

### 1. Clone The Repository

```bash
git clone https://github.com/HesamPourabbasian/Expense-Tracker-with-nuxt.git
cd Expense-Tracker-with-nuxt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create A PostgreSQL Database

```bash
createdb expense_tracker
```

You can also create it with `psql`:

```bash
psql -U postgres -c 'CREATE DATABASE expense_tracker;'
```

### 4. Configure The Environment

```bash
cp .env.example .env
```

Update `.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_tracker?schema=public"
NUXT_SESSION_SECRET="replace-with-a-long-random-secret"
SEED_USERNAME="your-admin-username"
SEED_PASSWORD="choose-a-strong-password"
```

Generate a session secret with OpenSSL:

```bash
openssl rand -base64 48
```

For a passwordless local PostgreSQL installation on macOS, use its Unix socket:

```dotenv
DATABASE_URL="postgresql://your-user@localhost/expense_tracker?host=%2Ftmp"
```

### 5. Apply Database Migrations

```bash
npm run db:migrate
```

This creates all required tables, indexes, and foreign keys.

### 6. Create The Initial User

If `SEED_USERNAME` and `SEED_PASSWORD` are present in `.env`:

```bash
npm run db:seed
```

You can also provide the values for one command:

```bash
SEED_USERNAME="admin" SEED_PASSWORD="a-strong-password" npm run db:seed
```

No default credentials are included in the repository.

### 7. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Nuxt development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run generate` | Generate a static Nuxt output where supported |
| `npm run typecheck` | Run Nuxt and Vue TypeScript checks |
| `npm run db:migrate` | Create and apply development migrations |
| `npm run db:seed` | Create the initial user from environment variables |
| `npm run db:reset` | Delete local database data and reapply migrations |

> [!CAUTION]
> `npm run db:reset` is destructive. It removes all users, transactions, tasks, debts, and crypto records in the configured database.

## Project Structure

```text
.
├── app/
│   ├── assets/css/          # Global Tailwind layers and design tokens
│   ├── components/          # Modals, notifications, and shared UI
│   ├── composables/         # Auth, formatting, constants, and toast state
│   ├── layouts/             # Authenticated application shell
│   ├── middleware/          # Client-side route protection
│   ├── pages/               # Dashboard and feature routes
│   ├── types/               # Shared TypeScript interfaces
│   └── utils/               # Formatting and application constants
├── prisma/
│   ├── migrations/          # Versioned PostgreSQL migrations
│   ├── schema.prisma        # Prisma data model
│   └── seed.ts              # Environment-driven initial user seed
├── public/                  # Static public files
├── server/
│   ├── api/                 # Authenticated Nitro API routes
│   ├── middleware/          # Server-side API authentication
│   └── utils/               # Prisma, sessions, auth, and crypto accounting
├── nuxt.config.ts           # Nuxt modules, fonts, theme, and runtime config
├── prisma.config.ts         # Prisma CLI datasource and migration config
└── package.json             # Scripts and dependencies
```

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Monthly financial dashboard |
| `/accounts` | Bank account management |
| `/accounts/:id` | Account transaction history |
| `/cash` | Cash wallet management |
| `/debts` | Debts and receivables |
| `/todos` | Daily planner and performance |
| `/crypto` | Cryptocurrency portfolio ledger |
| `/login` | User authentication |

## API Reference

All feature endpoints require an authenticated session unless noted otherwise.

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Authenticate with username and password |
| `POST` | `/api/auth/logout` | Clear the active session |
| `GET` | `/api/auth/me` | Return the current user |

### Financial Data

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET`, `POST` | `/api/accounts` | List or create bank accounts |
| `GET`, `PATCH`, `DELETE` | `/api/accounts/:id` | Read, update, or delete an account |
| `GET`, `POST` | `/api/transactions` | List or create bank transactions |
| `PATCH`, `DELETE` | `/api/transactions/:id` | Update or delete a bank transaction |
| `GET`, `POST` | `/api/cash/transactions` | List or create cash transactions |
| `PATCH`, `DELETE` | `/api/cash/transactions/:id` | Update or delete a cash transaction |
| `GET`, `POST` | `/api/debts` | List or create debts and receivables |
| `PATCH`, `DELETE` | `/api/debts/:id` | Update or delete a debt record |
| `GET` | `/api/dashboard?year=1405&month=5` | Return a Jalali monthly summary |

### Daily Planner

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/todos?date=YYYY-MM-DD` | Return tasks and daily performance |
| `POST` | `/api/todos` | Create a task |
| `PATCH` | `/api/todos/:id` | Edit or complete a task |
| `DELETE` | `/api/todos/:id` | Delete a task |

### Cryptocurrency

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/crypto` | Return holdings, trades, and profit/loss |
| `POST` | `/api/crypto` | Record a local buy or sell transaction |
| `DELETE` | `/api/crypto/:id` | Delete a transaction when accounting remains valid |
| `GET` | `/api/crypto/prices` | Return cached live prices in Iranian rial |

## Cryptocurrency Pricing

The server fetches public `TMN` market quotes from Wallex and converts them to Iranian rial:

```text
IRR price = Wallex TMN price × 10
```

Quotes are cached in memory for 60 seconds. If a refresh fails after at least one successful request, the API returns the last cached response with `stale: true`. If no cached response exists, it returns HTTP `502`.

Live market data is informational and may differ from the final execution price on an exchange. The trade form allows the fetched value to be adjusted before saving.

## Database Models

| Model | Purpose |
| --- | --- |
| `User` | Credentials and ownership root |
| `BankAccount` | User-created financial accounts |
| `Transaction` | Bank income and expenses |
| `CashTransaction` | Cash income and expenses |
| `Debt` | Debts and receivables |
| `Todo` | Daily tasks and completion state |
| `CryptoTrade` | Local cryptocurrency buy and sell records |

## Production

Build the application:

```bash
npm ci
npx prisma migrate deploy
npm run build
```

Start the generated Node server:

```bash
node .output/server/index.mjs
```

Production requirements:

- Set a strong, unique `NUXT_SESSION_SECRET`.
- Set `DATABASE_URL` to the production PostgreSQL instance.
- Run `npx prisma migrate deploy` before starting the new application version.
- Serve the application behind HTTPS so secure session cookies are enabled.
- Use a supported Node.js release.

## Verification

Run these checks before opening a pull request or deploying:

```bash
npm run typecheck
npm run build
npx prisma migrate status
```

## Security Notes

- Passwords are hashed with Argon2 and are never returned by the API.
- Session cookies are HTTP-only, signed, same-site, and expire after seven days.
- CRUD operations scope records to the authenticated user.
- Do not commit `.env`, production connection strings, or seed credentials.
- The live price endpoint uses public market data and does not require an exchange API key.

## License

No license file is currently included. Add a license before distributing or accepting external contributions.
