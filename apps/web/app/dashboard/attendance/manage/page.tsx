"use client";

import { useEffect, useState } from "react";

import {
  type Attendance,
  type AttendanceFilters,
  getMyAttendance,
} from "@/src/services/attendance.service";

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
      return "bg-green-100 text-green-700";

    case "LATE":
      return "bg-yellow-100 text-yellow-700";

    case "HALF_DAY":
      return "bg-orange-100 text-orange-700";

    case "ABSENT":
      return "bg-red-100 text-red-700";

    case "ON_LEAVE":
      return "bg-blue-100 text-blue-700";

    case "HOLIDAY":
      return "bg-purple-100 text-purple-700";

    default:
      return "bg-gray-100 text-gray-700";
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

export default function MyAttendancePage() {
  const [records, setRecords] = useState<Attendance[]>(
    [],
  );

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecords(
    requestedPage = page,
  ): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const filters: AttendanceFilters = {
        page: requestedPage,
        limit: 10,
      };

      if (startDate) {
        filters.startDate = startDate;
      }

      if (endDate) {
        filters.endDate = endDate;
      }

      const response = await getMyAttendance(filters);

      setRecords(response.records);
      setPage(response.pagination.page);
      setTotalPages(
        Math.max(1, response.pagination.totalPages),
      );
      setTotal(response.pagination.total);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setPage(1);

    window.setTimeout(() => {
      void loadRecords(1);
    }, 0);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleFilterSubmit}
        className="rounded-xl border bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label
              htmlFor="startDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Start date
            </label>

            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              End date
            </label>

            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Apply Filters
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Attendance records
          </h2>

          <span className="text-sm text-gray-500">
            {total} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Check-in
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Check-out
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Working hours
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Overtime
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Method
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-gray-500"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-gray-500"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                      {formatTime(record.checkIn)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
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

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                      {formatMinutes(
                        record.workingMinutes,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                      {formatMinutes(
                        record.overtimeMinutes,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                      {record.method}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void loadRecords(page - 1)}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => void loadRecords(page + 1)}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}