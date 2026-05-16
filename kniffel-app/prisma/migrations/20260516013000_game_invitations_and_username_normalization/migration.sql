CREATE TYPE "GameInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED');

ALTER TABLE "User" ADD COLUMN "usernameNormalized" TEXT;
UPDATE "User" SET "usernameNormalized" = lower("username");
ALTER TABLE "User" ALTER COLUMN "usernameNormalized" SET NOT NULL;
CREATE UNIQUE INDEX "User_usernameNormalized_key" ON "User"("usernameNormalized");

CREATE TABLE "GameInvitation" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "GameInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameInvitation_gameId_receiverId_key" ON "GameInvitation"("gameId", "receiverId");

ALTER TABLE "GameInvitation" ADD CONSTRAINT "GameInvitation_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameInvitation" ADD CONSTRAINT "GameInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameInvitation" ADD CONSTRAINT "GameInvitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
