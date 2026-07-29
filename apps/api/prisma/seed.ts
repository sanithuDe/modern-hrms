import { prisma } from "../src/lib/prisma.js";

async function seedShifts(): Promise<void> {
  const dayShift = await prisma.shift.upsert({
    where: {
      code: "DAY",
    },
    update: {
      name: "Day Shift",
      startTimeMinutes: 510,
      endTimeMinutes: 990,
      crossesMidnight: false,
      graceMinutes: 10,
      requiredWorkMinutes: 480,
      isActive: true,
    },
    create: {
      name: "Day Shift",
      code: "DAY",
      startTimeMinutes: 510,
      endTimeMinutes: 990,
      crossesMidnight: false,
      graceMinutes: 10,
      requiredWorkMinutes: 480,
      isActive: true,
    },
  });

  const nightShift = await prisma.shift.upsert({
    where: {
      code: "NIGHT",
    },
    update: {
      name: "Night Shift",
      startTimeMinutes: 1080,
      endTimeMinutes: 480,
      crossesMidnight: true,
      graceMinutes: 10,
      requiredWorkMinutes: 840,
      isActive: true,
    },
    create: {
      name: "Night Shift",
      code: "NIGHT",
      startTimeMinutes: 1080,
      endTimeMinutes: 480,
      crossesMidnight: true,
      graceMinutes: 10,
      requiredWorkMinutes: 840,
      isActive: true,
    },
  });

  console.log("Shifts created successfully:");

  console.log({
    dayShift: {
      id: dayShift.id,
      code: dayShift.code,
      name: dayShift.name,
      schedule: "08:30 AM - 04:30 PM",
    },
    nightShift: {
      id: nightShift.id,
      code: nightShift.code,
      name: nightShift.name,
      schedule: "06:00 PM - 08:00 AM next day",
    },
  });
}

async function seedAttendancePolicy(): Promise<void> {
  const existingPolicy =
    await prisma.attendancePolicy.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

  const policyData = {
    monthlyShortLeaveCount: 2,
    monthlyShortLeaveMinutes: 180,
    fullDayMinimumWorkMinutes: 240,
    halfDayMinimumWorkMinutes: 420,
    allowWebCheckIn: true,
    allowMobileCheckIn: true,
  };

  const attendancePolicy = existingPolicy
    ? await prisma.attendancePolicy.update({
        where: {
          id: existingPolicy.id,
        },
        data: policyData,
      })
    : await prisma.attendancePolicy.create({
        data: policyData,
      });

  console.log("Attendance policy created successfully:");

  console.log({
    id: attendancePolicy.id,
    monthlyShortLeaveCount:
      attendancePolicy.monthlyShortLeaveCount,
    monthlyShortLeaveMinutes:
      attendancePolicy.monthlyShortLeaveMinutes,
    fullDayMinimumWorkMinutes:
      attendancePolicy.fullDayMinimumWorkMinutes,
    halfDayMinimumWorkMinutes:
      attendancePolicy.halfDayMinimumWorkMinutes,
    allowWebCheckIn:
      attendancePolicy.allowWebCheckIn,
    allowMobileCheckIn:
      attendancePolicy.allowMobileCheckIn,
  });
}

async function main(): Promise<void> {
  console.log("Starting attendance seed...");

  await seedShifts();
  await seedAttendancePolicy();

  console.log("Attendance seed completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Attendance seed failed:");

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });