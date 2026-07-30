"use client";

import {
    Clock3,
    MonitorSmartphone,
    RotateCcw,
    Save,
    Settings2,
    ShieldCheck,
    Smartphone,
    TimerReset,
} from "lucide-react";

import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    getAttendanceSettings,
    resetAttendanceSettings,
    updateAttendanceSettings,
    type AttendanceSettings,
    type UpdateAttendanceSettingsInput,
} from "../../../src/services/settings.service";

interface StoredUser {
  email: string;
  role: string;
}

interface SettingsForm {
  officeStartTime: string;
  officeEndTime: string;

  gracePeriodMinutes: string;
  halfDayMinutes: string;
  fullDayMinutes: string;

  allowWebCheckIn: boolean;
  allowMobileCheckIn: boolean;
}

const initialForm: SettingsForm = {
  officeStartTime: "09:00",
  officeEndTime: "17:00",

  gracePeriodMinutes: "10",
  halfDayMinutes: "240",
  fullDayMinutes: "480",

  allowWebCheckIn: true,
  allowMobileCheckIn: true,
};

function getErrorMessage(
  error: unknown,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const responseError =
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

    const message =
      responseError.response?.data
        ?.message;

    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function settingsToForm(
  settings: AttendanceSettings,
): SettingsForm {
  return {
    officeStartTime:
      settings.officeStartTime,

    officeEndTime:
      settings.officeEndTime,

    gracePeriodMinutes:
      String(
        settings.gracePeriodMinutes,
      ),

    halfDayMinutes:
      String(
        settings.halfDayMinutes,
      ),

    fullDayMinutes:
      String(
        settings.fullDayMinutes,
      ),

    allowWebCheckIn:
      settings.allowWebCheckIn,

    allowMobileCheckIn:
      settings.allowMobileCheckIn,
  };
}

function formatMinutes(
  minutes: number,
): string {
  const hours =
    Math.floor(minutes / 60);

  const remainingMinutes =
    minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  }

  if (
    remainingMinutes === 0
  ) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    }`;
  }

  return `${hours} hour${
    hours === 1 ? "" : "s"
  } ${remainingMinutes} minutes`;
}

export default function SettingsPage() {
  const [user, setUser] =
    useState<StoredUser | null>(
      null,
    );

  const [form, setForm] =
    useState<SettingsForm>(
      initialForm,
    );

  const [
    currentSettings,
    setCurrentSettings,
  ] =
    useState<AttendanceSettings | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [resetting, setResetting] =
    useState(false);

  const [
    showResetConfirmation,
    setShowResetConfirmation,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN";

  async function loadSettings(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const settings =
        await getAttendanceSettings();

      setCurrentSettings(
        settings,
      );

      setForm(
        settingsToForm(
          settings,
        ),
      );
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedUser =
      window.localStorage.getItem(
        "authUser",
      );

    if (!storedUser) {
      setError(
        "User information was not found. Please log in again.",
      );

      setLoading(false);
      return;
    }

    try {
      const parsedUser =
        JSON.parse(
          storedUser,
        ) as StoredUser;

      setUser(parsedUser);

      if (
        parsedUser.role !==
        "SUPER_ADMIN"
      ) {
        setError(
          "Only Super Admin can access platform settings.",
        );

        setLoading(false);
        return;
      }

      void loadSettings();
    } catch {
      setError(
        "Stored user information is invalid. Please log in again.",
      );

      setLoading(false);
    }
  }, []);

  function updateForm<
    Key extends keyof SettingsForm,
  >(
    key: Key,
    value: SettingsForm[Key],
  ): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const input: UpdateAttendanceSettingsInput =
        {
          officeStartTime:
            form.officeStartTime,

          officeEndTime:
            form.officeEndTime,

          gracePeriodMinutes:
            Number(
              form.gracePeriodMinutes,
            ),

          halfDayMinutes:
            Number(
              form.halfDayMinutes,
            ),

          fullDayMinutes:
            Number(
              form.fullDayMinutes,
            ),

          allowWebCheckIn:
            form.allowWebCheckIn,

          allowMobileCheckIn:
            form.allowMobileCheckIn,
        };

      const updatedSettings =
        await updateAttendanceSettings(
          input,
        );

      setCurrentSettings(
        updatedSettings,
      );

      setForm(
        settingsToForm(
          updatedSettings,
        ),
      );

      setSuccess(
        "Attendance settings updated successfully.",
      );
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(): Promise<void> {
    try {
      setResetting(true);
      setError("");
      setSuccess("");

      const resetSettings =
        await resetAttendanceSettings();

      setCurrentSettings(
        resetSettings,
      );

      setForm(
        settingsToForm(
          resetSettings,
        ),
      );

      setShowResetConfirmation(
        false,
      );

      setSuccess(
        "Attendance settings reset to defaults.",
      );
    } catch (resetError) {
      setError(
        getErrorMessage(
          resetError,
        ),
      );
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-600">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h2 className="font-semibold">
          Access denied
        </h2>

        <p className="mt-2 text-sm">
          Only Super Admin can manage
          platform settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-blue-50 p-3 text-blue-700">
            <Clock3 size={22} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Office hours
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {form.officeStartTime} -{" "}
            {form.officeEndTime}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-amber-50 p-3 text-amber-700">
            <TimerReset size={22} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Grace period
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {form.gracePeriodMinutes}{" "}
            minutes
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-violet-50 p-3 text-violet-700">
            <MonitorSmartphone
              size={22}
            />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Web check-in
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {form.allowWebCheckIn
              ? "Enabled"
              : "Disabled"}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <Smartphone size={22} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Mobile check-in
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {form.allowMobileCheckIn
              ? "Enabled"
              : "Disabled"}
          </p>
        </article>
      </section>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <Settings2 size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Office schedule
              </h2>

              <p className="text-sm text-slate-500">
                Set the normal office
                working time.
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Office start time
              </label>

              <input
                type="time"
                required
                value={
                  form.officeStartTime
                }
                onChange={(event) =>
                  updateForm(
                    "officeStartTime",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              />

              <p className="mt-2 text-xs text-slate-500">
                Employees checking in
                after the grace period
                will be marked late.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Office end time
              </label>

              <input
                type="time"
                required
                value={
                  form.officeEndTime
                }
                onChange={(event) =>
                  updateForm(
                    "officeEndTime",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              />

              <p className="mt-2 text-xs text-slate-500">
                Work after this time is
                counted as overtime.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <Clock3 size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Attendance calculation
              </h2>

              <p className="text-sm text-slate-500">
                Configure late and
                working-time rules.
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Grace period
              </label>

              <input
                type="number"
                required
                min="0"
                max="240"
                value={
                  form.gracePeriodMinutes
                }
                onChange={(event) =>
                  updateForm(
                    "gracePeriodMinutes",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              />

              <p className="mt-2 text-xs text-slate-500">
                Minutes allowed after
                office start time.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Half-day minutes
              </label>

              <input
                type="number"
                required
                min="1"
                max="1440"
                value={
                  form.halfDayMinutes
                }
                onChange={(event) =>
                  updateForm(
                    "halfDayMinutes",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              />

              <p className="mt-2 text-xs text-slate-500">
                Current value:{" "}
                {formatMinutes(
                  Number(
                    form.halfDayMinutes,
                  ) || 0,
                )}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full-day minutes
              </label>

              <input
                type="number"
                required
                min="1"
                max="1440"
                value={
                  form.fullDayMinutes
                }
                onChange={(event) =>
                  updateForm(
                    "fullDayMinutes",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              />

              <p className="mt-2 text-xs text-slate-500">
                Current value:{" "}
                {formatMinutes(
                  Number(
                    form.fullDayMinutes,
                  ) || 0,
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Check-in permissions
              </h2>

              <p className="text-sm text-slate-500">
                Control which methods
                employees can use.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                  <MonitorSmartphone
                    size={20}
                  />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    Web check-in
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Allow employees to
                    check in from the web
                    application.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={
                  form.allowWebCheckIn
                }
                onChange={(event) =>
                  updateForm(
                    "allowWebCheckIn",
                    event.target.checked,
                  )
                }
                className="h-5 w-5 shrink-0"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  <Smartphone
                    size={20}
                  />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    Mobile check-in
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Allow employees to
                    check in from the
                    mobile application.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={
                  form.allowMobileCheckIn
                }
                onChange={(event) =>
                  updateForm(
                    "allowMobileCheckIn",
                    event.target.checked,
                  )
                }
                className="h-5 w-5 shrink-0"
              />
            </label>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">
              Save configuration
            </p>

            <p className="mt-1 text-sm text-slate-500">
              These settings immediately
              affect attendance check-in
              and check-out calculations.
            </p>

            {currentSettings ? (
              <p className="mt-2 text-xs text-slate-400">
                Last updated:{" "}
                {new Date(
                  currentSettings.updatedAt,
                ).toLocaleString()}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={
                saving ||
                resetting
              }
              onClick={() =>
                setShowResetConfirmation(
                  true,
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw size={17} />
              Reset Defaults
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                resetting
              }
              className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </section>
      </form>

      {showResetConfirmation ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <RotateCcw
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Reset attendance
                    settings?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This will restore the
                    default office hours,
                    grace period, working
                    minutes, and check-in
                    permissions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={resetting}
                onClick={() =>
                  setShowResetConfirmation(
                    false,
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={resetting}
                onClick={() =>
                  void handleReset()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
              >
                {resetting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw
                      size={17}
                    />
                    Reset Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}