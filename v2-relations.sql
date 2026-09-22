-- CreateTable
CREATE TABLE "media_order_item_media" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 1,
    "duration_seconds" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_order_item_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_order_item_media_media_id_idx" ON "media_order_item_media"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_order_item_media_order_item_id_media_id_display_order_key" ON "media_order_item_media"("order_item_id", "media_id", "display_order");

-- AddForeignKey
ALTER TABLE "media_order_item_media" ADD CONSTRAINT "media_order_item_media_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "media_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_order_item_media" ADD CONSTRAINT "media_order_item_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
