import {
  AttendanceMethod,
  AttendanceStatus,
  type Prisma,
} from "../../generated/prisma/client.js";

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
  shiftId?: string | null;
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

const attendanceInclude = {
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

  shift: {
    select: {
      id: true,
      name: true,
      code: true,
      startTimeMinutes: true,
      endTimeMinutes: true,
      crossesMidnight: true,
      graceMinutes: true,
      requiredWorkMinutes: true,
      isActive: true,
    },
  },
} satisfies Prisma.AttendanceInclude;

function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);

  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}

function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function createDateAtMinutes(
  date: Date,
  totalMinutes: number,
): Date {
  const result = startOfDay(date);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

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
      (end.getTime() - start.getTime()) /
        60_000,
    ),
  );
}

function parseDate(
  value: string,
  fieldName: string,
): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${fieldName} must be a valid date`,
    );
  }

  return date;
}

function getMonthRange(date: Date): {
  start: Date;
  end: Date;
} {
  return {
    start: new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
    ),

    end: new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      1,
    ),
  };
}

async function getAttendancePolicy() {
  const existing =
    await prisma.attendancePolicy.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

  if (existing) {
    return existing;
  }

  return prisma.attendancePolicy.create({
    data: {
      monthlyShortLeaveCount: 2,
      monthlyShortLeaveMinutes: 180,
      fullDayMinimumWorkMinutes: 240,
      halfDayMinimumWorkMinutes: 420,
      allowWebCheckIn: true,
      allowMobileCheckIn: true,
    },
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

      select: {
        id: true,
        userId: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
      },
    });

  if (!employee) {
    throw new Error(
      "Active employee profile was not found",
    );
  }

  return employee;
}

async function findActiveShiftAssignment(
  employeeId: string,
  moment: Date,
) {
  return prisma.employeeShiftAssignment.findFirst({
    where: {
      employeeId,
      isActive: true,

      effectiveFrom: {
        lte: moment,
      },

      OR: [
        {
          effectiveTo: null,
        },
        {
          effectiveTo: {
            gte: moment,
          },
        },
      ],

      shift: {
        isActive: true,
      },
    },

    include: {
      shift: true,
    },

    orderBy: {
      effectiveFrom: "desc",
    },
  });
}

async function getActiveShiftAssignment(
  employeeId: string,
  moment: Date,
) {
  const assignment =
    await findActiveShiftAssignment(
      employeeId,
      moment,
    );

  if (!assignment) {
    throw new Error(
      "No active shift has been assigned to this employee",
    );
  }

  return assignment;
}

function buildShiftSchedule(
  moment: Date,
  shift: {
    startTimeMinutes: number;
    endTimeMinutes: number;
    crossesMidnight: boolean;
  },
): {
  attendanceDate: Date;
  scheduledStart: Date;
  scheduledEnd: Date;
} {
  let attendanceDate = startOfDay(moment);

  const currentMinutes =
    minutesFromMidnight(moment);

  /*
   * Night shift example:
   * 18:00 -> 08:00.
   *
   * At 02:00 on 30 July, the attendance date
   * is 29 July because the shift began then.
   */
  if (
    shift.crossesMidnight &&
    currentMinutes < shift.endTimeMinutes
  ) {
    attendanceDate = addDays(
      attendanceDate,
      -1,
    );
  }

  const scheduledStart =
    createDateAtMinutes(
      attendanceDate,
      shift.startTimeMinutes,
    );

  let scheduledEnd =
    createDateAtMinutes(
      attendanceDate,
      shift.endTimeMinutes,
    );

  if (shift.crossesMidnight) {
    scheduledEnd = addDays(
      scheduledEnd,
      1,
    );
  }

  return {
    attendanceDate,
    scheduledStart,
    scheduledEnd,
  };
}

async function getMonthlyShortLeaveUsage(
  employeeId: string,
  date: Date,
  excludeAttendanceId?: string,
): Promise<{
  count: number;
  minutes: number;
}> {
  const range = getMonthRange(date);

  const records =
    await prisma.attendance.findMany({
      where: {
        employeeId,

        ...(excludeAttendanceId
          ? {
              id: {
                not: excludeAttendanceId,
              },
            }
          : {}),

        date: {
          gte: range.start,
          lt: range.end,
        },

        shortLeaveMinutes: {
          gt: 0,
        },
      },

      select: {
        shortLeaveMinutes: true,
      },
    });

  return {
    count: records.length,

    minutes: records.reduce(
      (total, record) =>
        total + record.shortLeaveMinutes,
      0,
    ),
  };
}

function calculateMetrics(
  checkIn: Date | null,
  checkOut: Date | null,
  scheduledStart: Date | null,
  scheduledEnd: Date | null,
): {
  workingMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  earlyLeaveMinutes: number;
} {
  const workingMinutes =
    checkIn && checkOut
      ? differenceInMinutes(
          checkIn,
          checkOut,
        )
      : 0;

  const lateMinutes =
    checkIn &&
    scheduledStart &&
    checkIn > scheduledStart
      ? differenceInMinutes(
          scheduledStart,
          checkIn,
        )
      : 0;

  const overtimeMinutes =
    checkOut &&
    scheduledEnd &&
    checkOut > scheduledEnd
      ? differenceInMinutes(
          scheduledEnd,
          checkOut,
        )
      : 0;

  const earlyLeaveMinutes =
    checkOut &&
    scheduledEnd &&
    checkOut < scheduledEnd
      ? differenceInMinutes(
          checkOut,
          scheduledEnd,
        )
      : 0;

  return {
    workingMinutes,
    lateMinutes,
    overtimeMinutes,
    earlyLeaveMinutes,
  };
}

export async function checkInEmployee(
  userId: string,
  input: CheckInInput,
) {
  const employee =
    await getEmployeeByUserId(userId);

  const policy =
    await getAttendancePolicy();

  const method =
    input.method ?? AttendanceMethod.WEB;

  if (
    method === AttendanceMethod.WEB &&
    !policy.allowWebCheckIn
  ) {
    throw new Error(
      "Web check-in is disabled",
    );
  }

  if (
    method === AttendanceMethod.MOBILE &&
    !policy.allowMobileCheckIn
  ) {
    throw new Error(
      "Mobile check-in is disabled",
    );
  }

  const now = new Date();

  /*
   * This is intentionally strict.
   * An employee cannot check in until HR
   * assigns an active shift.
   */
  const assignment =
    await getActiveShiftAssignment(
      employee.id,
      now,
    );

  const schedule =
    buildShiftSchedule(
      now,
      assignment.shift,
    );

  if (now >= schedule.scheduledEnd) {
    throw new Error(
      "You cannot check in after the shift has ended",
    );
  }

  const openAttendance =
    await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,

        checkIn: {
          not: null,
        },

        checkOut: null,
      },

      select: {
        id: true,
      },

      orderBy: {
        checkIn: "desc",
      },
    });

  if (openAttendance) {
    throw new Error(
      "You already have an active attendance record. Please check out first.",
    );
  }

  const existingAttendance =
    await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: schedule.attendanceDate,
        },
      },
    });

  if (existingAttendance?.checkIn) {
    throw new Error(
      "You have already checked in for this shift",
    );
  }

  const graceEnd = new Date(
    schedule.scheduledStart.getTime() +
      assignment.shift.graceMinutes *
        60_000,
  );

  const actualLateMinutes =
    now > schedule.scheduledStart
      ? differenceInMinutes(
          schedule.scheduledStart,
          now,
        )
      : 0;

  let status: AttendanceStatus =
    AttendanceStatus.PRESENT;

  let shortLeaveMinutes = 0;

  if (actualLateMinutes > 0) {
    if (now <= graceEnd) {
      const usage =
        await getMonthlyShortLeaveUsage(
          employee.id,
          schedule.attendanceDate,
        );

      const countAllowed =
        usage.count <
        policy.monthlyShortLeaveCount;

      const minutesAllowed =
        usage.minutes +
          actualLateMinutes <=
        policy.monthlyShortLeaveMinutes;

      if (
        countAllowed &&
        minutesAllowed
      ) {
        status =
          AttendanceStatus.GRACE_LATE;

        shortLeaveMinutes =
          actualLateMinutes;
      } else {
        status =
          AttendanceStatus.LATE;
      }
    } else {
      status =
        AttendanceStatus.LATE;
    }
  }

  return prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId: employee.id,
        date: schedule.attendanceDate,
      },
    },

    create: {
      employeeId: employee.id,
      shiftId: assignment.shift.id,

      date: schedule.attendanceDate,

      scheduledStart:
        schedule.scheduledStart,

      scheduledEnd:
        schedule.scheduledEnd,

      checkIn: now,
      checkOut: null,

      status,
      method,

      workingMinutes: 0,
      lateMinutes: actualLateMinutes,
      overtimeMinutes: 0,
      earlyLeaveMinutes: 0,
      shortLeaveMinutes,
      leaveDayValue: 0,

      notes:
        input.notes?.trim() || null,
    },

    update: {
      shiftId: assignment.shift.id,

      scheduledStart:
        schedule.scheduledStart,

      scheduledEnd:
        schedule.scheduledEnd,

      checkIn: now,
      checkOut: null,

      status,
      method,

      workingMinutes: 0,
      lateMinutes: actualLateMinutes,
      overtimeMinutes: 0,
      earlyLeaveMinutes: 0,
      shortLeaveMinutes,
      leaveDayValue: 0,

      notes:
        input.notes?.trim() || null,
    },

    include: attendanceInclude,
  });
}

export async function checkOutEmployee(
  userId: string,
  input: CheckOutInput,
) {
  const employee =
    await getEmployeeByUserId(userId);

  const policy =
    await getAttendancePolicy();

  /*
   * Search for an open record instead of
   * searching only today's calendar date.
   */
  const attendance =
    await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,

        checkIn: {
          not: null,
        },

        checkOut: null,
      },

      orderBy: {
        checkIn: "desc",
      },
    });

  if (!attendance?.checkIn) {
    throw new Error(
      "You must check in before checking out",
    );
  }

  const now = new Date();

  if (now <= attendance.checkIn) {
    throw new Error(
      "Check-out time must be after check-in time",
    );
  }

  const metrics = calculateMetrics(
    attendance.checkIn,
    now,
    attendance.scheduledStart,
    attendance.scheduledEnd,
  );

  let status: AttendanceStatus =
    attendance.status;

  let leaveDayValue = 0;

  let shortLeaveMinutes =
    attendance.shortLeaveMinutes;

  if (
    metrics.workingMinutes <
    policy.fullDayMinimumWorkMinutes
  ) {
    status =
      AttendanceStatus.FULL_DAY_LEAVE;

    leaveDayValue = 1;
  } else if (
    metrics.workingMinutes <
    policy.halfDayMinimumWorkMinutes
  ) {
    status =
      AttendanceStatus.HALF_DAY;

    leaveDayValue = 0.5;
  } else if (
    metrics.earlyLeaveMinutes > 0
  ) {
    const usage =
      await getMonthlyShortLeaveUsage(
        employee.id,
        attendance.date,
        attendance.id,
      );

    const proposedRecordMinutes =
      attendance.shortLeaveMinutes +
      metrics.earlyLeaveMinutes;

    const proposedMonthlyCount =
      usage.count + 1;

    const proposedMonthlyMinutes =
      usage.minutes +
      proposedRecordMinutes;

    const countAllowed =
      proposedMonthlyCount <=
      policy.monthlyShortLeaveCount;

    const minutesAllowed =
      proposedMonthlyMinutes <=
      policy.monthlyShortLeaveMinutes;

    if (
      countAllowed &&
      minutesAllowed
    ) {
      status =
        AttendanceStatus.SHORT_LEAVE;

      shortLeaveMinutes =
        proposedRecordMinutes;
    } else {
      status =
        AttendanceStatus.EARLY_DEPARTURE;
    }
  } else if (
    status !==
      AttendanceStatus.GRACE_LATE &&
    status !==
      AttendanceStatus.LATE
  ) {
    status =
      AttendanceStatus.PRESENT;
  }

  return prisma.attendance.update({
    where: {
      id: attendance.id,
    },

    data: {
      checkOut: now,

      workingMinutes:
        metrics.workingMinutes,

      lateMinutes:
        metrics.lateMinutes,

      overtimeMinutes:
        metrics.overtimeMinutes,

      earlyLeaveMinutes:
        metrics.earlyLeaveMinutes,

      shortLeaveMinutes,
      leaveDayValue,
      status,

      notes:
        input.notes?.trim() ||
        attendance.notes,
    },

    include: attendanceInclude,
  });
}

export async function getMyTodayAttendance(
  userId: string,
) {
  const employee =
    await getEmployeeByUserId(userId);

  /*
   * Keep an unfinished night shift visible
   * even after midnight.
   */
  const openAttendance =
    await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,

        checkIn: {
          not: null,
        },

        checkOut: null,
      },

      include: attendanceInclude,

      orderBy: {
        checkIn: "desc",
      },
    });

  if (openAttendance) {
    return openAttendance;
  }

  const now = new Date();

  /*
   * Missing assignment is allowed when loading
   * the page. Return null instead of HTTP 500.
   */
  const assignment =
    await findActiveShiftAssignment(
      employee.id,
      now,
    );

  if (!assignment) {
    return null;
  }

  const schedule =
    buildShiftSchedule(
      now,
      assignment.shift,
    );

  return prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: employee.id,
        date: schedule.attendanceDate,
      },
    },

    include: attendanceInclude,
  });
}

export async function getMyAttendance(
  userId: string,
  query: AttendanceQuery,
) {
  const employee =
    await getEmployeeByUserId(userId);

  return getAttendanceRecords({
    ...query,
    employeeId: employee.id,
  });
}

export async function getAllAttendance(
  query: AttendanceQuery,
) {
  return getAttendanceRecords(query);
}

async function getAttendanceRecords(
  query: AttendanceQuery,
) {
  const where:
    Prisma.AttendanceWhereInput = {};

  if (query.employeeId) {
    where.employeeId =
      query.employeeId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (
    query.startDate ||
    query.endDate
  ) {
    where.date = {
      ...(query.startDate
        ? {
            gte: startOfDay(
              parseDate(
                query.startDate,
                "Start date",
              ),
            ),
          }
        : {}),

      ...(query.endDate
        ? {
            lte: endOfDay(
              parseDate(
                query.endDate,
                "End date",
              ),
            ),
          }
        : {}),
    };
  }

  const search =
    query.search?.trim();

  if (search) {
    where.employee = {
      OR: [
        {
          firstName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          employeeNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    };
  }

  const page = Math.max(
    1,
    query.page,
  );

  const limit = Math.min(
    100,
    Math.max(1, query.limit),
  );

  const skip =
    (page - 1) * limit;

  const [records, total] =
    await Promise.all([
      prisma.attendance.findMany({
        where,
        include: attendanceInclude,

        orderBy: [
          {
            date: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        skip,
        take: limit,
      }),

      prisma.attendance.count({
        where,
      }),
    ]);

  return {
    records,

    pagination: {
      page,
      limit,
      total,

      totalPages:
        total === 0
          ? 0
          : Math.ceil(
              total / limit,
            ),
    },
  };
}

export async function createManualAttendance(
  input: ManualAttendanceInput,
  createdById: string,
) {
  const employee =
    await prisma.employee.findFirst({
      where: {
        id: input.employeeId,
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

  const attendanceDate =
    startOfDay(input.date);

  const existing =
    await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: input.employeeId,
          date: attendanceDate,
        },
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    throw new Error(
      "Attendance already exists for this employee and date",
    );
  }

  let scheduledStart: Date | null =
    null;

  let scheduledEnd: Date | null =
    null;

  if (input.shiftId) {
    const shift =
      await prisma.shift.findUnique({
        where: {
          id: input.shiftId,
        },
      });

    if (!shift) {
      throw new Error(
        "Selected shift was not found",
      );
    }

    const schedule =
      buildShiftSchedule(
        attendanceDate,
        shift,
      );

    scheduledStart =
      schedule.scheduledStart;

    scheduledEnd =
      schedule.scheduledEnd;
  }

  const checkIn =
    input.checkIn ?? null;

  const checkOut =
    input.checkOut ?? null;

  if (
    checkIn &&
    checkOut &&
    checkOut <= checkIn
  ) {
    throw new Error(
      "Check-out time must be after check-in time",
    );
  }

  const metrics = calculateMetrics(
    checkIn,
    checkOut,
    scheduledStart,
    scheduledEnd,
  );

  return prisma.attendance.create({
    data: {
      employeeId: input.employeeId,
      shiftId: input.shiftId ?? null,

      date: attendanceDate,

      scheduledStart,
      scheduledEnd,

      checkIn,
      checkOut,

      status: input.status,
      method: AttendanceMethod.MANUAL,

      workingMinutes:
        metrics.workingMinutes,

      lateMinutes:
        metrics.lateMinutes,

      overtimeMinutes:
        metrics.overtimeMinutes,

      earlyLeaveMinutes:
        metrics.earlyLeaveMinutes,

      shortLeaveMinutes: 0,
      leaveDayValue: 0,

      notes:
        input.notes?.trim() || null,

      createdById,
    },

    include: attendanceInclude,
  });
}

export async function updateAttendance(
  attendanceId: string,
  input: UpdateAttendanceInput,
  updatedById: string,
) {
  const current =
    await prisma.attendance.findUnique({
      where: {
        id: attendanceId,
      },
    });

  if (!current) {
    throw new Error(
      "Attendance record was not found",
    );
  }

  const checkIn =
    input.checkIn === undefined
      ? current.checkIn
      : input.checkIn;

  const checkOut =
    input.checkOut === undefined
      ? current.checkOut
      : input.checkOut;

  if (
    checkIn &&
    checkOut &&
    checkOut <= checkIn
  ) {
    throw new Error(
      "Check-out time must be after check-in time",
    );
  }

  const metrics = calculateMetrics(
    checkIn,
    checkOut,
    current.scheduledStart,
    current.scheduledEnd,
  );

  return prisma.attendance.update({
    where: {
      id: attendanceId,
    },

    data: {
      checkIn,
      checkOut,

      workingMinutes:
        metrics.workingMinutes,

      lateMinutes:
        metrics.lateMinutes,

      overtimeMinutes:
        metrics.overtimeMinutes,

      earlyLeaveMinutes:
        metrics.earlyLeaveMinutes,

      status:
        input.status ??
        current.status,

      notes:
        input.notes === undefined
          ? current.notes
          : input.notes?.trim() ||
            null,

      updatedById,
    },

    include: attendanceInclude,
  });
}

export async function deleteAttendance(
  attendanceId: string,
): Promise<void> {
  const existing =
    await prisma.attendance.findUnique({
      where: {
        id: attendanceId,
      },

      select: {
        id: true,
      },
    });

  if (!existing) {
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