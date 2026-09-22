-- CreateEnum
CREATE TYPE "MediaOrderStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "invoice_id" TEXT;

-- CreateTable
CREATE TABLE "media_orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "status" "MediaOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "spot_duration" INTEGER NOT NULL,
    "frequency_per_loop" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "pricing_snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_order_item_screens" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "screen_id" TEXT NOT NULL,
    "pricing_rule_id" TEXT,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "pricing_snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_order_item_screens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "due_date" DATE,
    "issued_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_orders_order_number_key" ON "media_orders"("order_number");

-- CreateIndex
CREATE INDEX "media_orders_advertiser_id_idx" ON "media_orders"("advertiser_id");

-- CreateIndex
CREATE INDEX "media_order_items_order_id_idx" ON "media_order_items"("order_id");

-- CreateIndex
CREATE INDEX "media_order_items_campaign_id_idx" ON "media_order_items"("campaign_id");

-- CreateIndex
CREATE INDEX "media_order_item_screens_screen_id_idx" ON "media_order_item_screens"("screen_id");

-- CreateIndex
CREATE INDEX "media_order_item_screens_pricing_rule_id_idx" ON "media_order_item_screens"("pricing_rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_order_item_screens_order_item_id_screen_id_key" ON "media_order_item_screens"("order_item_id", "screen_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_order_id_idx" ON "invoices"("order_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_orders" ADD CONSTRAINT "media_orders_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "advertisers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_order_items" ADD CONSTRAINT "media_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "media_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_order_items" ADD CONSTRAINT "media_order_items_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_order_item_screens" ADD CONSTRAINT "media_order_item_screens_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "media_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_order_item_screens" ADD CONSTRAINT "media_order_item_screens_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_order_item_screens" ADD CONSTRAINT "media_order_item_screens_pricing_rule_id_fkey" FOREIGN KEY ("pricing_rule_id") REFERENCES "pricing_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "media_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

