import { prisma } from "../../../lib/prisma.js";

import type {
  UpdateAttendancePolicyInput,
} from "./attendance-policy.schema.js";

export async function getAttendancePolicy() {
  const existing =
    await prisma.attendancePolicy.findFirst();

  if (existing) {
    return existing;
  }

  return prisma.attendancePolicy.create({
    data: {},
  });
}

export async function updateAttendancePolicy(
  input: UpdateAttendancePolicyInput,
) {
  const policy =
    await getAttendancePolicy();

  const fullDayMinimum =
    input.fullDayMinimumWorkMinutes ??
    policy.fullDayMinimumWorkMinutes;

  const halfDayMinimum =
    input.halfDayMinimumWorkMinutes ??
    policy.halfDayMinimumWorkMinutes;

  if (
    halfDayMinimum <= fullDayMinimum
  ) {
    throw new Error(
      "Half-day minimum work time must be greater than the full-day leave cutoff",
    );
  }

  return prisma.attendancePolicy.update({
    where: {
      id: policy.id,
    },
    data: input,
  });
}