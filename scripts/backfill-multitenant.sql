INSERT INTO pool_participants (id, "poolId", "userId", "entryFee", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "poolId", id, "entryFee", now(), now()
FROM users
ON CONFLICT ("poolId", "userId")
DO UPDATE SET
  "entryFee" = EXCLUDED."entryFee",
  "updatedAt" = now();

UPDATE bets b
SET "poolId" = u."poolId"
FROM users u
WHERE b."userId" = u.id
  AND b."poolId" IS NULL;
