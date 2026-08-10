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
}

export interface BankAccountWithBalance extends BankAccount {
  balance: number
}

export interface Transaction {
  id: number
  userId: number
  bankAccountId: number
  type: 'income' | 'expense'
  amount: number
  description: string | null
  date: string
  createdAt: string
  bankAccount?: { name: string; icon: string }
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
