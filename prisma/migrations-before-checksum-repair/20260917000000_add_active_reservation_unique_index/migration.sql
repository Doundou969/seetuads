-- Prevent multiple active reservations for the same campaign/screen.
-- Historical EXPIRED/CANCELLED reservations remain allowed.

CREATE UNIQUE INDEX "inventory_reservations_active_campaign_screen_key"
ON "inventory_reservations" ("campaign_id", "screen_id")
WHERE "status" IN ('TEMPORARY', 'CONFIRMED');