-- CreateTable
CREATE TABLE "Event" (
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
    "reminderTime" DATETIME
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT
);
