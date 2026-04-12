/*
  Warnings:

  - Added the required column `costCommission` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costOther` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costShipping` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `margin` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profit` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costCommission" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "costOther" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "costShipping" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "margin" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "profit" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free';
