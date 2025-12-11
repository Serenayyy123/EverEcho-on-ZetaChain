/*
  Warnings:

  - The primary key for the `ContactKey` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Task` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `chainId` to the `ContactKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chainId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContactKey" (
    "chainId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "creatorWrappedDEK" TEXT NOT NULL,
    "helperWrappedDEK" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("chainId", "taskId")
);
INSERT INTO "new_ContactKey" ("chainId", "createdAt", "creatorWrappedDEK", "helperWrappedDEK", "taskId") SELECT '84532', "createdAt", "creatorWrappedDEK", "helperWrappedDEK", "taskId" FROM "ContactKey";
DROP TABLE "ContactKey";
ALTER TABLE "new_ContactKey" RENAME TO "ContactKey";
CREATE INDEX "ContactKey_chainId_idx" ON "ContactKey"("chainId");
CREATE TABLE "new_Task" (
    "chainId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contactsEncryptedPayload" TEXT NOT NULL,
    "contactsPlaintext" TEXT,
    "createdAt" TEXT NOT NULL,
    "category" TEXT,
    "creator" TEXT,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("chainId", "taskId")
);
INSERT INTO "new_Task" ("chainId", "category", "contactsEncryptedPayload", "contactsPlaintext", "createdAt", "creator", "description", "taskId", "title", "updatedAt") SELECT '84532', "category", "contactsEncryptedPayload", "contactsPlaintext", "createdAt", "creator", "description", "taskId", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_chainId_idx" ON "Task"("chainId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
