import prisma from '~~/server/utils/prisma'
import moment from 'jalali-moment'
import { calculateAccountBalance } from '~~/server/utils/account'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  const currentYear = Number(moment().format('jYYYY'))
  const currentMonth = Number(moment().format('jMM'))
  const year = Number(query.year) || currentYear
  const month = Number(query.month) || currentMonth

  if (!Number.isInteger(year) || year < 1200 || year > 1600 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Jalali year or month' })
  }

  const startOfMonth = moment(`${year}/${month}/1`, 'jYYYY/jM/jD').startOf('day').toDate()
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const startOfNextMonth = moment(`${nextYear}/${nextMonth}/1`, 'jYYYY/jM/jD').startOf('day').toDate()

  const [accounts, cashTransactions, monthlyBankTransactions, debts] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        icon: true,
        transactions: {
          select: {
            type: true,
            amount: true,
            bankAccountId: true,
            sourceAccountId: true,
            destinationAccountId: true
          }
        }
      }
    }),
    prisma.cashTransaction.findMany({
      where: { userId: user.id },
      select: { type: true, amount: true, date: true }
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfMonth, lt: startOfNextMonth }
      },
      select: { type: true, amount: true }
    }),
    prisma.debt.findMany({
      where: { userId: user.id, status: 'pending' },
      select: { type: true, amount: true, status: true }
    })
  ])

  const bankAccounts = accounts.map(account => {
    const balance = calculateAccountBalance(account.transactions, account.id)
    return {
      id: account.id,
      name: account.name,
      icon: account.icon,
      balance
    }
  })

  const totalBankBalance = bankAccounts.reduce((acc, a) => acc + a.balance, 0)

  const cashBalance = cashTransactions.reduce((acc, t) => {
    return acc + (t.type === 'income' ? t.amount : -t.amount)
  }, 0)

  const monthlyIncome = monthlyBankTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)

  const monthlyExpenses = monthlyBankTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0)

  const monthlyCashIncome = cashTransactions
    .filter(t => t.type === 'income' && t.date >= startOfMonth && t.date < startOfNextMonth)
    .reduce((acc, t) => acc + t.amount, 0)

  const monthlyCashExpenses = cashTransactions
    .filter(t => t.type === 'expense' && t.date >= startOfMonth && t.date < startOfNextMonth)
    .reduce((acc, t) => acc + t.amount, 0)

  const debtsIOwe = debts
    .filter(d => d.type === 'I_OWE' && d.status === 'pending')
    .reduce((acc, d) => acc + d.amount, 0)

  const debtsOwedToMe = debts
    .filter(d => d.type === 'OWED_TO_ME' && d.status === 'pending')
    .reduce((acc, d) => acc + d.amount, 0)

  return {
    bankAccounts,
    totalBankBalance,
    cashBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyCashIncome,
    monthlyCashExpenses,
    netBalance: monthlyIncome + monthlyCashIncome - monthlyExpenses - monthlyCashExpenses,
    debtsIOwe,
    debtsOwedToMe
  }
})
