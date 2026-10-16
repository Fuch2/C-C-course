CREATE TABLE "StudyDay" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profileId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  CONSTRAINT "StudyDay_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StudyDay_profileId_day_key" ON "StudyDay"("profileId", "day");
