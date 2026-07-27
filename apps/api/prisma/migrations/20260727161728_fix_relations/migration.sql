/*
  Warnings:

  - You are about to drop the column `address` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "address",
DROP COLUMN "dateOfBirth",
DROP COLUMN "profileImage";
