-- Preserve playback history when Media, Player, or Screen records are deleted.
-- Playback logs must block physical deletion of referenced historical objects.

ALTER TABLE "playback_logs"
  DROP CONSTRAINT "playback_logs_media_id_fkey";

ALTER TABLE "playback_logs"
  ADD CONSTRAINT "playback_logs_media_id_fkey"
  FOREIGN KEY ("media_id")
  REFERENCES "media"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "playback_logs"
  DROP CONSTRAINT "playback_logs_player_id_fkey";

ALTER TABLE "playback_logs"
  ADD CONSTRAINT "playback_logs_player_id_fkey"
  FOREIGN KEY ("player_id")
  REFERENCES "players"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "playback_logs"
  DROP CONSTRAINT "playback_logs_screen_id_fkey";

ALTER TABLE "playback_logs"
  ADD CONSTRAINT "playback_logs_screen_id_fkey"
  FOREIGN KEY ("screen_id")
  REFERENCES "screens"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
