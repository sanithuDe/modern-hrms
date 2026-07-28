import {
  AttendanceMethod,
  AttendanceStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "../../lib/prisma.js";

export interface CheckInInput {
  method?: AttendanceMethod;
  notes?: string;
}

export interface CheckOutInput {
  notes?: string;
}

export interface AttendanceQuery {
  employeeId?: string;
  status?: AttendanceStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface ManualAttendanceInput {
  employeeId: string;
  date: Date;
  checkIn?: Date | null;
  checkOut?: Date | null;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface UpdateAttendanceInput {
  checkIn?: Date | null;
  checkOut?: Date | null;
  status?: AttendanceStatus;
  notes?: string | null;
}

function startOfDay(date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfDay(date = new Date()): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);

  return result;
}

function getTimeForDate(
  date: Date,
  time: string,
): Date {
  const [hoursText = "0", minutesText = "0"] =
    time.split(":");

  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    throw new Error(
      `Invalid time setting: ${time}`,
    );
  }

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);

  return result;
}

function differenceInMinutes(
  start: Date,
  end: Date,
): number {
  return Math.max(
    0,
    Math.floor(
      (end.getTime() - start.getTime()) / 60_000,
    ),
  );
}

function validateDate(value: Date): void {
  if (Number.isNaN(value.getTime())) {
    throw new Error("Invalid date");
  }
}

function validateDateOrder(
  checkIn?: Date | null,
  checkOut?: Date | null,
): void {
  if (
    checkIn &&
    checkOut &&
    checkOut.getTime() <= checkIn.getTime()
  ) {
    throw new Error(
      "Check-out time must be after check-in time",
    );
  }
}

async function getAttendanceSettings() {
  const existingSettings =
    await prisma.attendanceSettings.findFirst();

  if (existingSettings) {
    return existingSettings;
  }

  return prisma.attendanceSettings.create({
    data: {},
  });
}

async function getEmployeeByUserId(
  userId: string,
) {
  const employee =
    await prisma.employee.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

  if (!employee) {
    throw new Error(
      "Employee profile was not found for this user",
    );
  }

  return employee;
}

async function ensureEmployeeExists(
  employeeId: string,
): Promise<void> {
  const employee =
    await prisma.employee.findFirst({
      where: {
        id: employeeId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

  if (!employee) {
    throw new Error(
      "Active employee was not found",
    );
  }
}

export async function checkInEmployee(
  userId: string,
  input: CheckInInput,
) {
  const employee =
    await getEmployeeByUserId(userId);

  const settings =
    await getAttendanceSettings();

  const method =
    input.method ?? AttendanceMethod.WEB;

  if (
    method === AttendanceMethod.WEB &&
    !settings.allowWebCheckIn
  ) {
    throw new Error(
      "Web check-in is disabled",
    );
  }

  if (
    method === AttendanceMethod.MOBILE &&
    !settings.allowMobileCheckIn
  ) {
    throw new Error(
      "Mobile check-in is disabled",
    );
  }

  const now = new Date();
  const attendanceDate = startOfDay(now);

  const existingAttendance =
    await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: attendanceDate,
        },
      },
    });

  if (existingAttendance?.checkIn) {
    throw new Error(
      "You have already checked in today",
    );
  }

  const officeStartTime =
    getTimeForDate(
      now,
      settings.officeStartTime,
    );

  const graceEndTime = new Date(
    officeStartTime.getTime() +
      settings.gracePeriodMinutes * 60_000,
  );

  const lateMinutes =
    now > graceEndTime
      ? differenceInMinutes(
          officeStartTime,
          now,
        )
      : 0;

  const status =
    lateMinutes > 0
      ? AttendanceStatus.LATE
      : AttendanceStatus.PRESENT;

  return prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId: employee.id,
        date: attendanceDate,
      },
    },

    create: {
      employeeId: employee.id,
      date: attendanceDate,
      checkIn: now,
      checkOut: null,
      status,
      method,
      workingMinutes: 0,
      lateMinutes,
      overtimeMinutes: 0,
      notes: input.notes ?? null,
    },

    update: {
      checkIn: now,
      checkOut: null,
      status,
      method,
      workingMinutes: 0,
      lateMinutes,
      overtimeMinutes: 0,
      notes: input.notes ?? null,
    },

    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function checkOutEmployee(
  userId: string,
  input: CheckOutInput,
) {
  const employee =
    await getEmployeeByUserId(userId);

  const settings =
    await getAttendanceSettings();

  const now = new Date();
  const attendanceDate = startOfDay(now);

  const attendance =
    await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: attendanceDate,
        },
      },
    });

  if (!attendance?.checkIn) {
    throw new Error(
      "You must check in before checking out",
    );
  }

  if (attendance.checkOut) {
    throw new Error(
      "You have already checked out today",
    );
  }

  const workingMinutes =
    differenceInMinutes(
      attendance.checkIn,
      now,
    );

  const officeEndTime =
    getTimeForDate(
      now,
      settings.officeEndTime,
    );

  const overtimeMinutes =
    now > officeEndTime
      ? differenceInMinutes(
          officeEndTime,
          now,
        )
      : 0;

  let status = attendance.status;

  if (
    workingMinutes <
    settings.halfDayMinutes
  ) {
    status = AttendanceStatus.HALF_DAY;
  }

  return prisma.attendance.update({
    where: {
      id: attendance.id,
    },

    data: {
      checkOut: now,
      workingMinutes,
      overtimeMinutes,
      status,
      notes:
        input.notes ??
        attendance.notes,
    },

    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function getMyTodayAttendance(
  userId: string,
) {
  const employee =
    await getEmployeeByUserId(userId);

  return prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: employee.id,
        date: startOfDay(),
      },
    },

    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function getMyAttendance(
  userId: string,
  query: AttendanceQuery,
) {
  const employee =
    await getEmployeeByUserId(userId);

  const where: Prisma.AttendanceWhereInput = {
    employeeId: employee.id,
  };

  if (query.startDate || query.endDate) {
    where.date = {
      ...(query.startDate
        ? {
            gte: startOfDay(
              new Date(query.startDate),
            ),
          }
        : {}),

      ...(query.endDate
        ? {
            lte: endOfDay(
              new Date(query.endDate),
            ),
          }
        : {}),
    };
  }

  const skip =
    (query.page - 1) * query.limit;

  const [records, total] =
    await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: {
          date: "desc",
        },
        skip,
        take: query.limit,
      }),

      prisma.attendance.count({
        where,
      }),
    ]);

  return {
    records,

    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages:
        total === 0
          ? 0
          : Math.ceil(
              total / query.limit,
            ),
    },
  };
}

