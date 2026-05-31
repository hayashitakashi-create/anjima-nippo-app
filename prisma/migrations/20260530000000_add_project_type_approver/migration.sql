-- CreateTable
CREATE TABLE "ProjectTypeApprover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectTypeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectTypeApprover_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectTypeApprover_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectTypeApprover_projectTypeId_idx" ON "ProjectTypeApprover"("projectTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTypeApprover_projectTypeId_userId_key" ON "ProjectTypeApprover"("projectTypeId", "userId");
