import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import type {
    CreateSalaryProfileInput,
    GeneratePayrollInput,
    UpdateSalaryProfileInput,
} from "./payroll.schema.js";

const salaryProfileInclude = {
  employee: {
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.SalaryProfileInclude;

const payrollInclude = {
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
} satisfies Prisma.PayrollInclude;

export async function createSalaryProfile(
  input: CreateSalaryProfileInput,
) {
  const employee =
    await prisma.employee.findUnique({
      where: {
        id: input.employeeId,
      },
      select: {
        id: true,
      },
    });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const existingProfile =
    await prisma.salaryProfile.findUnique({
      where: {
        employeeId: input.employeeId,
      },
      select: {
        id: true,
      },
    });

  if (existingProfile) {
    throw new Error(
      "Salary profile already exists for this employee",
    );
  }

  return prisma.salaryProfile.create({
    data: {
      employeeId: input.employeeId,
      basicSalary: input.basicSalary,
      fixedAllowance:
        input.fixedAllowance ?? 0,
      fixedDeduction:
        input.fixedDeduction ?? 0,
    },

    include: salaryProfileInclude,
  });
}

export async function updateSalaryProfile(
  employeeId: string,
  input: UpdateSalaryProfileInput,
) {
  const profile =
    await prisma.salaryProfile.findUnique({
      where: {
        employeeId,
      },
      select: {
        id: true,
      },
    });

  if (!profile) {
    throw new Error(
      "Salary profile not found",
    );
  }

  return prisma.salaryProfile.update({
    where: {
      employeeId,
    },

    data: {
      ...(input.basicSalary !== undefined
        ? {
            basicSalary:
              input.basicSalary,
          }
        : {}),

      ...(input.fixedAllowance !== undefined
        ? {
            fixedAllowance:
              input.fixedAllowance,
          }
        : {}),

      ...(input.fixedDeduction !== undefined
        ? {
            fixedDeduction:
              input.fixedDeduction,
          }
        : {}),
    },

    include: salaryProfileInclude,
  });
}

export async function getSalaryProfiles() {
  return prisma.salaryProfile.findMany({
    include: salaryProfileInclude,

    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function generatePayroll(
  input: GeneratePayrollInput,
) {
  const salaryProfile =
    await prisma.salaryProfile.findUnique({
      where: {
        employeeId: input.employeeId,
      },
    });

  if (!salaryProfile) {
    throw new Error(
      "Salary profile not found for this employee",
    );
  }

  const existingPayroll =
    await prisma.payroll.findUnique({
      where: {
        employeeId_year_month: {
          employeeId: input.employeeId,
          year: input.year,
          month: input.month,
        },
      },
      select: {
        id: true,
      },
    });

  if (existingPayroll) {
    throw new Error(
      "Payroll already exists for this employee and month",
    );
  }

  const basicSalary =
    Number(salaryProfile.basicSalary);

  const allowances =
    Number(
      salaryProfile.fixedAllowance,
    ) +
    (input.additionalAllowance ?? 0);

  const deductions =
    Number(
      salaryProfile.fixedDeduction,
    ) +
    (input.additionalDeduction ?? 0);

  const grossSalary =
    basicSalary + allowances;

  const netSalary =
    grossSalary - deductions;

  if (netSalary < 0) {
    throw new Error(
      "Net salary cannot be negative",
    );
  }

  return prisma.payroll.create({
    data: {
      employeeId: input.employeeId,
      year: input.year,
      month: input.month,
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
    },

    include: payrollInclude,
  });
}

export async function getPayrolls() {
  return prisma.payroll.findMany({
    include: payrollInclude,

    orderBy: [
      {
        year: "desc",
      },
      {
        month: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function approvePayroll(
  id: string,
) {
  const payroll =
    await prisma.payroll.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  if (payroll.status !== "DRAFT") {
    throw new Error(
      "Only draft payroll can be approved",
    );
  }

  return prisma.payroll.update({
    where: {
      id,
    },

    data: {
      status: "APPROVED",
      approvedAt: new Date(),
    },

    include: payrollInclude,
  });
}

export async function markPayrollPaid(
  id: string,
) {
  const payroll =
    await prisma.payroll.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  if (payroll.status !== "APPROVED") {
    throw new Error(
      "Only approved payroll can be marked as paid",
    );
  }

  return prisma.payroll.update({
    where: {
      id,
    },

    data: {
      status: "PAID",
      paidAt: new Date(),
    },

    include: payrollInclude,
  });
}