-- CreateEnum
CREATE TYPE "GrantReason" AS ENUM ('OK', 'ACADEMIC_FAIL', 'LOW_SCORE', 'PAYMENT_OVERDUE', 'GRANTED_OK');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "grantReason" "GrantReason" NOT NULL DEFAULT 'OK',
ADD COLUMN     "lmsData" JSONB,
ADD COLUMN     "paymentOverdue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW';
