/**
 * Calculates the net balance of a bank account by evaluating income, expense, and transfer records.
 * Transfers decrease the source account and increase the destination account without altering global net worth.
 *
 * @param transactions Array of transaction objects with type, amount, and account identifiers
 * @param targetAccountId The specific account ID for which the balance is being computed
 * @returns Net calculated balance in Tomans
 */
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

/**
 * Fetches transactions and computes the live balance for a given account within a Prisma query or transaction context.
 *
 * @param accountId Target bank account ID
 * @param prismaClient Prisma client instance or active transaction handle (tx)
 * @returns Promise resolving to current available balance
 */
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
