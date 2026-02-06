-- 作業日報テーブル
CREATE TABLE IF NOT EXISTS "WorkReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectType" TEXT,
    "projectId" TEXT,
    "weather" TEXT,
    "contactNotes" TEXT,
    "remoteDepartureTime" TEXT,
    "remoteArrivalTime" TEXT,
    "remoteDepartureTime2" TEXT,
    "remoteArrivalTime2" TEXT,
    "trafficGuardCount" INTEGER,
    "trafficGuardStart" TEXT,
    "trafficGuardEnd" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 作業者記録テーブル
CREATE TABLE IF NOT EXISTS "WorkerRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workReportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "workHours" REAL,
    "workType" TEXT,
    "details" TEXT,
    "dailyHours" REAL,
    "totalHours" REAL,
    "remainHours" REAL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("workReportId") REFERENCES "WorkReport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 使用材料・消耗品記録テーブル
CREATE TABLE IF NOT EXISTS "MaterialRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workReportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "volume" TEXT,
    "volumeUnit" TEXT,
    "quantity" REAL,
    "unitPrice" REAL,
    "amount" REAL,
    "subcontractor" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("workReportId") REFERENCES "WorkReport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 外注先記録テーブル
CREATE TABLE IF NOT EXISTS "SubcontractorRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workReportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workerCount" INTEGER,
    "workContent" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("workReportId") REFERENCES "WorkReport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
