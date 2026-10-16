CREATE TABLE "ExerciseStats" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "firstAttemptAt" DATETIME,
  "lastAttemptAt" DATETIME,
  "successful" BOOLEAN NOT NULL DEFAULT false,
  "hintViewed" BOOLEAN NOT NULL DEFAULT false,
  "solutionViewed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ExerciseStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ExerciseStats_userId_lessonId_key" ON "ExerciseStats"("userId", "lessonId");
