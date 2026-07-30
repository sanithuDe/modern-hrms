"use client";

import axios from "axios";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    type Attendance,
    checkIn,
    checkOut,
    getAllAttendance,
    getMyAttendance,
    getTodayAttendance,
} from "../../../src/services/attendance.service";

import {
    type ShiftAssignment,
    getMyShift,
} from "../../../src/services/shift.service";

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

function formatShiftTime(
  totalMinutes:
    | number
    | null
    | undefined,
): string {
  if (
    typeof totalMinutes !== "number" ||
    !Number.isFinite(totalMinutes)
  ) {
    return "--:--";
  }

  const normalized =
    ((totalMinutes % 1440) + 1440) %
    1440;

  const date = new Date();

  date.setHours(
    Math.floor(normalized / 60),
    normalized % 60,
    0,
    0,
  );

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

  const hours = Math.floor(
    minutes / 60,
  );

  const remaining =
    minutes % 60;

  return `${hours}h ${remaining}m`;
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

  const responseData =
    error.response.data;

  if (
    typeof responseData ===
      "object" &&
    responseData !== null &&
    "message" in responseData &&
    typeof responseData.message ===
      "string"
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

    case "GRACE_LATE":
      return {
        label: "Grace Late",
        className:
          "border-yellow-200 bg-yellow-50 text-yellow-700",
      };

    case "LATE":
      return {
        label: "Late",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "SHORT_LEAVE":
      return {
        label: "Short Leave",
        className:
          "border-cyan-200 bg-cyan-50 text-cyan-700",
      };

    case "EARLY_DEPARTURE":
      return {
        label: "Early Departure",
        className:
          "border-orange-200 bg-orange-50 text-orange-700",
      };

    case "HALF_DAY":
      return {
        label: "Half Day",
        className:
          "border-orange-200 bg-orange-50 text-orange-700",
      };

    case "FULL_DAY_LEAVE":
      return {
        label: "Full Day Leave",
        className:
          "border-red-200 bg-red-50 text-red-700",
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
      <circle
        cx="12"
        cy="12"
        r="9"
      />

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
  const router = useRouter();

  const [userRole, setUserRole] = useState<
    "SUPER_ADMIN" | "HR_MANAGER" | "EMPLOYEE" | null
  >(null);

  const isSuperAdmin =
    userRole === "SUPER_ADMIN";

  const isHrManager =
    userRole === "HR_MANAGER";

  const canSelfPunch =
    userRole === "EMPLOYEE";

  const canViewAllEmployees =
    isSuperAdmin || isHrManager;

  const [
    attendance,
    setAttendance,
  ] =
    useState<Attendance | null>(
      null,
    );

  const [
    shiftAssignment,
    setShiftAssignment,
  ] =
    useState<ShiftAssignment | null>(
      null,
    );

  const [historyRecords, setHistoryRecords] =
    useState<Attendance[]>([]);

  const [historySearch, setHistorySearch] =
    useState("");

  const [
    currentTime,
    setCurrentTime,
  ] =
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

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        "authUser",
      );

      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as {
        role?: string;
      };

      if (
        parsed.role === "SUPER_ADMIN" ||
        parsed.role === "HR_MANAGER" ||
        parsed.role === "EMPLOYEE"
      ) {
        setUserRole(parsed.role);
      }
    } catch {
      setUserRole(null);
    }
  }, []);

  const loadAttendance =
    useCallback(
      async (): Promise<void> => {
        try {
          setLoading(true);
          setError("");

          const historyPromise =
            canViewAllEmployees
              ? getAllAttendance({
                  limit: 80,
                })
              : getMyAttendance({
                  limit: 40,
                });

          const [
            attendanceResult,
            shiftResult,
            historyResult,
          ] = await Promise.allSettled([
            canSelfPunch
              ? getTodayAttendance()
              : Promise.resolve(null),
            canSelfPunch
              ? getMyShift()
              : Promise.resolve(null),
            historyPromise,
          ]);

          setAttendance(
            attendanceResult.status === "fulfilled"
              ? attendanceResult.value
              : null,
          );

          setShiftAssignment(
            shiftResult.status === "fulfilled"
              ? shiftResult.value
              : null,
          );

          setHistoryRecords(
            historyResult.status === "fulfilled"
              ? historyResult.value.records
              : [],
          );

          if (
            attendanceResult.status === "rejected" &&
            shiftResult.status === "rejected"
          ) {
            setError(
              getErrorMessage(
                attendanceResult.reason,
              ),
            );
          } else if (
            attendanceResult.status === "rejected"
          ) {
            setError(
              getErrorMessage(
                attendanceResult.reason,
              ),
            );
          } else if (
            historyResult.status === "rejected"
          ) {
            setError(
              getErrorMessage(
                historyResult.reason,
              ),
            );
          }
        } catch (requestError) {
          setAttendance(null);
          setShiftAssignment(null);
          setHistoryRecords([]);

          setError(
            getErrorMessage(
              requestError,
            ),
          );
        } finally {
          setLoading(false);
        }
      },
      [canViewAllEmployees, canSelfPunch],
    );

  useEffect(() => {
    if (
      userRole === "SUPER_ADMIN" ||
      userRole === "HR_MANAGER"
    ) {
      router.replace("/dashboard/attendance/manage");
      return;
    }

    if (userRole !== "EMPLOYEE") {
      return;
    }

    void loadAttendance();
  }, [loadAttendance, userRole, router]);

  useEffect(() => {
    if (userRole !== "EMPLOYEE") {
      return;
    }

    setCurrentTime(new Date());

    const timer =
      window.setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [userRole]);

  const filteredHistory = useMemo(() => {
    const keyword = historySearch.trim().toLowerCase();

    if (!keyword) {
      return historyRecords;
    }

    return historyRecords.filter((record) => {
      const name = `${record.employee?.firstName ?? ""} ${record.employee?.lastName ?? ""}`.toLowerCase();
      const number =
        record.employee?.employeeNumber?.toLowerCase() ??
        "";
      const status = record.status.toLowerCase();
      const date = formatDate(record.date).toLowerCase();

      return (
        name.includes(keyword) ||
        number.includes(keyword) ||
        status.includes(keyword) ||
        date.includes(keyword)
      );
    });
  }, [historyRecords, historySearch]);

  const activeShift =
    attendance?.shift ??
    shiftAssignment?.shift ??
    null;

  const hasCheckedIn =
    Boolean(attendance?.checkIn);

  const hasCheckedOut =
    Boolean(attendance?.checkOut);

  const isShiftOver = useMemo(() => {
    // Office-hours attendance does not hard-block punch when shift ends.
    // Keep helper for optional display only.
    if (!activeShift || !currentTime) {
      return false;
    }

    const scheduledEnd =
      attendance?.scheduledEnd;

    if (scheduledEnd) {
      return currentTime >= new Date(scheduledEnd);
    }

    const now = currentTime;
    let endMinutes =
      activeShift.endTimeMinutes;

    if (activeShift.crossesMidnight) {
      const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

      if (currentMinutes >= activeShift.startTimeMinutes) {
        return false;
      }

      return currentMinutes >= endMinutes;
    }

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    return currentMinutes >= endMinutes;
  }, [activeShift, attendance, currentTime]);

  // API uses global office settings — do not require an assigned shift.
  const canCheckIn =
    !hasCheckedIn &&
    actionLoading === null;

  const canCheckOut =
    hasCheckedIn &&
    !hasCheckedOut &&
    actionLoading === null;

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
          attendance.workingMinutes ??
          0
        );
      }

      const checkInTime =
        new Date(
          attendance.checkIn,
        ).getTime();

      if (
        Number.isNaN(
          checkInTime,
        )
      ) {
        return 0;
      }

      return Math.max(
        0,
        Math.floor(
          (currentTime.getTime() -
            checkInTime) /
            60_000,
        ),
      );
    }, [
      attendance,
      currentTime,
    ]);

  const targetMinutes =
    activeShift
      ?.requiredWorkMinutes ??
    480;

  const progress =
    targetMinutes > 0
      ? Math.min(
          100,
          Math.round(
            (liveWorkingMinutes /
              targetMinutes) *
              100,
          ),
        )
      : 0;

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

  const shiftStartTime =
    attendance?.scheduledStart
      ? formatTime(
          attendance.scheduledStart,
        )
      : activeShift
        ? formatShiftTime(
            activeShift.startTimeMinutes,
          )
        : "Office settings";

  const shiftEndTime =
    attendance?.scheduledEnd
      ? formatTime(
          attendance.scheduledEnd,
        )
      : activeShift
        ? formatShiftTime(
            activeShift.endTimeMinutes,
          )
        : "Office settings";

  async function handleCheckIn(): Promise<void> {
    if (!canCheckIn) {
      return;
    }

    try {
      setActionLoading("check-in");
      setError("");
      setMessage("");

      const result =
        await checkIn("WEB");

      setAttendance(result);

      setMessage(
        "You checked in successfully.",
      );

      // Refresh history so managers see today's row immediately.
      try {
        const history = canViewAllEmployees
          ? await getAllAttendance({ limit: 80 })
          : await getMyAttendance({ limit: 40 });
        setHistoryRecords(history.records);
      } catch {
        // Keep punch success even if history refresh fails.
      }
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCheckOut(): Promise<void> {
    if (!canCheckOut) {
      return;
    }

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

      try {
        const history = canViewAllEmployees
          ? await getAllAttendance({ limit: 80 })
          : await getMyAttendance({ limit: 40 });
        setHistoryRecords(history.records);
      } catch {
        // Keep punch success even if history refresh fails.
      }
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    } finally {
      setActionLoading(null);
    }
  }

  if (
    !userRole ||
    userRole === "SUPER_ADMIN" ||
    userRole === "HR_MANAGER" ||
    loading ||
    !currentTime
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-500">
            {userRole === "SUPER_ADMIN" ||
            userRole === "HR_MANAGER"
              ? "Opening employee attendance..."
              : "Loading attendance..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && canSelfPunch ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {canSelfPunch && !activeShift ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No personal shift is assigned. Check-in uses company office hours
          from attendance settings.
        </div>
      ) : null}

      {canSelfPunch && activeShift && isShiftOver && hasCheckedIn && hasCheckedOut ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          Your shift is complete for today. Check-in and check-out have been recorded.
        </div>
      ) : null}

      {canSelfPunch ? (
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

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Schedule
            </p>

            <p className="mt-2 text-lg font-bold text-slate-950">
              {activeShift?.name ??
                "Company office hours"}
            </p>

            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>
                Start:{" "}
                <span className="font-semibold text-slate-900">
                  {shiftStartTime}
                </span>
              </p>

              <p>
                End:{" "}
                <span className="font-semibold text-slate-900">
                  {shiftEndTime}
                </span>
              </p>

              <p>
                Grace:{" "}
                <span className="font-semibold text-slate-900">
                  {activeShift?.graceMinutes ??
                    "Settings"}{" "}
                  {typeof activeShift?.graceMinutes ===
                  "number"
                    ? "minutes"
                    : "(office settings)"}
                </span>
              </p>

              <p>
                Required time:{" "}
                <span className="font-semibold text-slate-900">
                  {formatMinutes(
                    targetMinutes,
                  )}
                </span>
              </p>

              {activeShift
                ?.crossesMidnight ? (
                <p className="font-medium text-indigo-700">
                  Ends on the next day
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() =>
                void handleCheckIn()
              }
              disabled={!canCheckIn}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#11152b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b2140] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <LoginIcon />

              {actionLoading === "check-in"
                ? "Checking in..."
                : hasCheckedIn
                  ? "Already Checked In"
                  : "Check In"}
            </button>

            <button
              type="button"
              onClick={() =>
                void handleCheckOut()
              }
              disabled={!canCheckOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <LogoutIcon />

              {actionLoading === "check-out"
                ? "Checking out..."
                : hasCheckedOut
                  ? "Already Checked Out"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">
                    Daily Work Progress
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Based on company office hours
                    (8h default if no shift)
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

              <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span>
                  Worked:{" "}
                  {formatMinutes(
                    liveWorkingMinutes,
                  )}
                </span>

                <span>
                  Target:{" "}
                  {formatMinutes(
                    targetMinutes,
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  Short Leave
                </p>

                <p className="mt-2 text-xl font-bold text-slate-950">
                  {attendance
                    ?.shortLeaveMinutes ??
                    0}{" "}
                  min
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">
                  Early Leave
                </p>

                <p className="mt-2 text-xl font-bold text-slate-950">
                  {attendance
                    ?.earlyLeaveMinutes ??
                    0}{" "}
                  min
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">
                  Leave Value
                </p>

                <p className="mt-2 text-xl font-bold text-slate-950">
                  {Number(
                    attendance
                      ?.leaveDayValue ??
                      0,
                  ).toFixed(1)}{" "}
                  day
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
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {canViewAllEmployees
                ? "Employee Attendance History"
                : "My Attendance History"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {canViewAllEmployees
                ? "Check-in and check-out times for all employees (view only)."
                : "Your past check-in and check-out times by date."}
            </p>
          </div>

          {canViewAllEmployees ? (
            <input
              type="search"
              value={historySearch}
              onChange={(event) =>
                setHistorySearch(event.target.value)
              }
              placeholder="Search employee or status"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 sm:w-72"
            />
          ) : null}
        </div>

        {filteredHistory.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            {loading
              ? "Loading attendance records..."
              : canViewAllEmployees
                ? "No employee attendance records found."
                : "No attendance history yet. Your check-in and check-out times will appear here."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  {canViewAllEmployees ? (
                    <th className="px-6 py-4">
                      Employee
                    </th>
                  ) : null}
                  <th className="px-6 py-4">
                    Date
                  </th>
                  <th className="px-6 py-4">
                    Check In
                  </th>
                  <th className="px-6 py-4">
                    Check Out
                  </th>
                  <th className="px-6 py-4">
                    Status
                  </th>
                  <th className="px-6 py-4">
                    Working
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((record) => {
                  const statusStyle =
                    getStatusStyle(record.status);

                  return (
                    <tr
                      key={record.id}
                      className="text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {canViewAllEmployees ? (
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {record.employee
                              ? `${record.employee.firstName} ${record.employee.lastName}`
                              : "Unknown employee"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {record.employee
                              ?.employeeNumber ?? "—"}
                          </p>
                        </td>
                      ) : null}
                      <td className="px-6 py-4 font-medium tabular-nums text-slate-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 text-base font-bold tabular-nums text-sky-700">
                        {formatTime(record.checkIn)}
                      </td>
                      <td className="px-6 py-4 text-base font-bold tabular-nums text-emerald-700">
                        {formatTime(record.checkOut)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle.className}`}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold tabular-nums text-slate-900">
                        {formatMinutes(
                          record.workingMinutes,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}