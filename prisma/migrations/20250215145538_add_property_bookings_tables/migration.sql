/*
  Warnings:

  - You are about to drop the column `emailForBooking` on the `Bookings` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `Bookings` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfseats` on the `Bookings` table. All the data in the column will be lost.
  - You are about to drop the column `phoneForBooking` on the `Bookings` table. All the data in the column will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `checkInDate` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checkOutDate` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyId` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Bookings` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Bookings" DROP CONSTRAINT "Bookings_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Bookings" DROP CONSTRAINT "Bookings_userId_fkey";

-- AlterTable
ALTER TABLE "Bookings" DROP COLUMN "emailForBooking",
DROP COLUMN "eventId",
DROP COLUMN "numberOfseats",
DROP COLUMN "phoneForBooking",
ADD COLUMN     "checkInDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "checkOutDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "propertyId" INTEGER NOT NULL,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "userId" DROP DEFAULT;

-- DropTable
DROP TABLE "Event";

-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePerNight" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isAcceptingBooking" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
