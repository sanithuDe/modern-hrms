"use client";

import axios from "axios";
import {
    CalendarClock,
    CheckCircle2,
    Clock3,
    Moon,
    Pencil,
    Search,
    Sun,
    Trash2,
    TriangleAlert,
    Users,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    getEmployees,
    type Employee,
} from "../../../src/services/employee.service";

import {
    assignShift,
    deleteShiftAssignment,
    getShiftAssignments,
    getShifts,
    updateShiftAssignment,
    type Shift,
    type ShiftAssignment,
} from "../../../src/services/shift.service";

interface StoredUser {
  email: string;
  role: string;
}

interface AssignmentForm {
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
}

const initialForm: AssignmentForm = {
  employeeId: "",
  shiftId: "",
  effectiveFrom: getTodayDateInput(),
  effectiveTo: "",
  isActive: true,
};

function getTodayDateInput(): string {
  const now = new Date();

  const localDate = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60_000,
  );

  return localDate
    .toISOString()
    .slice(0, 10);
}

function dateInputToIso(
  value: string,
): string {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0,
  );

  return date.toISOString();
}

function formatMinutesAsTime(
  totalMinutes: number,
): string {
  const normalized =
    ((totalMinutes % 1440) + 1440) %
    1440;

  const hours =
    Math.floor(normalized / 60);

  const minutes =
    normalized % 60;

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0,
  );

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "No end date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDateInput(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000,
  );

  return localDate
    .toISOString()
    .slice(0, 10);
}

function getEmployeeName(
  employee: Pick<
    Employee,
    "firstName" | "lastName"
  >,
): string {
  return `${employee.firstName} ${employee.lastName}`;
}

function getAssignmentEmployeeName(
  assignment: ShiftAssignment,
): string {
  return `${assignment.employee.firstName} ${assignment.employee.lastName}`;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: unknown;
          error?: unknown;
        }
      | undefined;

    if (
      typeof data?.message === "string"
    ) {
      return data.message;
    }

    if (
      typeof data?.error === "string"
    ) {
      return data.error;
    }

    if (!error.response) {
      return "Cannot connect to the API.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getShiftIcon(
  shift: Shift,
) {
  if (
    shift.crossesMidnight ||
    shift.code.toUpperCase().includes(
      "NIGHT",
    )
  ) {
    return (
      <Moon className="h-5 w-5" />
    );
  }

  return (
    <Sun className="h-5 w-5" />
  );
}

