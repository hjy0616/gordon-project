-- Backfill user_status_logs with each existing user's initial status entry
-- so churn analytics can compute denominators correctly. Idempotent via NOT EXISTS guards.

-- 1) Initial status row at created_at for every user
--    PENDING users  → PENDING (their actual current state)
--    Everyone else  → ACTIVE  (treat them as having entered ACTIVE at creation)
INSERT INTO "user_status_logs" ("id", "user_id", "from_status", "to_status", "reason", "created_at")
SELECT
  'seed_init_' || u."id",
  u."id",
  NULL,
  CASE
    WHEN u."status" = 'PENDING' THEN 'PENDING'::"UserStatus"
    ELSE 'ACTIVE'::"UserStatus"
  END,
  'backfill: initial status from migration',
  u."created_at"
FROM "users" u
WHERE NOT EXISTS (
  SELECT 1 FROM "user_status_logs" l WHERE l."user_id" = u."id"
);

-- 2) For users currently EXPIRED, append an ACTIVE → EXPIRED transition log
--    at active_until (best estimate) or updated_at, whichever is later than created_at.
INSERT INTO "user_status_logs" ("id", "user_id", "from_status", "to_status", "reason", "created_at")
SELECT
  'seed_expired_' || u."id",
  u."id",
  'ACTIVE'::"UserStatus",
  'EXPIRED'::"UserStatus",
  'backfill: assumed expiration',
  GREATEST(
    COALESCE(u."active_until", u."updated_at", u."created_at"),
    u."created_at" + INTERVAL '1 second'
  )
FROM "users" u
WHERE u."status" = 'EXPIRED'
  AND NOT EXISTS (
    SELECT 1 FROM "user_status_logs" l
    WHERE l."user_id" = u."id"
      AND l."to_status" = 'EXPIRED'
      AND l."reason" LIKE 'backfill%'
  );

-- 3) For users currently SUSPENDED, append an ACTIVE → SUSPENDED transition log
--    at updated_at (best estimate), guarded above created_at.
INSERT INTO "user_status_logs" ("id", "user_id", "from_status", "to_status", "reason", "created_at")
SELECT
  'seed_suspended_' || u."id",
  u."id",
  'ACTIVE'::"UserStatus",
  'SUSPENDED'::"UserStatus",
  'backfill: assumed suspension',
  GREATEST(u."updated_at", u."created_at" + INTERVAL '1 second')
FROM "users" u
WHERE u."status" = 'SUSPENDED'
  AND NOT EXISTS (
    SELECT 1 FROM "user_status_logs" l
    WHERE l."user_id" = u."id"
      AND l."to_status" = 'SUSPENDED'
      AND l."reason" LIKE 'backfill%'
  );
