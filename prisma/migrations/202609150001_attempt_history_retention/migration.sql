DELETE FROM "Attempt"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "profileId", "lessonId"
        ORDER BY "createdAt" DESC, "id" DESC
      ) AS "position"
    FROM "Attempt"
  ) AS "ranked"
  WHERE "position" > 100
);

DROP INDEX "Attempt_profileId_lessonId_createdAt_idx";
CREATE INDEX "Attempt_userId_lessonId_createdAt_id_idx"
ON "Attempt"("profileId", "lessonId", "createdAt", "id");
