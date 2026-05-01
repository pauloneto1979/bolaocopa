INSERT INTO pool_members (id, "poolId", "userId", role, status, "entryValue", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "poolId", "userId", 'USER'::"Role", 'ACTIVE'::"MemberStatus", "entryFee", now(), now()
FROM pool_participants
ON CONFLICT ("poolId", "userId")
DO UPDATE SET
  "entryValue" = EXCLUDED."entryValue",
  status = 'ACTIVE'::"MemberStatus",
  "updatedAt" = now();

WITH first_members AS (
  SELECT DISTINCT ON ("poolId") "poolId", "userId"
  FROM pool_members
  ORDER BY "poolId", "createdAt"
)
UPDATE pool_members pm
SET role = 'OWNER'::"Role", status = 'ACTIVE'::"MemberStatus", "updatedAt" = now()
FROM first_members fm
WHERE pm."poolId" = fm."poolId"
  AND pm."userId" = fm."userId"
  AND NOT EXISTS (
    SELECT 1
    FROM pool_members existing_owner
    WHERE existing_owner."poolId" = fm."poolId"
      AND existing_owner.role = 'OWNER'::"Role"
      AND existing_owner.status = 'ACTIVE'::"MemberStatus"
  );

UPDATE pools p
SET
  "entryValue" = p."entryFee",
  "ownerId" = owner_member."userId",
  "updatedAt" = now()
FROM (
  SELECT DISTINCT ON ("poolId") "poolId", "userId"
  FROM pool_members
  WHERE role = 'OWNER'::"Role" AND status = 'ACTIVE'::"MemberStatus"
  ORDER BY "poolId", "createdAt"
) owner_member
WHERE p.id = owner_member."poolId"
  AND p."ownerId" IS NULL;
