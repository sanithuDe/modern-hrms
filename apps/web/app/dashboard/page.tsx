"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Download,
  MapPin,
  Megaphone,
  Users,
  Wallet,
  X,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnnouncements,
  type Announcement,
} from "../../src/services/announcement.service";
import {
  getAllAttendance,
  getMyAttendance,
  type Attendance,
} from "../../src/services/attendance.service";
import {
  getEmployees,
  type Employee,
} from "../../src/services/employee.service";
import {
  getLeaveRequests,
  getMyLeaveBalances,
  getMyLeaveRequests,
  reviewLeaveRequest,
  type LeaveBalance,
  type LeaveRequest,
} from "../../src/services/leave.service";
import {
  getMyPayrolls,
  getPayrolls,
  type Payroll,
} from "../../src/services/payroll.service";
import {
  getPerformanceReviews,
  type PerformanceReview,
} from "../../src/services/performance.service";

interface StoredUser {
  email: string;
  role: string;
}

const DEPT_COLORS = [
  "#0c4a4e",
  "#14686e",
  "#1a8a7d",
  "#3d9b8f",
  "#6bb5ab",
  "#9fd0c8",
  "#c5e3de",
];

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const responseError = error as {
      response?: { data?: { message?: string } };
    };
    const message = responseError.response?.data?.message;
    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load dashboard information";
}

