export function calculateAccountBalance(
  transactions: {
    type: string
    amount: number
    bankAccountId?: number
    sourceAccountId?: number | null
    destinationAccountId?: number | null
  }[],
  targetAccountId?: number
): number {
  return transactions.reduce((acc, t) => {
    if (t.type === 'income') return acc + t.amount
    if (t.type === 'expense') return acc - t.amount
    if (t.type === 'transfer' || t.type === 'TRANSFER') {
      const accountId = targetAccountId ?? t.bankAccountId
      if (accountId && t.sourceAccountId === accountId) return acc - t.amount
      if (accountId && t.destinationAccountId === accountId) return acc + t.amount
    }
    return acc
  }, 0)
}

export async function getAccountCurrentBalance(
  accountId: number,
  prismaClient: any
): Promise<number> {
  const transactions = await prismaClient.transaction.findMany({
    where: { bankAccountId: accountId },
    select: {
      type: true,
      amount: true,
      bankAccountId: true,
      sourceAccountId: true,
      destinationAccountId: true
    }
  })
  return calculateAccountBalance(transactions, accountId)
}
