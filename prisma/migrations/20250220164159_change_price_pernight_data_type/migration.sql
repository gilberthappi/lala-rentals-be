/*
  Warnings:

  - The `pricePerNight` column on the `Property` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "pricePerNight",
ADD COLUMN     "pricePerNight" INTEGER NOT NULL DEFAULT 1;
