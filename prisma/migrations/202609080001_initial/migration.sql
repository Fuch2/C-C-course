-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionHash" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Исследователь',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "dailyGoal" INTEGER NOT NULL DEFAULT 30,
    "compiler" TEXT NOT NULL DEFAULT 'gcc',
    "fontSize" INTEGER NOT NULL DEFAULT 15,
    "lastLessonId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "quizPassed" BOOLEAN NOT NULL DEFAULT false,
    "practicePassed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Progress_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    CONSTRAINT "Bookmark_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "compiler" TEXT NOT NULL,
    "standard" TEXT NOT NULL,
    "stdin" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "stdin" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Draft_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_sessionHash_key" ON "Profile"("sessionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_profileId_lessonId_key" ON "Progress"("profileId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_profileId_lessonId_key" ON "Bookmark"("profileId", "lessonId");

-- CreateIndex
CREATE INDEX "Attempt_profileId_lessonId_createdAt_idx" ON "Attempt"("profileId", "lessonId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Draft_profileId_lessonId_key" ON "Draft"("profileId", "lessonId");

