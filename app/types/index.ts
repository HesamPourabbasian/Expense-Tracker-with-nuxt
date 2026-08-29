export interface User {
  id: number
  username: string
}

export interface BankAccount {
  id: number
  userId: number
  name: string
  icon: string
  createdAt: string
  updatedAt: string
  _count?: { transactions: number }
  balance?: number
  unnecessaryExpense?: number
}

export interface BankAccountWithBalance extends BankAccount {
  balance: number
  unnecessaryExpense?: number
}

export interface Transaction {
  id: number
  userId: number
  bankAccountId: number
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string | null
  date: string
  isUnnecessary: boolean
  sourceAccountId?: number | null
  destinationAccountId?: number | null
  relatedTransactionId?: number | null
  createdAt: string
  updatedAt?: string
  bankAccount?: { id?: number; name: string; icon: string }
  sourceAccount?: { id: number; name: string; icon: string } | null
  destinationAccount?: { id: number; name: string; icon: string } | null
}

export interface TransferPayload {
  sourceAccountId: number
  destinationAccountId: number
  amount: number
  date: string
  description?: string | null
}

export interface PaginatedTransactions {
  transactions: Transaction[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CashTransaction {
  id: number
  userId: number
  type: 'income' | 'expense'
  amount: number
  description: string | null
  date: string
  createdAt: string
}

export interface Debt {
  id: number
  userId: number
  person: string
  amount: number
  type: 'I_OWE' | 'OWED_TO_ME'
  description: string | null
  status: 'pending' | 'paid'
  date: string
  createdAt: string
  updatedAt: string
}

export interface DashboardData {
  bankAccounts: BankAccountWithBalance[]
  totalBankBalance: number
  cashBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyCashIncome: number
  monthlyCashExpenses: number
  netBalance: number
  debtsIOwe: number
  debtsOwedToMe: number
}

export interface Todo {
  id: number
  userId: number
  title: string
  description: string | null
  date: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface CryptoTrade {
  id: number
  userId: number
  asset: string
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  totalValue: number
  note: string | null
  date: string
  createdAt: string
  realizedProfit?: number
}

export interface CryptoHolding {
  asset: string
  symbol: string
  icon: string
  color: string
  quantity: number
  invested: number
  averagePrice: number
}

export interface CryptoMarketPrice {
  price: number
  change24h: number
}