function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function attendanceStatusLabel(status: Attendance["status"]): string {
  if (status === "LATE" || status === "GRACE_LATE") {
    return "Late";
  }
  if (status === "PRESENT") {
    return "On-Time";
  }
  if (status === "ON_LEAVE" || status === "FULL_DAY_LEAVE") {
    return "Leave";
  }
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function CardLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand)]"
      aria-label="Open details"
    >
      <ArrowUpRight size={16} />
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const canManage =
    user?.role === "SUPER_ADMIN" || user?.role === "HR_MANAGER";

  async function loadDashboard(parsedUser: StoredUser): Promise<void> {
    setError("");

    const today = todayKey();
    const manage = parsedUser.role === "SUPER_ADMIN" || parsedUser.role === "HR_MANAGER";

    const results = await Promise.allSettled([
      manage ? getEmployees() : Promise.resolve([] as Employee[]),
      manage
        ? getAllAttendance({ startDate: today, endDate: today, limit: 20 })
        : getMyAttendance({ startDate: today, endDate: today }),
      manage ? getLeaveRequests() : getMyLeaveRequests(),
      manage ? getPayrolls() : getMyPayrolls(),
      manage
        ? getPerformanceReviews()
        : Promise.resolve([] as PerformanceReview[]),
      getAnnouncements(),
      manage
        ? Promise.resolve([] as LeaveBalance[])
        : getMyLeaveBalances(),
    ]);

    if (results[0].status === "fulfilled") {
      setEmployees(results[0].value);
    } else {
      setEmployees([]);
    }

    if (results[1].status === "fulfilled") {
      setAttendance(results[1].value.records.slice(0, 8));
    } else {
      setAttendance([]);
    }

    if (results[2].status === "fulfilled") {
      setLeaveRequests(results[2].value);
    } else {
      setLeaveRequests([]);
    }

    if (results[3].status === "fulfilled") {
      setPayrolls(results[3].value);
    } else {
      setPayrolls([]);
    }

    if (results[4].status === "fulfilled") {
      setReviews(results[4].value);
    } else {
      setReviews([]);
    }

    if (results[5].status === "fulfilled") {
      setAnnouncements(
        results[5].value
          .filter((item) => item.status === "PUBLISHED")
          .slice(0, 5),
      );
    } else {
      setAnnouncements([]);
    }

    if (results[6].status === "fulfilled") {
      setLeaveBalances(results[6].value);
    } else {
      setLeaveBalances([]);
    }

    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") {
      setError(getErrorMessage(failed.reason));
    }
  }

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    const storedUserValue = window.localStorage.getItem("authUser");

    if (!token || !storedUserValue) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    let isMounted = true;

    async function boot(storedUser: string): Promise<void> {
      try {
        const parsedUser = JSON.parse(storedUser) as StoredUser;
        if (!isMounted) {
          return;
        }

        setUser(parsedUser);
        await loadDashboard(parsedUser);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError(getErrorMessage(loadError));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void boot(storedUserValue);

    return () => {
      isMounted = false;
    };
  }, [router]);

  const departmentSlices = useMemo(() => {
    const counts = new Map<string, number>();

    for (const employee of employees) {
      const name = employee.department?.name?.trim() || "Unassigned";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    const total = employees.length || 1;

    return Array.from(counts.entries())
      .map(([name, value]) => ({
        name,
        value,
        percent: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [employees]);

  const recentHires = useMemo(() => {
    return [...employees]
      .sort(
        (a, b) =>
          new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime(),
      )
      .slice(0, 5);
  }, [employees]);

  const pendingLeaves = useMemo(() => {
    return leaveRequests
      .filter((request) => request.status === "PENDING")
      .slice(0, 5);
  }, [leaveRequests]);

  const leaveBalanceRows = useMemo(() => {
    return leaveBalances.map((balance) => {
      const allocated = Number(balance.allocatedDays);
      const used = Number(balance.usedDays);
      const remaining = Math.max(0, allocated - used);
      return {
        id: balance.id,
        name: balance.leaveType.name,
        remaining,
        allocated,
      };
    });
  }, [leaveBalances]);

  const payrollStats = useMemo(() => {
    const paid = payrolls.filter((item) => item.status === "PAID").length;
    const pending = payrolls.filter(
      (item) => item.status === "APPROVED",
    ).length;
    const draft = payrolls.filter((item) => item.status === "DRAFT").length;
    const total = payrolls.length || 1;
    const completedPercent = Math.round((paid / total) * 100);

    return { paid, pending, draft, total: payrolls.length, completedPercent };
  }, [payrolls]);

  const kpiSeries = useMemo(() => {
    const byDept = new Map<string, number[]>();

    for (const review of reviews) {
      if (review.status !== "COMPLETED") {
        continue;
      }

      const dept = review.employee.department?.name || "General";
      const score = Number(review.overallScore);
      if (Number.isNaN(score)) {
        continue;
      }

      const list = byDept.get(dept) ?? [];
      list.push(score);
      byDept.set(dept, list);
    }

    const departments = Array.from(byDept.keys()).slice(0, 5);
    if (departments.length === 0) {
      return {
        average: 0,
        chart: [
          { label: "Jan", score: 0 },
          { label: "Feb", score: 0 },
          { label: "Mar", score: 0 },
          { label: "Apr", score: 0 },
        ],
        legend: [] as string[],
      };
    }

    const averages = departments.map((dept) => {
      const scores = byDept.get(dept) ?? [];
      const avg =
        scores.reduce((sum, score) => sum + score, 0) /
        (scores.length || 1);
      return { dept, avg: Number(avg.toFixed(1)) };
    });

    const overall =
      averages.reduce((sum, item) => sum + item.avg, 0) /
      (averages.length || 1);

    const chart = averages.map((item) => ({
      label: item.dept.length > 10 ? `${item.dept.slice(0, 10)}…` : item.dept,
      score: item.avg,
      full: item.dept,
    }));

    return {
      average: Number(overall.toFixed(2)),
      chart,
      legend: departments,
    };
  }, [reviews]);

  async function handleLeaveReview(
    id: string,
    decision: "APPROVED" | "REJECTED",
  ): Promise<void> {
    try {
      setActionId(id);
      setError("");
      await reviewLeaveRequest(id, { decision });
      if (user) {
        await loadDashboard(user);
      }
    } catch (reviewError) {
      setError(getErrorMessage(reviewError));
    } finally {
      setActionId(null);
    }
  }

  function handleExport(): void {
    const rows = [
      ["Metric", "Value"],
      ["Total Employees", String(employees.length)],
      ["Pending Leave", String(pendingLeaves.length)],
      ["Published Announcements", String(announcements.length)],
      ["Payroll Paid", String(payrollStats.paid)],
      ["Payroll Pending", String(payrollStats.pending)],
      ["Payroll Draft", String(payrollStats.draft)],
      ["Avg Team KPI", String(kpiSeries.average)],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wrdn-dashboard-${todayKey()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--brand)]" />
          <p className="mt-4 text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          User information could not be loaded. Please log in again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {canManage
            ? "Manager snapshot · live from your HR records"
            : "Your personal HR snapshot"}
        </p>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-dark)]"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {canManage ? (
      <section className="grid gap-5 xl:grid-cols-3 xl:items-stretch">
        <article className="flex h-full min-h-[26rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Total Employee
            </h2>
            <CardLink href="/dashboard/employees" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {employees.length > 0 ? (
              <div className="relative mx-auto my-auto h-52 w-full max-w-[15rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentSlices}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {departmentSlices.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={DEPT_COLORS[index % DEPT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${value} employees`,
                        String(name),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p
                    className="text-3xl font-semibold text-slate-900"
                    style={{
                      fontFamily: "var(--font-source-serif), Georgia, serif",
                    }}
                  >
                    {employees.length}
                  </p>
                  <p className="text-xs text-slate-500">Employee</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <Users className="text-slate-300" size={36} />
                <p className="mt-3 text-sm text-slate-500">
                  No department breakdown yet
                </p>
              </div>
            )}

            {departmentSlices.length > 0 ? (
              <div className="mt-auto flex flex-wrap justify-center gap-x-3 gap-y-1 pt-3">
                {departmentSlices.slice(0, 5).map((slice, index) => (
                  <span
                    key={slice.name}
                    className="inline-flex items-center gap-1.5 text-[11px] text-slate-600"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background:
                          DEPT_COLORS[index % DEPT_COLORS.length],
                      }}
                    />
                    {slice.percent}% {slice.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>

        <article className="flex h-full min-h-[26rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Today&apos;s Attendance
            </h2>
            <CardLink href="/dashboard/attendance" />
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {attendance.length === 0 ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                <Clock3 className="text-slate-300" size={32} />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Waiting for today&apos;s check-ins
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Records appear here after employees punch in
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Clock In</th>
                    <th className="pb-2 font-medium">Clock Out</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => {
                    const late =
                      record.status === "LATE" ||
                      record.status === "GRACE_LATE";
                    const onTime = record.status === "PRESENT";

                    return (
                      <tr
                        key={record.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-2.5 text-slate-500">
                          {record.employee?.employeeNumber ?? "—"}
                        </td>
                        <td className="py-2.5 font-medium text-slate-800">
                          {record.employee
                            ? `${record.employee.firstName} ${record.employee.lastName}`
                            : "You"}
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {formatTime(record.checkIn)}
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {formatTime(record.checkOut)}
                        </td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <span
                              className={[
                                "h-2 w-2 rounded-full",
                                late
                                  ? "bg-amber-500"
                                  : onTime
                                    ? "bg-emerald-500"
                                    : "bg-slate-400",
                              ].join(" ")}
                            />
                            {attendanceStatusLabel(record.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </article>

        <article className="flex h-full min-h-[26rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Hires
            </h2>
            <CardLink href="/dashboard/employees" />
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {recentHires.length === 0 ? (
              <div className="flex h-full min-h-[16rem] items-center justify-center text-center text-sm text-slate-500">
                No employee records yet.
              </div>
            ) : (
              recentHires.slice(0, 4).map((employee) => {
                const hire = new Date(employee.hireDate);
                const dayLabel = hire.toLocaleDateString(undefined, {
                  weekday: "short",
                });
                const dayNum = hire.getDate();

                return (
                  <div
                    key={employee.id}
                    className="flex items-start gap-3 rounded-2xl bg-slate-50/80 px-3 py-3"
                  >
                    <div className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                      <span className="text-[10px] font-semibold uppercase">
                        {dayLabel}
                      </span>
                      <span className="text-sm font-bold">{dayNum}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {employee.position?.title ?? "No position"}
                        {employee.department
                          ? ` · ${employee.department.name}`
                          : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={11} />
                          {formatDateShort(employee.hireDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} />
                          {employee.department?.name ?? "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>
      ) : (
      <section className="grid gap-5 xl:grid-cols-3 xl:items-stretch">
        <article className="flex h-full min-h-[26rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              My Leave Balance
            </h2>
            <CardLink href="/dashboard/leave" />
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {leaveBalanceRows.length === 0 ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                <CalendarDays className="text-slate-300" size={32} />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  No leave balances yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Ask HR to allocate your leave types
                </p>
              </div>
            ) : (
              leaveBalanceRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl bg-slate-50/80 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {row.name}
                    </p>
                    <p
                      className="text-lg font-semibold text-[var(--brand)]"
                      style={{
                        fontFamily: "var(--font-source-serif), Georgia, serif",
                      }}
                    >
                      {row.remaining}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.remaining} days left of {row.allocated} allocated
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[var(--brand)]"
                      style={{
                        width: `${row.allocated ? Math.min(100, (row.remaining / row.allocated) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/dashboard/leave"
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Request leave
          </Link>
        </article>

        <article className="flex h-full min-h-[26rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Today&apos;s Attendance
            </h2>
            <CardLink href="/dashboard/attendance" />
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {attendance.length === 0 ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                <Clock3 className="text-slate-300" size={32} />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  You have not checked in today
                </p>
                <Link
                  href="/dashboard/attendance"
                  className="mt-4 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Go to Attendance
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-2xl bg-slate-50/80 px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {formatDateShort(record.date)}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Clock in</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatTime(record.checkIn)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Clock out</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatTime(record.checkOut)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-700">
                      Status: {attendanceStatusLabel(record.status)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        <article className="flex h-full min-h-[26rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Announcements
            </h2>
            <CardLink href="/dashboard/announcements" />
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {announcements.length === 0 ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                <Megaphone className="text-slate-300" size={32} />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  No published announcements
                </p>
              </div>
            ) : (
              announcements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-slate-50/80 px-4 py-3"
                >
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {item.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
      )}

      <section className="grid gap-5 xl:grid-cols-4 xl:items-stretch">
        {canManage ? (
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Average Team&apos;s KPI
            </h2>
            <CardLink href="/dashboard/performance" />
          </div>

          <div className="mb-4">
            <p
              className="text-4xl font-semibold text-slate-900"
              style={{
                fontFamily: "var(--font-source-serif), Georgia, serif",
              }}
            >
              {kpiSeries.average > 0
                ? `${kpiSeries.average}%`
                : "—"}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-600">
              From completed performance reviews
            </p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpiSeries.chart}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8a989b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#8a989b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#14686e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#0c4a4e" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {kpiSeries.legend.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-3">
              {kpiSeries.legend.map((name, index) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-600"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: DEPT_COLORS[index % DEPT_COLORS.length],
                    }}
                  />
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              Complete reviews to see department KPI trends.
            </p>
          )}
        </article>
        ) : (
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Quick actions</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/dashboard/attendance"
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand-soft)]/40"
            >
              <Clock3 className="text-[var(--brand)]" size={20} />
              <p className="mt-3 text-sm font-semibold text-slate-800">Check in / out</p>
              <p className="mt-1 text-xs text-slate-500">Mark today&apos;s attendance</p>
            </Link>
            <Link
              href="/dashboard/leave"
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand-soft)]/40"
            >
              <CalendarDays className="text-[var(--brand)]" size={20} />
              <p className="mt-3 text-sm font-semibold text-slate-800">Request leave</p>
              <p className="mt-1 text-xs text-slate-500">Apply for time off</p>
            </Link>
            <Link
              href="/dashboard/payroll"
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand-soft)]/40"
            >
              <Wallet className="text-[var(--brand)]" size={20} />
              <p className="mt-3 text-sm font-semibold text-slate-800">My payslips</p>
              <p className="mt-1 text-xs text-slate-500">View payroll history</p>
            </Link>
          </div>
        </article>
        )}

        <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Payroll</h2>
            <CardLink href="/dashboard/payroll" />
          </div>

          <p className="text-sm font-semibold text-slate-800">
            {payrollStats.completedPercent}% completed
          </p>

          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="bg-[var(--brand-dark)]"
              style={{
                width: `${payrollStats.total ? (payrollStats.paid / payrollStats.total) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-[var(--brand-mid)]"
              style={{
                width: `${payrollStats.total ? (payrollStats.pending / payrollStats.total) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-[var(--brand-glow)]/50"
              style={{
                width: `${payrollStats.total ? (payrollStats.draft / payrollStats.total) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Paid</span>
              <span className="font-semibold text-slate-900">
                {payrollStats.paid}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pending</span>
              <span className="font-semibold text-slate-900">
                {payrollStats.pending}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Yet to Pay</span>
              <span className="font-semibold text-slate-900">
                {payrollStats.draft}
              </span>
            </div>
          </div>

          <div className="mt-auto border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-11 flex-col items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <span className="text-[10px] font-semibold uppercase">
                  {new Date().toLocaleDateString(undefined, {
                    month: "short",
                  })}
                </span>
                <span className="text-sm font-bold">
                  {new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                    0,
                  ).getDate()}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500">Next Payday</p>
                <Link
                  href="/dashboard/payroll"
                  className="text-sm font-semibold text-[var(--brand)] hover:underline"
                >
                  View Detail
                </Link>
              </div>
            </div>
          </div>
        </article>

        <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Leave Request
            </h2>
            <CardLink href="/dashboard/leave" />
          </div>

          <div className="flex-1 space-y-3">
            {pendingLeaves.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No pending leave requests.
              </p>
            ) : (
              pendingLeaves.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50/80 px-3 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand)]">
                    {request.employee.firstName.charAt(0)}
                    {request.employee.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {request.employee.firstName}{" "}
                      {request.employee.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {request.leaveType.name} · {request.totalDays} day
                      {Number(request.totalDays) === 1 ? "" : "s"}
                    </p>
                  </div>

                  {canManage ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        disabled={actionId === request.id}
                        onClick={() =>
                          void handleLeaveReview(request.id, "APPROVED")
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        aria-label="Approve leave"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={actionId === request.id}
                        onClick={() =>
                          void handleLeaveReview(request.id, "REJECTED")
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        aria-label="Reject leave"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                      <Clock3 size={12} />
                      Pending
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
