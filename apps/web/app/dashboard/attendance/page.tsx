"use client";

import axios from "axios";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    type Attendance,
    checkIn,
    checkOut,
    getTodayAttendance,
} from "../../../src/services/attendance.service";

function formatTime(
  value: string | null | undefined,
): string {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMinutes(
  value: number | null | undefined,
): string {
  const minutes =
    typeof value === "number" &&
    Number.isFinite(value)
      ? Math.max(0, value)
      : 0;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getErrorMessage(
  error: unknown,
): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : "Something went wrong";
  }

  if (!error.response) {
    return "Cannot connect to the attendance API.";
  }

  const responseData = error.response.data;

  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "message" in responseData &&
    typeof responseData.message === "string"
  ) {
    return responseData.message;
  }

  return `Request failed with status ${error.response.status}`;
}

function getStatusStyle(
  status?: string,
): {
  label: string;
  className: string;
} {
  switch (status) {
    case "PRESENT":
      return {
        label: "Present",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "LATE":
      return {
        label: "Late",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "HALF_DAY":
      return {
        label: "Half Day",
        className:
          "border-orange-200 bg-orange-50 text-orange-700",
      };

    case "ABSENT":
      return {
        label: "Absent",
        className:
          "border-red-200 bg-red-50 text-red-700",
      };

    case "ON_LEAVE":
      return {
        label: "On Leave",
        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "HOLIDAY":
      return {
        label: "Holiday",
        className:
          "border-purple-200 bg-purple-50 text-purple-700",
      };

    default:
      return {
        label: "Not Checked In",
        className:
          "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M9 5H5v14h4" />
      <path d="M13 8l4 4-4 4" />
      <path d="M17 12H8" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M15 5h4v14h-4" />
      <path d="M11 8l-4 4 4 4" />
      <path d="M7 12h9" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}

export default function AttendancePage() {
  const [attendance, setAttendance] =
    useState<Attendance | null>(null);

  const [currentTime, setCurrentTime] =
    useState<Date | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState<
    "check-in" | "check-out" | null
  >(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const loadAttendance =
    useCallback(
      async (): Promise<void> => {
        try {
          setLoading(true);
          setError("");

          const result =
            await getTodayAttendance();

          setAttendance(result);
        } catch (requestError) {
          setAttendance(null);
          setError(
            getErrorMessage(requestError),
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    setCurrentTime(new Date());

    const timer =
      window.setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const hasCheckedIn =
    Boolean(attendance?.checkIn);

  const hasCheckedOut =
    Boolean(attendance?.checkOut);

  const liveWorkingMinutes =
    useMemo(() => {
      if (
        !attendance?.checkIn ||
        !currentTime
      ) {
        return 0;
      }

      if (attendance.checkOut) {
        return (
          attendance.workingMinutes ?? 0
        );
      }

      const checkInTime =
        new Date(
          attendance.checkIn,
        ).getTime();

      if (
        Number.isNaN(checkInTime)
      ) {
        return 0;
      }

      return Math.max(
        0,
        Math.floor(
          (
            currentTime.getTime() -
            checkInTime
          ) /
            60_000,
        ),
      );
    }, [
      attendance,
      currentTime,
    ]);

  const targetMinutes = 480;

  const progress = Math.min(
    100,
    Math.round(
      (
        liveWorkingMinutes /
        targetMinutes
      ) *
        100,
    ),
  );

  const remainingMinutes =
    Math.max(
      0,
      targetMinutes -
        liveWorkingMinutes,
    );

  const statusStyle =
    getStatusStyle(
      attendance?.status,
    );

  async function handleCheckIn(): Promise<void> {
    try {
      setActionLoading("check-in");
      setError("");
      setMessage("");

      const result =
        await checkIn();

      setAttendance(result);

      setMessage(
        "You checked in successfully.",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCheckOut(): Promise<void> {
    try {
      setActionLoading("check-out");
      setError("");
      setMessage("");

      const result =
        await checkOut();

      setAttendance(result);

      setMessage(
        "You checked out successfully.",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || !currentTime) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-500">
            Loading attendance...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-7 xl:grid-cols-[342px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ClockIcon />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-950">
                Today&apos;s Attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Record your working hours.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Date
            </p>

            <p className="mt-2 text-base font-bold text-slate-950">
              {currentTime.toLocaleDateString(
                [],
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </p>

            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-950">
              {currentTime.toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                },
              )}
            </p>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Status
            </p>

            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyle.className}`}
            >
              {statusStyle.label}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() =>
                void handleCheckIn()
              }
              disabled={
                actionLoading !== null ||
                hasCheckedIn
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#11152b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b2140] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <LoginIcon />

              {actionLoading ===
              "check-in"
                ? "Checking in..."
                : "Check In"}
            </button>

            <button
              type="button"
              onClick={() =>
                void handleCheckOut()
              }
              disabled={
                actionLoading !== null ||
                !hasCheckedIn ||
                hasCheckedOut
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <LogoutIcon />

              {actionLoading ===
              "check-out"
                ? "Checking out..."
                : "Check Out"}
            </button>

            <button
              type="button"
              onClick={() =>
                void loadAttendance()
              }
              disabled={
                actionLoading !== null
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-45"
            >
              <RefreshIcon />

              Refresh
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Today&apos;s Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your current attendance
                activity.
              </p>
            </div>

            <span className="text-sm font-medium text-slate-500">
              {attendance
                ? "Attendance recorded"
                : "No attendance record"}
            </span>
          </div>

          <div className="grid gap-4 border-b border-slate-200 bg-slate-50/60 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Check In
              </p>

              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatTime(
                  attendance?.checkIn,
                )}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Check Out
              </p>

              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatTime(
                  attendance?.checkOut,
                )}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Working Time
              </p>

              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatMinutes(
                  liveWorkingMinutes,
                )}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Remaining
              </p>

              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatMinutes(
                  remainingMinutes,
                )}
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">
                    Daily Work Progress
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Based on an 8-hour
                    workday
                  </p>
                </div>

                <p className="text-lg font-bold text-slate-950">
                  {progress}%
                </p>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#11152b] transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">
                  Late Minutes
                </p>

                <p className="mt-2 text-xl font-bold text-slate-950">
                  {attendance?.lateMinutes ??
                    0}{" "}
                  min
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">
                  Overtime
                </p>

                <p className="mt-2 text-xl font-bold text-slate-950">
                  {attendance
                    ?.overtimeMinutes ??
                    0}{" "}
                  min
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">
                  Method
                </p>

                <p className="mt-2 text-xl font-bold text-slate-950">
                  {attendance?.method ??
                    "--"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-700">
                Notes
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {attendance?.notes ||
                  "No notes have been added for today's attendance."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}