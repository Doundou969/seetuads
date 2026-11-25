ALTER TABLE "media" ALTER COLUMN "advertiser_id" DROP NOT NULL;

ALTER TABLE "media" ADD COLUMN "partner_id" TEXT;

CREATE INDEX "media_partner_id_idx" ON "media"("partner_id");

ALTER TABLE "media"
ADD CONSTRAINT "media_partner_id_fkey"
FOREIGN KEY ("partner_id") REFERENCES "partners"("id")
ON DELETE CASCADE ON UPDATE CASCADE;