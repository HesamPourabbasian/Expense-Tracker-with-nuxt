# هزینه‌追踪 - Expense Tracker

A full-stack personal expense tracker built with Nuxt 3, Vue 3, TypeScript, and PostgreSQL.

## Features

- **Multi-user Authentication** - Login system with Argon2 password hashing
- **Bank Accounts** - Create and manage multiple bank accounts with custom icons
- **Transactions** - Track income and expenses for each bank account
- **Cash Management** - Separate cash tracking from bank accounts
- **Debts & Creditors** - Track money you owe and money owed to you
- **Persian Calendar** - Full Jalali calendar support for dates
- **Dashboard** - Monthly financial overview with balances
- **Responsive UI** - Modern, RTL Persian interface

## Requirements

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd expense-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker?schema=public"
NUXT_SESSION_SECRET="your-secret-key-here"
```

4. Create the database:
```bash
psql -U postgres -c "CREATE DATABASE expense_tracker;"
```

5. Run migrations:
```bash
npm run db:migrate
```

6. Seed the initial user:
```bash
SEED_USERNAME="your-admin-username" SEED_PASSWORD="choose-a-strong-password" npm run db:seed
```

Alternatively, add `SEED_USERNAME` and `SEED_PASSWORD` to your local `.env`, then run:

```bash
npm run db:seed
```

7. Start the development server:
```bash
npm run dev
```

8. Open the application at `http://localhost:3000`

## Project Structure

```
/
├── app/
│   ├── components/        # Vue components
│   ├── layouts/           # Page layouts
│   ├── middleware/         # Route middleware
│   └── pages/             # Application pages
├── server/
│   ├── api/               # API routes
│   ├── middleware/         # Server middleware
│   └── utils/             # Server utilities
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── composables/           # Vue composables
├── types/                 # TypeScript types
└── utils/                 # Utility functions
```

## API Routes

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Bank Accounts
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `PATCH /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Cash Transactions
- `GET /api/cash/transactions` - List cash transactions
- `POST /api/cash/transactions` - Create cash transaction
- `PATCH /api/cash/transactions/:id` - Update cash transaction
- `DELETE /api/cash/transactions/:id` - Delete cash transaction

### Debts
- `GET /api/debts` - List debts
- `POST /api/debts` - Create debt
- `PATCH /api/debts/:id` - Update debt
- `DELETE /api/debts/:id` - Delete debt

### Dashboard
- `GET /api/dashboard?year=&month=` - Get dashboard data

## Database Schema

The application uses the following models:

- **User** - User accounts
- **BankAccount** - Bank accounts per user
- **Transaction** - Bank transactions
- **CashTransaction** - Cash transactions
- **Debt** - Debts and creditors

## Development

```bash
# Start development server
npm run dev

# Run migrations
npm run db:migrate

# Reset database
npm run db:reset

# Seed database
npm run db:seed
```

## License

MIT
