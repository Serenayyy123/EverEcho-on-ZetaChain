-- CreateTable
CREATE TABLE "Task" (
    "taskId" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contactsEncryptedPayload" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContactKey" (
    "taskId" TEXT NOT NULL PRIMARY KEY,
    "creatorWrappedDEK" TEXT NOT NULL,
    "helperWrappedDEK" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