export async function getAllAttendance(
  query: AttendanceQuery,
) {
  const where: Prisma.AttendanceWhereInput = {};

  if (query.employeeId) {
    where.employeeId = query.employeeId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.startDate || query.endDate) {
    where.date = {
      ...(query.startDate
        ? {
            gte: startOfDay(
              new Date(query.startDate),
            ),
          }
        : {}),

      ...(query.endDate
        ? {
            lte: endOfDay(
              new Date(query.endDate),
            ),
          }
        : {}),
    };
  }

  if (query.search) {
    where.employee = {
      OR: [
        {
          firstName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          employeeNumber: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      ],
    };
  }

  const skip =
    (query.page - 1) * query.limit;

  const [records, total] =
    await Promise.all([
      prisma.attendance.findMany({
        where,

        include: {
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              firstName: true,
              lastName: true,

              department: {
                select: {
                  id: true,
                  name: true,
                },
              },

              position: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },

        orderBy: [
          {
            date: "desc",
          },
          {
            checkIn: "asc",
          },
        ],

        skip,
        take: query.limit,
      }),

      prisma.attendance.count({
        where,
      }),
    ]);

  return {
    records,

    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages:
        total === 0
          ? 0
          : Math.ceil(
              total / query.limit,
            ),
    },
  };
}

export async function createManualAttendance(
  input: ManualAttendanceInput,
  createdById: string,
) {
  await ensureEmployeeExists(
    input.employeeId,
  );

  validateDate(input.date);

  if (input.checkIn) {
    validateDate(input.checkIn);
  }

  if (input.checkOut) {
    validateDate(input.checkOut);
  }

  validateDateOrder(
    input.checkIn,
    input.checkOut,
  );

  const attendanceDate =
    startOfDay(input.date);

  const existingAttendance =
    await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: input.employeeId,
          date: attendanceDate,
        },
      },
    });

  if (existingAttendance) {
    throw new Error(
      "Attendance already exists for this employee and date",
    );
  }

  const workingMinutes =
    input.checkIn && input.checkOut
      ? differenceInMinutes(
          input.checkIn,
          input.checkOut,
        )
      : 0;

  return prisma.attendance.create({
    data: {
      employeeId: input.employeeId,
      date: attendanceDate,
      checkIn: input.checkIn ?? null,
      checkOut: input.checkOut ?? null,
      status: input.status,
      method: AttendanceMethod.MANUAL,
      workingMinutes,
      lateMinutes: 0,
      overtimeMinutes: 0,
      notes: input.notes ?? null,
      createdById,
    },

    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,

          department: {
            select: {
              id: true,
              name: true,
            },
          },

          position: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });
}

export async function updateAttendance(
  attendanceId: string,
  input: UpdateAttendanceInput,
  updatedById: string,
) {
  const currentAttendance =
    await prisma.attendance.findUnique({
      where: {
        id: attendanceId,
      },
    });

  if (!currentAttendance) {
    throw new Error(
      "Attendance record was not found",
    );
  }

  const checkIn =
    input.checkIn === undefined
      ? currentAttendance.checkIn
      : input.checkIn;

  const checkOut =
    input.checkOut === undefined
      ? currentAttendance.checkOut
      : input.checkOut;

  if (checkIn) {
    validateDate(checkIn);
  }

  if (checkOut) {
    validateDate(checkOut);
  }

  validateDateOrder(
    checkIn,
    checkOut,
  );

  const workingMinutes =
    checkIn && checkOut
      ? differenceInMinutes(
          checkIn,
          checkOut,
        )
      : 0;

  return prisma.attendance.update({
    where: {
      id: attendanceId,
    },

    data: {
      checkIn,
      checkOut,
      status:
        input.status ??
        currentAttendance.status,
      notes:
        input.notes === undefined
          ? currentAttendance.notes
          : input.notes,
      workingMinutes,
      updatedById,
    },

    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,

          department: {
            select: {
              id: true,
              name: true,
            },
          },

          position: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });
}

export async function deleteAttendance(
  attendanceId: string,
): Promise<void> {
  const attendance =
    await prisma.attendance.findUnique({
      where: {
        id: attendanceId,
      },
      select: {
        id: true,
      },
    });

  if (!attendance) {
    throw new Error(
      "Attendance record was not found",
    );
  }

  await prisma.attendance.delete({
    where: {
      id: attendanceId,
    },
  });
}