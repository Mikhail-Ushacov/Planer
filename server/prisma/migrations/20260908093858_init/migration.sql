-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Contact" ("email", "firstName", "id", "lastName", "notes", "phone") SELECT "email", "firstName", "id", "lastName", "notes", "phone" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isMeeting" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "meetingType" TEXT,
    "participants" TEXT,
    "notes" TEXT,
    "reminderSet" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Event" ("description", "endTime", "id", "isMeeting", "location", "meetingType", "notes", "participants", "reminderSet", "reminderTime", "startTime", "title") SELECT "description", "endTime", "id", "isMeeting", "location", "meetingType", "notes", "participants", "reminderSet", "reminderTime", "startTime", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
