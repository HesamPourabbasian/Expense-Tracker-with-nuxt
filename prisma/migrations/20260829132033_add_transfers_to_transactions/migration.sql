-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "destinationAccountId" INTEGER,
ADD COLUMN     "relatedTransactionId" INTEGER,
ADD COLUMN     "sourceAccountId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Transaction_sourceAccountId_idx" ON "Transaction"("sourceAccountId");

-- CreateIndex
CREATE INDEX "Transaction_destinationAccountId_idx" ON "Transaction"("destinationAccountId");

-- CreateIndex
CREATE INDEX "Transaction_relatedTransactionId_idx" ON "Transaction"("relatedTransactionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
