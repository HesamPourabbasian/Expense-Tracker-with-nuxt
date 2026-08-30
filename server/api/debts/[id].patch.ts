import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  const { person, amount, type, description, status, date, paymentMethod, bankAccountId, paymentDate } = body

  if (type && !['I_OWE', 'OWED_TO_ME'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type must be I_OWE or OWED_TO_ME' })
  }

  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive number' })
  }

  if (status && !['pending', 'paid'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Status must be pending or paid' })
  }

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.debt.findUnique({
      where: { id },
      include: {
        transaction: true,
        cashTransaction: true
      }
    })

    if (!existing || existing.userId !== user.id) {
      throw createError({ statusCode: 404, statusMessage: 'Debt not found' })
    }

    const nextStatus = status !== undefined ? status : existing.status
    const nextType = type !== undefined ? type : existing.type
    const nextAmount = amount !== undefined ? amount : existing.amount
    const nextPerson = person !== undefined ? person : existing.person
    const nextDescription = description !== undefined ? (description?.trim() || null) : existing.description
    const nextDate = date !== undefined ? new Date(date) : existing.date
    const nextPaymentDate = paymentDate !== undefined
      ? (paymentDate ? new Date(paymentDate) : null)
      : (existing.paymentDate || nextDate)

    const txType = nextType === 'I_OWE' ? 'expense' : 'income'
    const baseNote = nextType === 'I_OWE' ? `پرداخت بدهی به ${nextPerson}` : `دریافت طلب از ${nextPerson}`
    const txDescription = nextDescription ? `${baseNote} (${nextDescription})` : baseNote

    let finalBankAccountId: number | null = existing.bankAccountId
    let finalIsCash: boolean = existing.isCash
    let finalTransactionId: number | null = existing.transactionId
    let finalCashTransactionId: number | null = existing.cashTransactionId

    // Case 1: Reverting from paid to pending
    if (existing.status === 'paid' && nextStatus === 'pending') {
      if (existing.transactionId) {
        await tx.transaction.deleteMany({
          where: { id: existing.transactionId, userId: user.id }
        })
      }
      if (existing.cashTransactionId) {
        await tx.cashTransaction.deleteMany({
          where: { id: existing.cashTransactionId, userId: user.id }
        })
      }
      finalBankAccountId = null
      finalIsCash = false
      finalTransactionId = null
      finalCashTransactionId = null
    }
    // Case 2: Paying from pending to paid
    else if (existing.status === 'pending' && nextStatus === 'paid') {
      const method = paymentMethod || (bankAccountId ? 'bank' : 'cash')
      if (method === 'bank') {
        const targetBankAccountId = Number(bankAccountId || existing.bankAccountId)
        if (!Number.isInteger(targetBankAccountId) || targetBankAccountId <= 0) {
          throw createError({ statusCode: 400, statusMessage: 'لطفاً حساب بانکی را انتخاب کنید' })
        }
        const account = await tx.bankAccount.findUnique({ where: { id: targetBankAccountId } })
        if (!account || account.userId !== user.id) {
          throw createError({ statusCode: 404, statusMessage: 'حساب بانکی یافت نشد' })
        }

        const newTx = await tx.transaction.create({
          data: {
            userId: user.id,
            bankAccountId: targetBankAccountId,
            type: txType,
            amount: nextAmount,
            description: txDescription,
            date: nextPaymentDate || nextDate
          }
        })
        finalBankAccountId = targetBankAccountId
        finalIsCash = false
        finalTransactionId = newTx.id
        finalCashTransactionId = null
      } else {
        const newCashTx = await tx.cashTransaction.create({
          data: {
            userId: user.id,
            type: txType,
            amount: nextAmount,
            description: txDescription,
            date: nextPaymentDate || nextDate
          }
        })
        finalBankAccountId = null
        finalIsCash = true
        finalTransactionId = null
        finalCashTransactionId = newCashTx.id
      }
    }
    // Case 3: Already paid and staying paid (updating details, amount, or switching account)
    else if (existing.status === 'paid' && nextStatus === 'paid') {
      const targetMethod = paymentMethod || (bankAccountId !== undefined ? (bankAccountId ? 'bank' : 'cash') : (existing.isCash ? 'cash' : 'bank'))

      if (targetMethod === 'bank') {
        const targetBankAccountId = Number(bankAccountId !== undefined ? bankAccountId : existing.bankAccountId)
        if (!Number.isInteger(targetBankAccountId) || targetBankAccountId <= 0) {
          throw createError({ statusCode: 400, statusMessage: 'لطفاً حساب بانکی معتبر انتخاب کنید' })
        }
        const account = await tx.bankAccount.findUnique({ where: { id: targetBankAccountId } })
        if (!account || account.userId !== user.id) {
          throw createError({ statusCode: 404, statusMessage: 'حساب بانکی یافت نشد' })
        }

        // If previously cash, remove cash transaction and create bank transaction
        if (existing.cashTransactionId) {
          await tx.cashTransaction.deleteMany({
            where: { id: existing.cashTransactionId, userId: user.id }
          })
          const newTx = await tx.transaction.create({
            data: {
              userId: user.id,
              bankAccountId: targetBankAccountId,
              type: txType,
              amount: nextAmount,
              description: txDescription,
              date: nextPaymentDate || nextDate
            }
          })
          finalTransactionId = newTx.id
          finalCashTransactionId = null
        } else if (existing.transactionId) {
          // Update existing bank transaction
          await tx.transaction.update({
            where: { id: existing.transactionId },
            data: {
              bankAccountId: targetBankAccountId,
              type: txType,
              amount: nextAmount,
              description: txDescription,
              date: nextPaymentDate || nextDate
            }
          })
          finalTransactionId = existing.transactionId
        } else {
          // Missing transaction, recreate
          const newTx = await tx.transaction.create({
            data: {
              userId: user.id,
              bankAccountId: targetBankAccountId,
              type: txType,
              amount: nextAmount,
              description: txDescription,
              date: nextPaymentDate || nextDate
            }
          })
          finalTransactionId = newTx.id
        }

        finalBankAccountId = targetBankAccountId
        finalIsCash = false
      } else {
        // Target is cash
        if (existing.transactionId) {
          await tx.transaction.deleteMany({
            where: { id: existing.transactionId, userId: user.id }
          })
          const newCashTx = await tx.cashTransaction.create({
            data: {
              userId: user.id,
              type: txType,
              amount: nextAmount,
              description: txDescription,
              date: nextPaymentDate || nextDate
            }
          })
          finalTransactionId = null
          finalCashTransactionId = newCashTx.id
        } else if (existing.cashTransactionId) {
          await tx.cashTransaction.update({
            where: { id: existing.cashTransactionId },
            data: {
              type: txType,
              amount: nextAmount,
              description: txDescription,
              date: nextPaymentDate || nextDate
            }
          })
          finalCashTransactionId = existing.cashTransactionId
        } else {
          const newCashTx = await tx.cashTransaction.create({
            data: {
              userId: user.id,
              type: txType,
              amount: nextAmount,
              description: txDescription,
              date: nextPaymentDate || nextDate
            }
          })
          finalCashTransactionId = newCashTx.id
        }

        finalBankAccountId = null
        finalIsCash = true
      }
    }

    const updated = await tx.debt.update({
      where: { id },
      data: {
        person: nextPerson,
        amount: nextAmount,
        type: nextType,
        description: nextDescription,
        status: nextStatus,
        date: nextDate,
        paymentDate: nextStatus === 'paid' ? (nextPaymentDate || nextDate) : null,
        bankAccountId: finalBankAccountId,
        isCash: finalIsCash,
        transactionId: finalTransactionId,
        cashTransactionId: finalCashTransactionId
      },
      include: {
        bankAccount: {
          select: { id: true, name: true, icon: true }
        }
      }
    })

    return updated
  })
})
