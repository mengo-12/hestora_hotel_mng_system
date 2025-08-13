-- CreateTable
CREATE TABLE "public"."Guest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL,
    "maritalStatus" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "passportNumber" TEXT NOT NULL,
    "passportIssue" TIMESTAMP(3) NOT NULL,
    "passportExpiry" TIMESTAMP(3) NOT NULL,
    "passportPlace" TEXT NOT NULL,
    "nationalId" TEXT,
    "notes" TEXT,
    "preferences" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);
