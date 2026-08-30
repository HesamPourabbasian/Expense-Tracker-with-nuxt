-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "bankAccountId" INTEGER,
ADD COLUMN     "cashTransactionId" INTEGER,
ADD COLUMN     "isCash" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "transactionId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Debt_transactionId_key" ON "Debt"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Debt_cashTransactionId_key" ON "Debt"("cashTransactionId");

-- CreateIndex
CREATE INDEX "Debt_bankAccountId_idx" ON "Debt"("bankAccountId");

-- CreateIndex
CREATE INDEX "Debt_transactionId_idx" ON "Debt"("transactionId");

-- CreateIndex
CREATE INDEX "Debt_cashTransactionId_idx" ON "Debt"("cashTransactionId");

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_cashTransactionId_fkey" FOREIGN KEY ("cashTransactionId") REFERENCES "CashTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
