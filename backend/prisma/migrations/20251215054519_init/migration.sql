-- CreateTable
CREATE TABLE "Profile" (
    "address" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "encryptionPubKey" TEXT NOT NULL,
    "contacts" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Task" (
    "chainId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contactsEncryptedPayload" TEXT NOT NULL,
    "contactsPlaintext" TEXT,
    "createdAt" TEXT NOT NULL,
    "category" TEXT,
    "creator" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("chainId","taskId")
);

-- CreateTable
CREATE TABLE "ContactKey" (
    "chainId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "creatorWrappedDEK" TEXT NOT NULL,
    "helperWrappedDEK" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactKey_pkey" PRIMARY KEY ("chainId","taskId")
);

-- CreateIndex
CREATE INDEX "Task_chainId_idx" ON "Task"("chainId");

-- CreateIndex
CREATE INDEX "ContactKey_chainId_idx" ON "ContactKey"("chainId");
