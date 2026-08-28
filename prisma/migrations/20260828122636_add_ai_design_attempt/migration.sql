-- CreateTable
CREATE TABLE "AiDesignAttempt" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "resultUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDesignAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AiDesignAttempt" ADD CONSTRAINT "AiDesignAttempt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