export default function ShiftAssignmentsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [shifts, setShifts] =
    useState<Shift[]>([]);

  const [
    assignments,
    setAssignments,
  ] = useState<ShiftAssignment[]>([]);

  const [form, setForm] =
    useState<AssignmentForm>(
      initialForm,
    );

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [
    assignmentToDelete,
    setAssignmentToDelete,
  ] = useState<ShiftAssignment | null>(
    null,
  );

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    const token =
      window.localStorage.getItem(
        "accessToken",
      );

    const storedUser =
      window.localStorage.getItem(
        "authUser",
      );

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser =
        JSON.parse(
          storedUser,
        ) as StoredUser;

      if (
        parsedUser.role !==
          "HR_MANAGER" &&
        parsedUser.role !==
          "SUPER_ADMIN"
      ) {
        router.replace("/dashboard");
        return;
      }

      setUser(parsedUser);
    } catch {
      window.localStorage.removeItem(
        "accessToken",
      );

      window.localStorage.removeItem(
        "authUser",
      );

      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadPageData();
  }, [user]);

  async function loadPageData(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const [
        employeeData,
        shiftData,
        assignmentData,
      ] = await Promise.all([
        getEmployees(),
        getShifts(),
        getShiftAssignments(),
      ]);

      setEmployees(employeeData);

      setShifts(
        shiftData.filter(
          (shift) => shift.isActive,
        ),
      );

      setAssignments(
        assignmentData,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load shift assignment data.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const selectableEmployees =
    useMemo(() => {
      return employees.filter(
        (employee) => {
          const status =
            employee.user?.status;

          return (
            !status ||
            status === "ACTIVE"
          );
        },
      );
    }, [employees]);

  const filteredAssignments =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return assignments;
      }

      return assignments.filter(
        (assignment) => {
          const employeeName =
            getAssignmentEmployeeName(
              assignment,
            ).toLowerCase();

          const employeeNumber =
            assignment.employee
              .employeeNumber
              .toLowerCase();

          const shiftName =
            assignment.shift.name
              .toLowerCase();

          const shiftCode =
            assignment.shift.code
              .toLowerCase();

          const department =
            assignment.employee
              .department?.name
              .toLowerCase() ?? "";

          return (
            employeeName.includes(
              keyword,
            ) ||
            employeeNumber.includes(
              keyword,
            ) ||
            shiftName.includes(keyword) ||
            shiftCode.includes(keyword) ||
            department.includes(keyword)
          );
        },
      );
    }, [assignments, search]);

  const activeAssignmentCount =
    assignments.filter(
      (assignment) =>
        assignment.isActive,
    ).length;

  const formShifts = useMemo(() => {
    if (!editingId) {
      return shifts;
    }

    const editingAssignment =
      assignments.find(
        (assignment) =>
          assignment.id === editingId,
      );

    if (
      !editingAssignment ||
      shifts.some(
        (shift) =>
          shift.id ===
          editingAssignment.shiftId,
      )
    ) {
      return shifts;
    }

    return [
      editingAssignment.shift,
      ...shifts,
    ];
  }, [assignments, editingId, shifts]);

  const editingAssignment =
    editingId
      ? assignments.find(
          (assignment) =>
            assignment.id === editingId,
        ) ?? null
      : null;

  function updateForm(
    field: keyof AssignmentForm,
    value: string | boolean,
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit(
    assignment: ShiftAssignment,
  ): void {
    setEditingId(assignment.id);
    setError("");
    setSuccess("");
    setForm({
      employeeId: assignment.employeeId,
      shiftId: assignment.shiftId,
      effectiveFrom:
        toDateInput(
          assignment.effectiveFrom,
        ) || getTodayDateInput(),
      effectiveTo: toDateInput(
        assignment.effectiveTo,
      ),
      isActive: assignment.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit(): void {
    setEditingId(null);
    setForm({
      ...initialForm,
      effectiveFrom: getTodayDateInput(),
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!editingId && !form.employeeId) {
      setError(
        "Please select an employee.",
      );
      return;
    }

    if (!form.shiftId) {
      setError(
        "Please select a shift.",
      );
      return;
    }

    if (!form.effectiveFrom) {
      setError(
        "Please select an effective start date.",
      );
      return;
    }

    if (
      form.effectiveTo &&
      form.effectiveTo <
        form.effectiveFrom
    ) {
      setError(
        "The end date cannot be before the start date.",
      );
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        const updated =
          await updateShiftAssignment(
            editingId,
            {
              shiftId: form.shiftId,
              effectiveFrom:
                dateInputToIso(
                  form.effectiveFrom,
                ),
              effectiveTo:
                form.effectiveTo
                  ? dateInputToIso(
                      form.effectiveTo,
                    )
                  : null,
              isActive: form.isActive,
            },
          );

        setAssignments((current) =>
          current.map((assignment) =>
            assignment.id === updated.id
              ? updated
              : assignment,
          ),
        );

        setSuccess(
          `Shift assignment updated for ${getAssignmentEmployeeName(updated)}.`,
        );

        cancelEdit();
      } else {
        const createdAssignment =
          await assignShift({
            employeeId:
              form.employeeId,

            shiftId: form.shiftId,

            effectiveFrom:
              dateInputToIso(
                form.effectiveFrom,
              ),

            effectiveTo:
              form.effectiveTo
                ? dateInputToIso(
                    form.effectiveTo,
                  )
                : null,
          });

        setAssignments((current) => [
          createdAssignment,
          ...current.map(
            (assignment) =>
              assignment.employeeId ===
              createdAssignment.employeeId
                ? {
                    ...assignment,
                    isActive: false,
                  }
                : assignment,
          ),
        ]);

        const selectedEmployee =
          employees.find(
            (employee) =>
              employee.id ===
              form.employeeId,
          );

        const selectedShift =
          shifts.find(
            (shift) =>
              shift.id === form.shiftId,
          );

        setSuccess(
          `${selectedShift?.name ?? "Shift"} assigned to ${
            selectedEmployee
              ? getEmployeeName(
                  selectedEmployee,
                )
              : "employee"
          } successfully.`,
        );

        setForm({
          ...initialForm,
          effectiveFrom:
            getTodayDateInput(),
        });
      }
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          editingId
            ? "Unable to update the shift assignment."
            : "Unable to assign the shift.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteAssignment(): Promise<void> {
    if (!assignmentToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteShiftAssignment(
        assignmentToDelete.id,
      );

      setAssignments((current) =>
        current.filter(
          (assignment) =>
            assignment.id !==
            assignmentToDelete.id,
        ),
      );

      if (
        editingId ===
        assignmentToDelete.id
      ) {
        cancelEdit();
      }

      setSuccess(
        `Removed ${assignmentToDelete.shift.name} for ${getAssignmentEmployeeName(assignmentToDelete)}.`,
      );

      setAssignmentToDelete(null);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to delete the shift assignment.",
        ),
      );
      setAssignmentToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (!user || loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-500">
            Loading shift assignments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">
          Shift Assignments
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Assign Day Shift or Night
          Shift to employees.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Employees
              </p>

              <p className="text-2xl font-bold text-slate-950">
                {selectableEmployees.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Available Shifts
              </p>

              <p className="text-2xl font-bold text-slate-950">
                {shifts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <CalendarClock className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Active Assignments
              </p>

              <p className="text-2xl font-bold text-slate-950">
                {activeAssignmentCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {editingId
                  ? "Modify Assignment"
                  : "Assign a Shift"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingId
                  ? "Update the shift, dates, or status for this employee."
                  : "A new assignment will close the employee's previous active assignment."}
              </p>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cancel edit"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <form
            onSubmit={(event) =>
              void handleSubmit(event)
            }
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="employeeId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Employee
              </label>

              {editingId ? (
                <input
                  id="employeeId"
                  type="text"
                  readOnly
                  value={
                    editingAssignment
                      ? `${editingAssignment.employee.employeeNumber} - ${getAssignmentEmployeeName(editingAssignment)}`
                      : "Employee"
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-3 text-sm text-slate-900 outline-none"
                />
              ) : (
                <select
                  id="employeeId"
                  value={form.employeeId}
                  onChange={(event) =>
                    updateForm(
                      "employeeId",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                >
                  <option value="">
                    Select employee
                  </option>

                  {selectableEmployees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.employeeNumber}{" "}
                        -{" "}
                        {getEmployeeName(
                          employee,
                        )}
                      </option>
                    ),
                  )}
                </select>
              )}
            </div>

            <div>
              <label
                htmlFor="shiftId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Shift
              </label>

              <select
                id="shiftId"
                value={form.shiftId}
                onChange={(event) =>
                  updateForm(
                    "shiftId",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              >
                <option value="">
                  Select Day or Night
                  Shift
                </option>

                {formShifts.map((shift) => (
                  <option
                    key={shift.id}
                    value={shift.id}
                  >
                    {shift.name} (
                    {formatMinutesAsTime(
                      shift.startTimeMinutes,
                    )}{" "}
                    -{" "}
                    {formatMinutesAsTime(
                      shift.endTimeMinutes,
                    )}
                    {shift.crossesMidnight
                      ? ", next day"
                      : ""}
                    )
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="effectiveFrom"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Effective From
              </label>

              <input
                id="effectiveFrom"
                type="date"
                value={form.effectiveFrom}
                onChange={(event) =>
                  updateForm(
                    "effectiveFrom",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="effectiveTo"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Effective To
                <span className="ml-1 font-normal text-slate-400">
                  Optional
                </span>
              </label>

              <input
                id="effectiveTo"
                type="date"
                min={form.effectiveFrom}
                value={form.effectiveTo}
                onChange={(event) =>
                  updateForm(
                    "effectiveTo",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              />
            </div>

            {editingId ? (
              <div>
                <label
                  htmlFor="isActive"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Status
                </label>

                <select
                  id="isActive"
                  value={
                    form.isActive
                      ? "ACTIVE"
                      : "ENDED"
                  }
                  onChange={(event) =>
                    updateForm(
                      "isActive",
                      event.target
                        .value ===
                        "ACTIVE",
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                >
                  <option value="ACTIVE">
                    Active
                  </option>
                  <option value="ENDED">
                    Ended
                  </option>
                </select>
              </div>
            ) : null}

            <div className="flex gap-3">
              {editingId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              ) : null}

              <button
                type="submit"
                disabled={
                  submitting ||
                  shifts.length === 0 ||
                  (!editingId &&
                    selectableEmployees.length ===
                      0)
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#11152b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d2342] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarClock className="h-5 w-5" />

                {submitting
                  ? editingId
                    ? "Saving..."
                    : "Assigning Shift..."
                  : editingId
                    ? "Save Changes"
                    : "Assign Shift"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Employee Assignments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current and previous shift
                assignments.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search assignments"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-900"
              />
            </div>
          </div>

          {filteredAssignments.length ===
          0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <CalendarClock className="h-10 w-10 text-slate-300" />

              <p className="mt-4 font-semibold text-slate-700">
                No shift assignments
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Assign a Day Shift or Night
                Shift using the form.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Employee
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Shift
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Schedule
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Effective period
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map(
                    (assignment) => (
                      <tr
                        key={assignment.id}
                        className={`hover:bg-slate-50 ${
                          editingId ===
                          assignment.id
                            ? "bg-slate-50"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {getAssignmentEmployeeName(
                              assignment,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              assignment
                                .employee
                                .employeeNumber
                            }
                            {assignment.employee
                              .department
                              ? ` • ${assignment.employee.department.name}`
                              : ""}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">
                              {getShiftIcon(
                                assignment.shift,
                              )}
                            </span>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {
                                  assignment
                                    .shift.name
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                {
                                  assignment
                                    .shift.code
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatMinutesAsTime(
                            assignment.shift
                              .startTimeMinutes,
                          )}{" "}
                          -{" "}
                          {formatMinutesAsTime(
                            assignment.shift
                              .endTimeMinutes,
                          )}

                          {assignment.shift
                            .crossesMidnight ? (
                            <p className="mt-1 text-xs font-medium text-indigo-600">
                              Ends next day
                            </p>
                          ) : null}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          <p>
                            {formatDate(
                              assignment.effectiveFrom,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            To:{" "}
                            {formatDate(
                              assignment.effectiveTo,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              assignment.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {assignment.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                startEdit(
                                  assignment,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Modify
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setError(
                                  "",
                                );
                                setAssignmentToDelete(
                                  assignment,
                                );
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {assignmentToDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-assignment-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>

              <div>
                <h3
                  id="delete-assignment-title"
                  className="text-lg font-bold text-slate-950"
                >
                  Delete assignment
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Remove{" "}
                  <span className="font-semibold text-slate-900">
                    {assignmentToDelete.shift.name}
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold text-slate-900">
                    {getAssignmentEmployeeName(
                      assignmentToDelete,
                    )}
                  </span>
                  ? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setAssignmentToDelete(
                    null,
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  void confirmDeleteAssignment()
                }
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}