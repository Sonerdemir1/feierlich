-- CreateTable
CREATE TABLE "AddOn" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "billingType" "BillingType" NOT NULL DEFAULT 'ONE_TIME',
    "moduleKeys" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAddOn" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_key_key" ON "AddOn"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EventAddOn_eventId_addOnId_key" ON "EventAddOn"("eventId", "addOnId");

-- AddForeignKey
ALTER TABLE "EventAddOn" ADD CONSTRAINT "EventAddOn_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAddOn" ADD CONSTRAINT "EventAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
