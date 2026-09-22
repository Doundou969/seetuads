ALTER TABLE "players" ADD COLUMN "short_code" TEXT;

CREATE UNIQUE INDEX "players_short_code_key" ON "players"("short_code");
