import {
  Prisma,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../../lib/prisma.js";

import type {
  UpdateAttendanceSettingsInput,
} from "./settings.schema.js";

const defaultAttendanceSettings = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",

  gracePeriodMinutes: 10,
  halfDayMinutes: 240,
  fullDayMinutes: 480,

  allowWebCheckIn: true,
  allowMobileCheckIn: true,
} satisfies Prisma.AttendanceSettingsCreateInput;

export async function getAttendanceSettings() {
  const existingSettings =
    await prisma.attendanceSettings.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

  if (existingSettings) {
    return existingSettings;
  }

  return prisma.attendanceSettings.create({
    data:
      defaultAttendanceSettings,
  });
}

export async function updateAttendanceSettings(
  input: UpdateAttendanceSettingsInput,
) {
  const existingSettings =
    await prisma.attendanceSettings.findFirst({
      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,
      },
    });

  if (!existingSettings) {
    return prisma.attendanceSettings.create({
      data: {
        officeStartTime:
          input.officeStartTime,

        officeEndTime:
          input.officeEndTime,

        gracePeriodMinutes:
          input.gracePeriodMinutes,

        halfDayMinutes:
          input.halfDayMinutes,

        fullDayMinutes:
          input.fullDayMinutes,

        allowWebCheckIn:
          input.allowWebCheckIn,

        allowMobileCheckIn:
          input.allowMobileCheckIn,
      },
    });
  }

  return prisma.attendanceSettings.update({
    where: {
      id:
        existingSettings.id,
    },

    data: {
      officeStartTime:
        input.officeStartTime,

      officeEndTime:
        input.officeEndTime,

      gracePeriodMinutes:
        input.gracePeriodMinutes,

      halfDayMinutes:
        input.halfDayMinutes,

      fullDayMinutes:
        input.fullDayMinutes,

      allowWebCheckIn:
        input.allowWebCheckIn,

      allowMobileCheckIn:
        input.allowMobileCheckIn,
    },
  });
}

export async function resetAttendanceSettings() {
  const existingSettings =
    await prisma.attendanceSettings.findFirst({
      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,
      },
    });

  if (!existingSettings) {
    return prisma.attendanceSettings.create({
      data:
        defaultAttendanceSettings,
    });
  }

  return prisma.attendanceSettings.update({
    where: {
      id:
        existingSettings.id,
    },

    data:
      defaultAttendanceSettings,
  });
}