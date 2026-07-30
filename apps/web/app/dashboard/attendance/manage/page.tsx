"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Attendance,
  getAllAttendance,
  getMyAttendance,
} from "@/src/services/attendance.service";
import { DateField } from "@/src/components/ui/DateTimeFields";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getStatusClasses(status: string): string {
  switch (status) {
    case "PRESENT":
      return "bg-emerald-100 text-emerald-700";
    case "LATE":
    case "GRACE_LATE":
      return "bg-amber-100 text-amber-700";
    case "HALF_DAY":
      return "bg-orange-100 text-orange-700";
    case "ABSENT":
      return "bg-rose-100 text-rose-700";
    case "ON_LEAVE":
    case "FULL_DAY_LEAVE":
      return "bg-sky-100 text-sky-700";
    case "HOLIDAY":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    return (
      axiosError.response?.data?.message ??
      "Unable to load attendance"
    );
  }

  return "Unable to load attendance";
}

export default function ManageAttendancePage() {
  const router = useRouter();

  const [canManage, setCanManage] = useState(false);
  const [roleReady, setRoleReady] = useState(false);

  const [records, setRecords] = useState<Attendance[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("authUser");
      if (!stored) {
        router.replace("/login");
        return;
      }

      const parsed = JSON.parse(stored) as { role?: string };
      const manage =
        parsed.role === "SUPER_ADMIN" ||
        parsed.role === "HR_MANAGER";

      setCanManage(manage);
      setRoleReady(true);

      if (!manage) {
        router.replace("/dashboard/attendance");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  async function loadRecords(requestedPage = page): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const filters = {
        page: requestedPage,
        limit: 15,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      };

      const response = canManage
        ? await getAllAttendance(filters)
        : await getMyAttendance(filters);

      setRecords(response.records);
      setPage(response.pagination.page);
      setTotalPages(Math.max(1, response.pagination.totalPages));
      setTotal(response.pagination.total);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!roleReady || !canManage) {
      return;
    }

    void loadRecords(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleReady, canManage]);

  function handleFilterSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setPage(1);
    void loadRecords(1);
  }

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);

    window.setTimeout(() => {
      void loadRecords(1);
    }, 0);
  }

  if (!roleReady) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold text-slate-900"
          style={{ fontFamily: "var(--font-source-serif), Georgia, serif" }}
        >
          Manage Attendance
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View and filter attendance for all employees.
        </p>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <DateField
            label="Start date"
            value={startDate}
            onChange={setStartDate}
          />

          <DateField
            label="End date"
            value={endDate}
            minDate={startDate || undefined}
            onChange={setEndDate}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search employee
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or employee no."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
            >
              Apply Filters
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Attendance records
          </h2>
          <span className="text-sm text-slate-500">{total} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Employee
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Check-in
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Check-out
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Working hours
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Overtime
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Method
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-900">
                      <div className="font-medium">
                        {record.employee
                          ? `${record.employee.firstName} ${record.employee.lastName}`
                          : "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {record.employee?.employeeNumber ?? ""}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatDate(record.date)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatTime(record.checkIn)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatTime(record.checkOut)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          record.status,
                        )}`}
                      >
                        {record.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatMinutes(record.workingMinutes)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatMinutes(record.overtimeMinutes)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {record.method}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void loadRecords(page - 1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => void loadRecords(page + 1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
