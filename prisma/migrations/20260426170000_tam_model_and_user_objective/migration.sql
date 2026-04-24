-- AlterTable
ALTER TABLE "OrganizationSettings" ADD COLUMN     "tamCrMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "tamCrmMinutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "tamEmailMinutes" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "tamResidualMinutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "tamObjectiveMinutesPerMonth" INTEGER NOT NULL DEFAULT 180;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tamObjectiveMinutesPerMonth" INTEGER;
