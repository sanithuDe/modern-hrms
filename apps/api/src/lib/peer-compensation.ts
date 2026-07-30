import {
  Prisma,
} from "../generated/prisma/client.js";

import {
  prisma,
} from "./prisma.js";

export interface CompanyPeerProfile {
  /** Anonymized label only — no personal identifiers sent to the model. */
  label: string;
  positionTitle: string | null;
  departmentName: string | null;
  yearsAtCompany: number | null;
  monthlyCompensation: number;
  latestPerformanceScore: number | null;
  performanceStrengths: string | null;
}

export interface CompanyPeerCompensationContext {
  peers: CompanyPeerProfile[];
  sampleSize: number;
  compensationMin: number | null;
  compensationMedian: number | null;
  compensationP75: number | null;
  compensationMax: number | null;
  averageYearsAtCompany: number | null;
}

function numberFromDecimal(
  value: Prisma.Decimal | number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function yearsSince(date: Date | null | undefined): number | null {
  if (!date) {
    return null;
  }

  const ms = Date.now() - date.getTime();
  if (ms < 0) {
    return 0;
  }

  return Math.round((ms / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }

  return sorted[mid]!;
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );

  return sorted[index] ?? null;
}

/**
 * Loads anonymized peer pay/experience for the same position or department
 * so Gemini can recommend a maximum salary grounded in company data.
 */
export async function getCompanyPeerCompensation(input: {
  positionId: string | null;
  departmentId: string | null;
}): Promise<CompanyPeerCompensationContext> {
  const orFilters: Prisma.EmployeeWhereInput[] = [];

  if (input.positionId) {
    orFilters.push({ positionId: input.positionId });
  }

  if (input.departmentId) {
    orFilters.push({ departmentId: input.departmentId });
  }

  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      salaryProfile: {
        isNot: null,
      },
      ...(orFilters.length > 0
        ? { OR: orFilters }
        : {}),
    },
    select: {
      hireDate: true,
      department: {
        select: { name: true },
      },
      position: {
        select: { title: true },
      },
      salaryProfile: {
        select: {
          basicSalary: true,
          fixedAllowance: true,
        },
      },
      performanceReviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          overallScore: true,
          strengths: true,
        },
      },
    },
    take: 50,
    orderBy: {
      hireDate: "asc",
    },
  });

  const peers: CompanyPeerProfile[] = [];

  for (const [index, employee] of employees.entries()) {
    const basic = numberFromDecimal(employee.salaryProfile?.basicSalary);
    const allowance = numberFromDecimal(employee.salaryProfile?.fixedAllowance) ?? 0;

    if (basic === null) {
      continue;
    }

    const review = employee.performanceReviews[0];

    peers.push({
      label: `Peer-${index + 1}`,
      positionTitle: employee.position?.title ?? null,
      departmentName: employee.department?.name ?? null,
      yearsAtCompany: yearsSince(employee.hireDate),
      monthlyCompensation: Math.round((basic + allowance) * 100) / 100,
      latestPerformanceScore: numberFromDecimal(review?.overallScore),
      performanceStrengths: review?.strengths?.trim() || null,
    });
  }

  const comps = peers.map((peer) => peer.monthlyCompensation);
  const tenures = peers
    .map((peer) => peer.yearsAtCompany)
    .filter((value): value is number => value !== null);

  return {
    peers,
    sampleSize: peers.length,
    compensationMin: comps.length ? Math.min(...comps) : null,
    compensationMedian: median(comps),
    compensationP75: percentile(comps, 75),
    compensationMax: comps.length ? Math.max(...comps) : null,
    averageYearsAtCompany:
      tenures.length > 0
        ? Math.round(
            (tenures.reduce((sum, value) => sum + value, 0) /
              tenures.length) *
              10,
          ) / 10
        : null,
  };
}
