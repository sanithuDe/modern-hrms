-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttendanceStatus" ADD VALUE 'GRACE_LATE';
ALTER TYPE "AttendanceStatus" ADD VALUE 'SHORT_LEAVE';
ALTER TYPE "AttendanceStatus" ADD VALUE 'EARLY_DEPARTURE';
ALTER TYPE "AttendanceStatus" ADD VALUE 'FULL_DAY_LEAVE';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "earlyLeaveMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leaveDayValue" DECIMAL(4,2) NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledEnd" TIMESTAMP(3),
ADD COLUMN     "scheduledStart" TIMESTAMP(3),
ADD COLUMN     "shiftId" TEXT,
ADD COLUMN     "shortLeaveMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startTimeMinutes" INTEGER NOT NULL,
    "endTimeMinutes" INTEGER NOT NULL,
    "crossesMidnight" BOOLEAN NOT NULL DEFAULT false,
    "graceMinutes" INTEGER NOT NULL DEFAULT 10,
    "requiredWorkMinutes" INTEGER NOT NULL DEFAULT 480,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeShiftAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendancePolicy" (
    "id" TEXT NOT NULL,
    "monthlyShortLeaveCount" INTEGER NOT NULL DEFAULT 2,
    "monthlyShortLeaveMinutes" INTEGER NOT NULL DEFAULT 180,
    "fullDayMinimumWorkMinutes" INTEGER NOT NULL DEFAULT 240,
    "halfDayMinimumWorkMinutes" INTEGER NOT NULL DEFAULT 420,
    "allowWebCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "allowMobileCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shift_code_key" ON "Shift"("code");

-- CreateIndex
CREATE INDEX "Shift_isActive_idx" ON "Shift"("isActive");

-- CreateIndex
CREATE INDEX "Shift_name_idx" ON "Shift"("name");

-- CreateIndex
CREATE INDEX "EmployeeShiftAssignment_employeeId_idx" ON "EmployeeShiftAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeShiftAssignment_shiftId_idx" ON "EmployeeShiftAssignment"("shiftId");

-- CreateIndex
CREATE INDEX "EmployeeShiftAssignment_effectiveFrom_idx" ON "EmployeeShiftAssignment"("effectiveFrom");

-- CreateIndex
CREATE INDEX "EmployeeShiftAssignment_effectiveTo_idx" ON "EmployeeShiftAssignment"("effectiveTo");

-- CreateIndex
CREATE INDEX "EmployeeShiftAssignment_isActive_idx" ON "EmployeeShiftAssignment"("isActive");

-- CreateIndex
CREATE INDEX "Attendance_shiftId_idx" ON "Attendance"("shiftId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShiftAssignment" ADD CONSTRAINT "EmployeeShiftAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShiftAssignment" ADD CONSTRAINT "EmployeeShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
