import prisma from '~~/server/utils/prisma'
import { getAccountCurrentBalance } from '~~/server/utils/account'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)

  const { sourceAccountId: rawSourceId, destinationAccountId: rawDestId, amount: rawAmount, date, description } = body

  const sourceAccountId = Number(rawSourceId)
  const destinationAccountId = Number(rawDestId)
  const amount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount)

  // 1. Validate IDs
  if (!Number.isInteger(sourceAccountId) || sourceAccountId <= 0 || !Number.isInteger(destinationAccountId) || destinationAccountId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'شناسه حساب مبدأ و مقصد نامعتبر است' })
  }

  // 2. Rule: source and destination accounts must be different
  if (sourceAccountId === destinationAccountId) {
    throw createError({ statusCode: 400, statusMessage: 'حساب مبدأ و مقصد نمی‌توانند یکسان باشند' })
  }

  // 3. Rule: amount must be greater than 0
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'مبلغ انتقال باید عددی مثبت باشد' })
  }

  // 4. Validate date
  if (!date) {
    throw createError({ statusCode: 400, statusMessage: 'تاریخ انتقال الزامی است' })
  }
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'تاریخ انتقال نامعتبر است' })
  }

  // 5. Rule: both accounts must belong to the currently authenticated user
  const [sourceAccount, destinationAccount] = await Promise.all([
    prisma.bankAccount.findUnique({ where: { id: sourceAccountId } }),
    prisma.bankAccount.findUnique({ where: { id: destinationAccountId } })
  ])

  if (!sourceAccount || sourceAccount.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'حساب مبدأ یافت نشد یا متعلق به شما نیست' })
  }
  if (!destinationAccount || destinationAccount.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'حساب مقصد یافت نشد یا متعلق به شما نیست' })
  }

  // 6. Execute atomic transfer transaction with balance check
  const result = await prisma.$transaction(async (tx) => {
    // Check balance of source account
    const sourceBalance = await getAccountCurrentBalance(sourceAccountId, tx)
    if (sourceBalance < amount) {
      throw createError({ statusCode: 400, statusMessage: 'موجودی حساب مبدأ برای این انتقال کافی نیست' })
    }

    // Create source transaction (outgoing transfer)
    const sourceTx = await tx.transaction.create({
      data: {
        userId: user.id,
        bankAccountId: sourceAccountId,
        type: 'transfer',
        amount,
        description: description?.trim() || null,
        date: parsedDate,
        sourceAccountId,
        destinationAccountId,
        isUnnecessary: false
      }
    })

    // Create destination transaction (incoming transfer)
    const destTx = await tx.transaction.create({
      data: {
        userId: user.id,
        bankAccountId: destinationAccountId,
        type: 'transfer',
        amount,
        description: description?.trim() || null,
        date: parsedDate,
        sourceAccountId,
        destinationAccountId,
        relatedTransactionId: sourceTx.id,
        isUnnecessary: false
      }
    })

    // Link source transaction to destination transaction
    const updatedSourceTx = await tx.transaction.update({
      where: { id: sourceTx.id },
      data: { relatedTransactionId: destTx.id },
      include: {
        bankAccount: { select: { id: true, name: true, icon: true } },
        sourceAccount: { select: { id: true, name: true, icon: true } },
        destinationAccount: { select: { id: true, name: true, icon: true } }
      }
    })

    return {
      success: true,
      transaction: updatedSourceTx,
      pairedTransactionId: destTx.id
    }
  })

  return result
})
