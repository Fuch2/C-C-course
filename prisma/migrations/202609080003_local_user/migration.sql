-- Сохраняем настройки и все связи старого профиля, затем выделяем новые сущности.
CREATE TABLE "Settings" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "dailyGoal" INTEGER NOT NULL DEFAULT 30,
  "compiler" TEXT NOT NULL DEFAULT 'gcc',
  "fontSize" INTEGER NOT NULL DEFAULT 15,
  CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "Settings" ("userId", "dailyGoal", "compiler", "fontSize") SELECT "id", "dailyGoal", "compiler", "fontSize" FROM "Profile";
ALTER TABLE "Profile" ADD COLUMN "localKey" TEXT;
UPDATE "Profile" SET "localKey" = 'local' WHERE "id" = (SELECT "id" FROM "Profile" ORDER BY "createdAt" ASC, "id" ASC LIMIT 1);
CREATE UNIQUE INDEX "Profile_localKey_key" ON "Profile"("localKey");
DROP INDEX "Profile_sessionHash_key";
ALTER TABLE "Profile" DROP COLUMN "sessionHash";
ALTER TABLE "Profile" DROP COLUMN "dailyGoal";
ALTER TABLE "Profile" DROP COLUMN "compiler";
ALTER TABLE "Profile" DROP COLUMN "fontSize";
CREATE TABLE "CourseProgress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "completedLessons" INTEGER NOT NULL DEFAULT 0,
  "totalLessons" INTEGER NOT NULL DEFAULT 0,
  "percent" REAL NOT NULL DEFAULT 0,
  "lastLessonId" TEXT,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CourseProgress_userId_courseId_key" ON "CourseProgress"("userId", "courseId");
CREATE TABLE "QuizAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "answers" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "passed" BOOLEAN NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "QuizAttempt_userId_lessonId_createdAt_idx" ON "QuizAttempt"("userId", "lessonId", "createdAt");
