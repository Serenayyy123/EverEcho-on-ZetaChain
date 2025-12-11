-- CreateTable
CREATE TABLE "Profile" (
    "address" TEXT NOT NULL PRIMARY KEY,
    "nickname" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "encryptionPubKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
