-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "specialNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisitRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyReportId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "contactPerson" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "content" TEXT,
    "expense" INTEGER,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisitRecord_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyReportId" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approverUserId" TEXT,
    "approvedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Approval_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Approval_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
