-- CreateTable
CREATE TABLE "UserModulePermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserModulePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserModulePermission_userId_idx" ON "UserModulePermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserModulePermission_userId_module_key" ON "UserModulePermission"("userId", "module");

-- AddForeignKey
ALTER TABLE "UserModulePermission" ADD CONSTRAINT "UserModulePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
