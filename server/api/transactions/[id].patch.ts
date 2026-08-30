import prisma from '~~/server/utils/prisma'
import { getAccountCurrentBalance } from '~~/server/utils/account'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      sourceAccount: true,
      destinationAccount: true
    }
  })

  if (!transaction || transaction.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Transaction not found' })
  }

  // Handle transfer transactions
  if (transaction.type === 'transfer' || transaction.type === 'TRANSFER') {
    const rawAmount = body.amount !== undefined ? (typeof body.amount === 'number' ? body.amount : Number(body.amount)) : transaction.amount
    const newAmount = rawAmount
    if (newAmount !== undefined && (!Number.isFinite(newAmount) || newAmount <= 0)) {
      throw createError({ statusCode: 400, statusMessage: 'مبلغ انتقال باید عددی مثبت باشد' })
    }

    const newSourceId = body.sourceAccountId !== undefined ? Number(body.sourceAccountId) : (transaction.sourceAccountId ?? transaction.bankAccountId)
    const newDestId = body.destinationAccountId !== undefined ? Number(body.destinationAccountId) : (transaction.destinationAccountId ?? transaction.bankAccountId)

    if (!Number.isInteger(newSourceId) || newSourceId <= 0 || !Number.isInteger(newDestId) || newDestId <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'شناسه حساب مبدأ و مقصد نامعتبر است' })
    }

    if (newSourceId === newDestId) {
      throw createError({ statusCode: 400, statusMessage: 'حساب مبدأ و مقصد نمی‌توانند یکسان باشند' })
    }

    const [sourceAcc, destAcc] = await Promise.all([
      prisma.bankAccount.findUnique({ where: { id: newSourceId } }),
      prisma.bankAccount.findUnique({ where: { id: newDestId } })
    ])

    if (!sourceAcc || sourceAcc.userId !== user.id) {
      throw createError({ statusCode: 404, statusMessage: 'حساب مبدأ یافت نشد یا متعلق به شما نیست' })
    }
    if (!destAcc || destAcc.userId !== user.id) {
      throw createError({ statusCode: 404, statusMessage: 'حساب مقصد یافت نشد یا متعلق به شما نیست' })
    }

    const newDate = body.date ? new Date(body.date) : transaction.date
    if (isNaN(newDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'تاریخ نامعتبر است' })
    }

    const newDescription = body.description !== undefined ? (body.description?.trim() || null) : transaction.description

    const pairedId = transaction.relatedTransactionId
    const pairedTx = pairedId ? await prisma.transaction.findUnique({ where: { id: pairedId } }) : null

    // Determine which transaction record is source and which is destination
    const isCurrentSource = transaction.sourceAccountId === transaction.bankAccountId || (!transaction.sourceAccountId && !pairedTx)
    const sourceTxId = isCurrentSource ? transaction.id : (pairedTx ? pairedTx.id : transaction.id)
    const destTxId = isCurrentSource ? (pairedTx ? pairedTx.id : null) : transaction.id

    return await prisma.$transaction(async (tx) => {
      // Check available balance on new source account
      const currentSourceBalance = await getAccountCurrentBalance(newSourceId, tx)
      const oldSourceId = transaction.sourceAccountId ?? (isCurrentSource ? transaction.bankAccountId : (pairedTx?.bankAccountId ?? 0))
      
      const availableBalance = (oldSourceId === newSourceId)
        ? currentSourceBalance + transaction.amount
        : currentSourceBalance

      if (availableBalance < newAmount) {
        throw createError({ statusCode: 400, statusMessage: 'موجودی حساب مبدأ برای این انتقال کافی نیست' })
      }

      // Update source transaction
      const updatedSource = await tx.transaction.update({
        where: { id: sourceTxId },
        data: {
          bankAccountId: newSourceId,
          sourceAccountId: newSourceId,
          destinationAccountId: newDestId,
          amount: newAmount,
          date: newDate,
          description: newDescription
        },
        include: {
          bankAccount: { select: { id: true, name: true, icon: true } },
          sourceAccount: { select: { id: true, name: true, icon: true } },
          destinationAccount: { select: { id: true, name: true, icon: true } }
        }
      })

      // Update paired destination transaction if it exists
      if (destTxId) {
        await tx.transaction.update({
          where: { id: destTxId },
          data: {
            bankAccountId: newDestId,
            sourceAccountId: newSourceId,
            destinationAccountId: newDestId,
            amount: newAmount,
            date: newDate,
            description: newDescription
          }
        })
      }

      return isCurrentSource ? updatedSource : await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          bankAccount: { select: { id: true, name: true, icon: true } },
          sourceAccount: { select: { id: true, name: true, icon: true } },
          destinationAccount: { select: { id: true, name: true, icon: true } }
        }
      })
    })
  }

  // Handle standard income/expense transactions
  const { type, amount, description, date, isUnnecessary } = body

  if (type && !['income', 'expense'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type must be income or expense' })
  }

  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive number' })
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(amount && { amount }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(date && { date: new Date(date) }),
        ...(isUnnecessary !== undefined && { isUnnecessary: Boolean(isUnnecessary) })
      },
      include: {
        bankAccount: { select: { id: true, name: true, icon: true } }
      }
    })

    if (amount !== undefined) {
      await tx.debt.updateMany({
        where: { transactionId: id, userId: user.id },
        data: { amount }
      })
    }

    return updated
  })
})
