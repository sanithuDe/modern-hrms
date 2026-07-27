"use client";

import axios from "axios";
import {
    ArrowLeft,
    Ban,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    CheckCircle2,
    Mail,
    Pencil,
    Phone,
    ShieldCheck,
    Trash2,
    UserRound,
    UserX,
} from "lucide-react";
import Link from "next/link";
import {
    useParams,
    useRouter,
} from "next/navigation";
import {
    useEffect,
    useState,
    type ReactNode,
} from "react";

import Header from "../../../../src/components/layout/header";
import Sidebar from "../../../../src/components/layout/sidebar";

import {
    deleteEmployee,
    getEmployeeById,
    updateEmployeeStatus,
    type Employee,
    type UserRole,
    type UserStatus,
} from "../../../../src/services/employee.service";

interface StoredUser {
  email: string;
  role: UserRole;
}

interface DetailCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function formatText(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getStatusClassName(
  status: UserStatus,
): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";

    case "SUSPENDED":
      return "bg-amber-100 text-amber-700";

    case "INACTIVE":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getModalIconClassName(
  status: UserStatus,
): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";

    case "SUSPENDED":
      return "bg-amber-100 text-amber-700";

    case "INACTIVE":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function EmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUpdatingStatus, setIsUpdatingStatus] =
    useState(false);

  const [pendingStatus, setPendingStatus] =
    useState<UserStatus | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [statusMessage, setStatusMessage] =
    useState("");

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken");

    const storedUser =
      localStorage.getItem("authUser");

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser) as StoredUser;

      setUser(parsedUser);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");

      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!user || !params.id) {
      return;
    }

    async function loadEmployee() {
      try {
        setIsLoading(true);
        setError("");
        setStatusMessage("");

        const employeeData =
          await getEmployeeById(params.id);

        setEmployee(employeeData);
      } catch (requestError: unknown) {
        if (axios.isAxiosError(requestError)) {
          const message =
            requestError.response?.data?.message;

          setError(
            typeof message === "string"
              ? message
              : "Unable to load employee details.",
          );
        } else {
          setError(
            "Unable to load employee details.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadEmployee();
  }, [params.id, user]);

  function openStatusConfirmation(
    newStatus: UserStatus,
  ) {
    setPendingStatus(newStatus);
    setError("");
    setStatusMessage("");
  }

  function closeStatusConfirmation() {
    if (isUpdatingStatus) {
      return;
    }

    setPendingStatus(null);
  }

  async function confirmStatusChange() {
    if (!employee || !pendingStatus) {
      return;
    }

    const employeeId = employee.id;
    const statusLabel =
      formatText(pendingStatus);

    try {
      setIsUpdatingStatus(true);
      setError("");
      setStatusMessage("");

      await updateEmployeeStatus(
        employeeId,
        pendingStatus,
      );

      const refreshedEmployee =
        await getEmployeeById(employeeId);

      setEmployee(refreshedEmployee);
      setPendingStatus(null);

      setStatusMessage(
        `Employee status changed to ${statusLabel}.`,
      );
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError)) {
        const message =
          requestError.response?.data?.message;

        setError(
          typeof message === "string"
            ? message
            : "Unable to update employee status.",
        );
      } else {
        setError(
          "Unable to update employee status.",
        );
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function openDeleteConfirmation() {
    setError("");
    setStatusMessage("");
    setIsDeleteModalOpen(true);
  }

  function closeDeleteConfirmation() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
  }

  async function confirmDeleteEmployee() {
    if (!employee) {
      return;
    }

    try {
      setIsDeleting(true);
      setError("");

      await deleteEmployee(employee.id);

      router.push("/dashboard/employees");
      router.refresh();
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError)) {
        const message =
          requestError.response?.data?.message;

        setError(
          typeof message === "string"
            ? message
            : "Unable to delete employee.",
        );
      } else {
        setError(
          "Unable to delete employee.",
        );
      }

      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Loading employee details...
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role={user.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          email={user.email}
          role={user.role}
        />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/dashboard/employees"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back to employees
            </Link>

            {isLoading && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
                Loading employee details...
              </div>
            )}

            {error && !isLoading && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {statusMessage && !isLoading && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-700">
                {statusMessage}
              </div>
            )}

            {employee &&
              employee.user &&
              !isLoading && (
                <>
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            <UserRound size={30} />
                          </div>

                          <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                              {employee.firstName}{" "}
                              {employee.lastName}
                            </h1>

                            <p className="mt-1 text-slate-600">
                              {employee.employeeNumber}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClassName(
                            employee.user.status,
                          )}`}
                        >
                          {formatText(
                            employee.user.status,
                          )}
                        </span>
                      </div>

                      {(user.role === "SUPER_ADMIN" ||
                        user.role ===
                          "HR_MANAGER") && (
                        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                          {employee.user.status !==
                            "ACTIVE" && (
                            <button
                              type="button"
                              disabled={
                                isUpdatingStatus
                              }
                              onClick={() =>
                                openStatusConfirmation(
                                  "ACTIVE",
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircle2
                                size={17}
                              />
                              Activate
                            </button>
                          )}

                          {employee.user.status !==
                            "SUSPENDED" && (
                            <button
                              type="button"
                              disabled={
                                isUpdatingStatus
                              }
                              onClick={() =>
                                openStatusConfirmation(
                                  "SUSPENDED",
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Ban size={17} />
                              Suspend
                            </button>
                          )}

                          {employee.user.status !==
                            "INACTIVE" && (
                            <button
                              type="button"
                              disabled={
                                isUpdatingStatus
                              }
                              onClick={() =>
                                openStatusConfirmation(
                                  "INACTIVE",
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <UserX size={17} />
                              Mark Inactive
                            </button>
                          )}

                          <Link
                            href={`/dashboard/employees/${employee.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
                          >
                            <Pencil size={17} />
                            Edit Employee
                          </Link>

                          {user.role ===
                            "SUPER_ADMIN" && (
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={
                                openDeleteConfirmation
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 size={17} />
                              Delete Employee
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <DetailCard
                      icon={<Mail size={20} />}
                      label="Email"
                      value={employee.user.email}
                    />

                    <DetailCard
                      icon={
                        <ShieldCheck size={20} />
                      }
                      label="Role"
                      value={formatText(
                        employee.user.role,
                      )}
                    />

                    <DetailCard
                      icon={<Phone size={20} />}
                      label="Phone"
                      value={
                        employee.phone ||
                        "Not provided"
                      }
                    />

                    <DetailCard
                      icon={
                        <CalendarDays size={20} />
                      }
                      label="Hire date"
                      value={formatDate(
                        employee.hireDate,
                      )}
                    />

                    <DetailCard
                      icon={<Building2 size={20} />}
                      label="Department"
                      value={
                        employee.department?.name ??
                        "Not assigned"
                      }
                    />

                    <DetailCard
                      icon={
                        <BriefcaseBusiness
                          size={20}
                        />
                      }
                      label="Position"
                      value={
                        employee.position?.title ??
                        "Not assigned"
                      }
                    />

                    <DetailCard
                      icon={
                        <CalendarDays size={20} />
                      }
                      label="Created date"
                      value={formatDate(
                        employee.createdAt,
                      )}
                    />

                    <DetailCard
                      icon={<UserRound size={20} />}
                      label="Employee number"
                      value={
                        employee.employeeNumber
                      }
                    />
                  </div>
                </>
              )}
          </div>
        </main>
      </div>

      {pendingStatus &&
        employee &&
        employee.user && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={
              closeStatusConfirmation
            }
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="status-confirmation-title"
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${getModalIconClassName(
                    pendingStatus,
                  )}`}
                >
                  {pendingStatus === "ACTIVE" ? (
                    <CheckCircle2 size={22} />
                  ) : pendingStatus ===
                    "SUSPENDED" ? (
                    <Ban size={22} />
                  ) : (
                    <UserX size={22} />
                  )}
                </div>

                <div>
                  <h2
                    id="status-confirmation-title"
                    className="text-xl font-bold text-slate-900"
                  >
                    Confirm status change
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Change{" "}
                    <span className="font-semibold text-slate-900">
                      {employee.firstName}{" "}
                      {employee.lastName}
                    </span>
                    &apos;s status to{" "}
                    <span className="font-semibold text-slate-900">
                      {formatText(
                        pendingStatus,
                      )}
                    </span>
                    ?
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={
                    closeStatusConfirmation
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() =>
                    void confirmStatusChange()
                  }
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingStatus
                    ? "Updating..."
                    : `Change to ${formatText(
                        pendingStatus,
                      )}`}
                </button>
              </div>
            </div>
          </div>
        )}

      {isDeleteModalOpen && employee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={
            closeDeleteConfirmation
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-employee-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                <Trash2 size={22} />
              </div>

              <div>
                <h2
                  id="delete-employee-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Delete employee
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Are you sure you want to
                  permanently delete{" "}
                  <span className="font-semibold text-slate-900">
                    {employee.firstName}{" "}
                    {employee.lastName}
                  </span>
                  ?
                </p>

                <p className="mt-2 text-sm font-medium text-red-600">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={
                  closeDeleteConfirmation
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  void confirmDeleteEmployee()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={17} />

                {isDeleting
                  ? "Deleting..."
                  : "Delete Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: DetailCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 break-words font-semibold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}