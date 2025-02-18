-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "bathrooms" TEXT,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "gallery" TEXT[],
ADD COLUMN     "petFriendly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "thumbnail" TEXT;
