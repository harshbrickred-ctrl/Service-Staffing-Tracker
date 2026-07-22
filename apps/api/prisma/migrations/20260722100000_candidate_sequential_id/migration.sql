-- Collapse Candidate identity to a single sequential primary key (CAN-#####).
-- Offer/Onboarding FKs use ON UPDATE CASCADE, so rewriting candidates.id updates them.

-- Ensure every candidate has a public_id before promoting it to id.
WITH missing AS (
  SELECT c."id"
  FROM "candidates" c
  WHERE c."public_id" IS NULL OR btrim(c."public_id") = ''
),
numbered AS (
  SELECT
    m."id",
    'CAN-' || lpad(
      (
        COALESCE((SELECT s."value" FROM "id_sequences" s WHERE s."name" = 'candidate'), 0)
        + ROW_NUMBER() OVER (ORDER BY m."id")
      )::text,
      5,
      '0'
    ) AS "public_id"
  FROM missing m
)
UPDATE "candidates" AS c
SET "public_id" = n."public_id"
FROM numbered n
WHERE c."id" = n."id";

UPDATE "id_sequences" AS s
SET "value" = GREATEST(
  s."value",
  COALESCE(
    (
      SELECT MAX(("regexp_replace"("public_id", '^CAN-', ''))::int)
      FROM "candidates"
      WHERE "public_id" ~ '^CAN-[0-9]+$'
    ),
    s."value"
  )
)
WHERE s."name" = 'candidate';

INSERT INTO "id_sequences" ("name", "value")
SELECT
  'candidate',
  COALESCE(
    (
      SELECT MAX(("regexp_replace"("public_id", '^CAN-', ''))::int)
      FROM "candidates"
      WHERE "public_id" ~ '^CAN-[0-9]+$'
    ),
    0
  )
WHERE NOT EXISTS (SELECT 1 FROM "id_sequences" WHERE "name" = 'candidate');

ALTER TABLE "candidates" ALTER COLUMN "id" DROP DEFAULT;

UPDATE "candidates"
SET "id" = "public_id"
WHERE "id" IS DISTINCT FROM "public_id";

DROP INDEX IF EXISTS "candidates_public_id_key";
ALTER TABLE "candidates" DROP COLUMN "public_id";

DROP INDEX IF EXISTS "candidates_candidate_id_key";
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "candidate_id";

DELETE FROM "id_sequences" WHERE "name" = 'candidateId';
