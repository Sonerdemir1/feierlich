-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "coupleLeftName" TEXT,
ADD COLUMN     "coupleLeftBio" TEXT,
ADD COLUMN     "coupleRightName" TEXT,
ADD COLUMN     "coupleRightBio" TEXT,
ADD COLUMN     "weddingPartyHeading" TEXT,
ADD COLUMN     "weddingPartyHint" TEXT;

-- CreateEnum
CREATE TYPE "WeddingPartyRole" AS ENUM ('TRAUZEUGE', 'BRAUTJUNGFER');

-- CreateTable
CREATE TABLE "WeddingPartyMember" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "role" "WeddingPartyRole" NOT NULL,
    "name" TEXT NOT NULL,
    "photoId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WeddingPartyMember_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WeddingPartyMember" ADD CONSTRAINT "WeddingPartyMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingPartyMember" ADD CONSTRAINT "WeddingPartyMember_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
