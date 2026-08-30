import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { person, amount, type, description, date, status, paymentMethod, bankAccountId, paymentDate } = body

  if (!person || !amount || !type || !date) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  if (!['I_OWE', 'OWED_TO_ME'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type must be I_OWE or OWED_TO_ME' })
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive number' })
  }

  const isPaid = status === 'paid'
  const resolvedPaymentDate = paymentDate ? new Date(paymentDate) : new Date(date)

  if (isPaid) {
    if (!paymentMethod || !['bank', 'cash'].includes(paymentMethod)) {
      throw createError({ statusCode: 400, statusMessage: 'لطفاً روش پرداخت (حساب بانکی یا نقدی) را مشخص کنید' })
    }
    if (paymentMethod === 'bank' && (!bankAccountId || !Number.isInteger(Number(bankAccountId)))) {
      throw createError({ statusCode: 400, statusMessage: 'لطفاً حساب بانکی را انتخاب کنید' })
    }
  }

  return await prisma.$transaction(async (tx) => {
    let createdTransactionId: number | null = null
    let createdCashTransactionId: number | null = null
    let targetBankAccountId: number | null = null

    if (isPaid) {
      const txType = type === 'I_OWE' ? 'expense' : 'income'
      const baseNote = type === 'I_OWE' ? `پرداخت بدهی به ${person}` : `دریافت طلب از ${person}`
      const txDescription = description ? `${baseNote} (${description})` : baseNote

      if (paymentMethod === 'bank') {
        targetBankAccountId = Number(bankAccountId)
        const account = await tx.bankAccount.findUnique({ where: { id: targetBankAccountId } })
        if (!account || account.userId !== user.id) {
          throw createError({ statusCode: 404, statusMessage: 'حساب بانکی یافت نشد' })
        }

        const newTx = await tx.transaction.create({
          data: {
            userId: user.id,
            bankAccountId: targetBankAccountId,
            type: txType,
            amount,
            description: txDescription,
            date: resolvedPaymentDate
          }
        })
        createdTransactionId = newTx.id
      } else if (paymentMethod === 'cash') {
        const newCashTx = await tx.cashTransaction.create({
          data: {
            userId: user.id,
            type: txType,
            amount,
            description: txDescription,
            date: resolvedPaymentDate
          }
        })
        createdCashTransactionId = newCashTx.id
      }
    }

    const debt = await tx.debt.create({
      data: {
        userId: user.id,
        person,
        amount,
        type,
        description: description || null,
        status: isPaid ? 'paid' : 'pending',
        date: new Date(date),
        paymentDate: isPaid ? resolvedPaymentDate : null,
        bankAccountId: targetBankAccountId,
        isCash: isPaid && paymentMethod === 'cash',
        transactionId: createdTransactionId,
        cashTransactionId: createdCashTransactionId
      },
      include: {
        bankAccount: {
          select: { id: true, name: true, icon: true }
        }
      }
    })

    return debt
  })
})
