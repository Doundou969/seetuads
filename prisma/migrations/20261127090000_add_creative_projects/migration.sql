-- CreateEnum
CREATE TYPE "CreativeKind" AS ENUM ('SLIDESHOW', 'DIGITAL_MENU', 'ADVERTISEMENT');

-- CreateTable
CREATE TABLE "creative_projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CreativeKind" NOT NULL DEFAULT 'ADVERTISEMENT',
    "canvas_width" INTEGER NOT NULL DEFAULT 1920,
    "canvas_height" INTEGER NOT NULL DEFAULT 1080,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creative_projects_user_id_updated_at_idx" ON "creative_projects"("user_id", "updated_at");

-- AddForeignKey
ALTER TABLE "creative_projects"
ADD CONSTRAINT "creative_projects_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
