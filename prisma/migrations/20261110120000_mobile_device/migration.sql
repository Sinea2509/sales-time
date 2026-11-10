-- Les téléphones de l'application mobile, pour leur envoyer les notifications (10 novembre 2026).
CREATE TABLE IF NOT EXISTS "MobileDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expoPushToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MobileDevice_expoPushToken_key" ON "MobileDevice"("expoPushToken");
CREATE INDEX IF NOT EXISTS "MobileDevice_userId_idx" ON "MobileDevice"("userId");

DO $$ BEGIN
    ALTER TABLE "MobileDevice" ADD CONSTRAINT "MobileDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
