/*
  Warnings:

  - You are about to drop the column `costCommission` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `costOther` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `costShipping` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `margin` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `profit` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_productId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "costCommission",
DROP COLUMN "costOther",
DROP COLUMN "costShipping",
DROP COLUMN "margin",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "profit";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "plan";
