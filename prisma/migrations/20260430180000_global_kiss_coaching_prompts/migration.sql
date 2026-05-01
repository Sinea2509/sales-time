-- Platform-wide KISS quadrant coaching instructions (super admin).
CREATE TABLE "GlobalKissCoachingPrompts" (
    "id" TEXT NOT NULL,
    "prompts" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalKissCoachingPrompts_pkey" PRIMARY KEY ("id")
);
