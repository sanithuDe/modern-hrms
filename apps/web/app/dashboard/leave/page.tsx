"use client";

import axios from "axios";
import {
    CalendarDays,
    CheckCircle2,
    Pencil,
    Plus,
    Search,
    Settings2,
    TriangleAlert,
    Users,
    X,
    XCircle,
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
    DateField,
} from "../../../src/components/ui/DateTimeFields";
import { SelectField } from "../../../src/components/ui/SelectField";

import {
    cancelLeaveRequest,
    createLeaveBalance,
    createLeaveRequest,
    createLeaveType,
    getLeaveBalances,
    getLeaveRequests,
    getLeaveTypes,
    getMyLeaveBalances,
    getMyLeaveRequests,
    reviewLeaveRequest,
    updateLeaveBalance,
    updateLeaveType,
    type LeaveBalance,
    type LeaveRequest,
    type LeaveType,
} from "../../../src/services/leave.service";

interface StoredUser {
  email: string;
  role: string;
}

type LeaveTab =
  | "request"
  | "my-requests"
  | "balances"
  | "manage"
  | "leave-types"
  | "leave-balances";

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          message?: unknown;
          error?: unknown;
        }
      | undefined;

    if (typeof responseData?.message === "string") {
      return responseData.message;
    }

    if (typeof responseData?.error === "string") {
      return responseData.error;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function toNumber(
  value: string | number,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function getStatusClass(
  status: LeaveRequest["status"],
): string {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    case "CANCELLED":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getEmployeeName(
  employee: Employee,
): string {
  return `${employee.firstName} ${employee.lastName}`;
}

function getLeaveRequestEmployeeName(
  request: LeaveRequest,
): string {
  if (!request.employee) {
    return "Unknown employee";
  }

  return `${request.employee.firstName} ${request.employee.lastName}`;
}

function getLeaveRequestEmployeeNumber(
  request: LeaveRequest,
): string {
  return (
    request.employee?.employeeNumber ??
    "—"
  );
}

function getBalanceEmployeeName(
  balance: LeaveBalance,
): string {
  if (!balance.employee) {
    return "Unknown employee";
  }

  return `${balance.employee.firstName} ${balance.employee.lastName}`;
}

function getBalanceEmployeeNumber(
  balance: LeaveBalance,
): string {
  return (
    balance.employee?.employeeNumber ??
    "—"
  );
}

export default function LeavePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [leaveTypes, setLeaveTypes] =
    useState<LeaveType[]>([]);

  const [balances, setBalances] =
    useState<LeaveBalance[]>([]);

  const [requests, setRequests] =
    useState<LeaveRequest[]>([]);

  const [activeTab, setActiveTab] =
    useState<LeaveTab>("request");

  const [search, setSearch] =
    useState("");

  const [balanceSearch, setBalanceSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [leaveTypeId, setLeaveTypeId] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [typeName, setTypeName] =
    useState("");

  const [
    typeDescription,
    setTypeDescription,
  ] = useState("");

  const [
    typeDefaultDays,
    setTypeDefaultDays,
  ] = useState("");

  const [
    isCreatingType,
    setIsCreatingType,
  ] = useState(false);

  const [editingType, setEditingType] =
    useState<LeaveType | null>(null);

  const [
    editTypeName,
    setEditTypeName,
  ] = useState("");

  const [
    editTypeDescription,
    setEditTypeDescription,
  ] = useState("");

  const [
    editTypeDefaultDays,
    setEditTypeDefaultDays,
  ] = useState("");

  const [
    editTypeIsActive,
    setEditTypeIsActive,
  ] = useState(true);

  const [
    isUpdatingType,
    setIsUpdatingType,
  ] = useState(false);

  const [
    balanceEmployeeId,
    setBalanceEmployeeId,
  ] = useState("");

  const [
    balanceLeaveTypeId,
    setBalanceLeaveTypeId,
  ] = useState("");

  const [balanceYear, setBalanceYear] =
    useState(
      String(new Date().getFullYear()),
    );

  const [
    balanceAllocatedDays,
    setBalanceAllocatedDays,
  ] = useState("");

  const [
    isCreatingBalance,
    setIsCreatingBalance,
  ] = useState(false);

  const [
    editingBalance,
    setEditingBalance,
  ] = useState<LeaveBalance | null>(
    null,
  );

  const [
    editAllocatedDays,
    setEditAllocatedDays,
  ] = useState("");

  const [
    editUsedDays,
    setEditUsedDays,
  ] = useState("");

  const [
    isUpdatingBalance,
    setIsUpdatingBalance,
  ] = useState(false);

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN";

  const isManager =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_MANAGER";

  useEffect(() => {
    const accessToken =
      localStorage.getItem("accessToken");

    const storedUser =
      localStorage.getItem("authUser");

    if (!accessToken || !storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser) as StoredUser;

      setUser(parsedUser);

      if (
        parsedUser.role === "SUPER_ADMIN" ||
        parsedUser.role === "HR_MANAGER"
      ) {
        setActiveTab("manage");
      }

      void loadLeaveData(parsedUser.role);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");

      router.replace("/login");
    }
  }, [router]);

  async function loadLeaveData(
    role: string,
  ) {
    try {
      setIsLoading(true);
      setError("");

      if (role === "SUPER_ADMIN") {
        const [
          leaveTypeData,
          requestData,
          balanceData,
          employeeData,
        ] = await Promise.all([
          getLeaveTypes(false),
          getLeaveRequests(),
          getLeaveBalances(),
          getEmployees(),
        ]);

        setLeaveTypes(
          Array.isArray(leaveTypeData)
            ? leaveTypeData
            : [],
        );

        setRequests(
          Array.isArray(requestData)
            ? requestData
            : [],
        );

        setBalances(
          Array.isArray(balanceData)
            ? balanceData
            : [],
        );

        setEmployees(
          Array.isArray(employeeData)
            ? employeeData
            : [],
        );

        return;
      }

      if (role === "HR_MANAGER") {
        const [
          leaveTypeData,
          requestData,
          balanceData,
        ] = await Promise.all([
          getLeaveTypes(false),
          getLeaveRequests(),
          getLeaveBalances(),
        ]);

        setLeaveTypes(
          Array.isArray(leaveTypeData)
            ? leaveTypeData
            : [],
        );

        setRequests(
          Array.isArray(requestData)
            ? requestData
            : [],
        );

        setBalances(
          Array.isArray(balanceData)
            ? balanceData
            : [],
        );

        return;
      }

      const [
        leaveTypeData,
        requestData,
        balanceData,
      ] = await Promise.all([
        getLeaveTypes(true),
        getMyLeaveRequests(),
        getMyLeaveBalances(),
      ]);

      setLeaveTypes(
        Array.isArray(leaveTypeData)
          ? leaveTypeData
          : [],
      );

      setRequests(
        Array.isArray(requestData)
          ? requestData
          : [],
      );

      setBalances(
        Array.isArray(balanceData)
          ? balanceData
          : [],
      );
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load leave data.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRequests =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      if (!keyword) {
        return requests;
      }

      return requests.filter(
        (request) => {
          const employeeName =
            getLeaveRequestEmployeeName(
              request,
            ).toLowerCase();

          const employeeNumber =
            getLeaveRequestEmployeeNumber(
              request,
            ).toLowerCase();

          const leaveTypeName =
            request.leaveType?.name?.toLowerCase() ??
            "";

          return (
            employeeName.includes(keyword) ||
            employeeNumber.includes(keyword) ||
            leaveTypeName.includes(keyword) ||
            request.status
              .toLowerCase()
              .includes(keyword) ||
            request.reason
              .toLowerCase()
              .includes(keyword)
          );
        },
      );
    }, [requests, search]);

  const filteredBalances =
    useMemo(() => {
      const keyword =
        balanceSearch.trim().toLowerCase();

      if (!keyword) {
        return balances;
      }

      return balances.filter(
        (balance) => {
          const employeeName =
            getBalanceEmployeeName(
              balance,
            ).toLowerCase();

          const employeeNumber =
            getBalanceEmployeeNumber(
              balance,
            ).toLowerCase();

          const leaveTypeName =
            balance.leaveType?.name?.toLowerCase() ??
            "";

          return (
            employeeName.includes(keyword) ||
            employeeNumber.includes(keyword) ||
            leaveTypeName.includes(keyword) ||
            String(balance.year).includes(
              keyword,
            )
          );
        },
      );
    }, [balances, balanceSearch]);

  const activeLeaveTypes =
    useMemo(() => {
      return leaveTypes.filter(
        (leaveType) =>
          leaveType.isActive,
      );
    }, [leaveTypes]);

  const leaveTypeOptions = useMemo(() => {
    return activeLeaveTypes.map((leaveType) => {
      const balance = balances.find(
        (item) => item.leaveTypeId === leaveType.id,
      );
      const remaining = balance
        ? toNumber(balance.allocatedDays) - toNumber(balance.usedDays)
        : null;

      return {
        value: leaveType.id,
        label: leaveType.name,
        description:
          remaining === null
            ? leaveType.description || undefined
            : `${remaining} day${remaining === 1 ? "" : "s"} remaining`,
      };
    });
  }, [activeLeaveTypes, balances]);

  const availableEmployees =
    useMemo(() => {
      if (
        !balanceLeaveTypeId ||
        !balanceYear
      ) {
        return employees;
      }

      const existingEmployeeIds =
        new Set(
          balances
            .filter(
              (balance) =>
                balance.leaveTypeId ===
                  balanceLeaveTypeId &&
                balance.year ===
                  Number(balanceYear),
            )
            .map(
              (balance) =>
                balance.employeeId,
            ),
        );

      return employees.filter(
        (employee) =>
          !existingEmployeeIds.has(
            employee.id,
          ),
      );
    }, [
      employees,
      balances,
      balanceLeaveTypeId,
      balanceYear,
    ]);

  async function handleCreateLeaveType(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const defaultDays = Number(
      typeDefaultDays,
    );

    if (!typeName.trim()) {
      setError(
        "Leave type name is required.",
      );
      return;
    }

    if (
      !Number.isInteger(defaultDays) ||
      defaultDays < 0
    ) {
      setError(
        "Default days must be a valid whole number.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsCreatingType(true);

    try {
      const leaveType =
        await createLeaveType({
          name: typeName.trim(),
          description:
            typeDescription.trim() ||
            undefined,
          defaultDays,
          isActive: true,
        });

      setLeaveTypes((current) => [
        leaveType,
        ...current,
      ]);

      setTypeName("");
      setTypeDescription("");
      setTypeDefaultDays("");

      setSuccess(
        "Leave type created successfully.",
      );
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to create leave type.",
        ),
      );
    } finally {
      setIsCreatingType(false);
    }
  }

  function openLeaveTypeEditor(
    leaveType: LeaveType,
  ) {
    setError("");
    setSuccess("");

    setEditingType(leaveType);
    setEditTypeName(leaveType.name);

    setEditTypeDescription(
      leaveType.description ?? "",
    );

    setEditTypeDefaultDays(
      String(leaveType.defaultDays),
    );

    setEditTypeIsActive(
      leaveType.isActive,
    );
  }

  function closeLeaveTypeEditor() {
    if (isUpdatingType) {
      return;
    }

    setEditingType(null);
  }

  async function handleUpdateLeaveType(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingType) {
      return;
    }

    const defaultDays = Number(
      editTypeDefaultDays,
    );

    if (!editTypeName.trim()) {
      setError(
        "Leave type name is required.",
      );
      return;
    }

    if (
      !Number.isInteger(defaultDays) ||
      defaultDays < 0
    ) {
      setError(
        "Default days must be a valid whole number.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsUpdatingType(true);

    try {
      const updatedType =
        await updateLeaveType(
          editingType.id,
          {
            name:
              editTypeName.trim(),
            description:
              editTypeDescription.trim() ||
              null,
            defaultDays,
            isActive:
              editTypeIsActive,
          },
        );

      setLeaveTypes((current) =>
        current.map((leaveType) =>
          leaveType.id ===
          updatedType.id
            ? updatedType
            : leaveType,
        ),
      );

      setEditingType(null);

      setSuccess(
        "Leave type updated successfully.",
      );
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to update leave type.",
        ),
      );
    } finally {
      setIsUpdatingType(false);
    }
  }

  async function handleCreateLeaveBalance(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const year = Number(balanceYear);

    const allocatedDays = Number(
      balanceAllocatedDays,
    );

    if (
      !balanceEmployeeId ||
      !balanceLeaveTypeId
    ) {
      setError(
        "Select an employee and leave type.",
      );
      return;
    }

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      setError(
        "Enter a valid year.",
      );
      return;
    }

    if (
      !Number.isFinite(allocatedDays) ||
      allocatedDays < 0
    ) {
      setError(
        "Enter valid allocated days.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsCreatingBalance(true);

    try {
      const balance =
        await createLeaveBalance({
          employeeId:
            balanceEmployeeId,
          leaveTypeId:
            balanceLeaveTypeId,
          year,
          allocatedDays,
        });

      setBalances((current) => [
        balance,
        ...current,
      ]);

      setBalanceEmployeeId("");
      setBalanceLeaveTypeId("");
      setBalanceAllocatedDays("");

      setSuccess(
        "Leave balance assigned successfully.",
      );
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to assign leave balance.",
        ),
      );
    } finally {
      setIsCreatingBalance(false);
    }
  }

  function openBalanceEditor(
    balance: LeaveBalance,
  ) {
    setError("");
    setSuccess("");

    setEditingBalance(balance);

    setEditAllocatedDays(
      String(balance.allocatedDays),
    );

    setEditUsedDays(
      String(balance.usedDays),
    );
  }

  function closeBalanceEditor() {
    if (isUpdatingBalance) {
      return;
    }

    setEditingBalance(null);
  }

  async function handleUpdateLeaveBalance(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingBalance) {
      return;
    }

    const allocatedDays = Number(
      editAllocatedDays,
    );

    const usedDays = Number(
      editUsedDays,
    );

    if (
      !Number.isFinite(allocatedDays) ||
      allocatedDays < 0
    ) {
      setError(
        "Enter valid allocated days.",
      );
      return;
    }

    if (
      !Number.isFinite(usedDays) ||
      usedDays < 0
    ) {
      setError(
        "Enter valid used days.",
      );
      return;
    }

    if (usedDays > allocatedDays) {
      setError(
        "Used days cannot exceed allocated days.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsUpdatingBalance(true);

    try {
      const updatedBalance =
        await updateLeaveBalance(
          editingBalance.id,
          {
            allocatedDays,
            usedDays,
          },
        );

      setBalances((current) =>
        current.map((balance) =>
          balance.id ===
          updatedBalance.id
            ? updatedBalance
            : balance,
        ),
      );

      setEditingBalance(null);

      setSuccess(
        "Leave balance updated successfully.",
      );
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to update leave balance.",
        ),
      );
    } finally {
      setIsUpdatingBalance(false);
    }
  }

  async function handleSubmitRequest(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !leaveTypeId ||
      !startDate ||
      !endDate ||
      !reason.trim()
    ) {
      setError(
        "Complete all leave request fields.",
      );
      return;
    }

    if (
      new Date(endDate) <
      new Date(startDate)
    ) {
      setError(
        "End date cannot be before start date.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const leaveRequest =
        await createLeaveRequest({
          leaveTypeId,

          startDate: new Date(
            `${startDate}T00:00:00.000Z`,
          ).toISOString(),

          endDate: new Date(
            `${endDate}T00:00:00.000Z`,
          ).toISOString(),

          reason: reason.trim(),
        });

      setRequests((current) => [
        leaveRequest,
        ...current,
      ]);

      setLeaveTypeId("");
      setStartDate("");
      setEndDate("");
      setReason("");

      setSuccess(
        "Leave request submitted successfully.",
      );

      setActiveTab("my-requests");
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to submit leave request.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReview(
    requestId: string,
    decision:
      | "APPROVED"
      | "REJECTED",
  ) {
    const comment =
      window.prompt(
        decision === "APPROVED"
          ? "Approval comment (optional)"
          : "Rejection reason",
      ) ?? "";

    setError("");
    setSuccess("");
    setProcessingId(requestId);

    try {
      const updatedRequest =
        await reviewLeaveRequest(
          requestId,
          {
            decision,

            reviewComment:
              comment.trim() ||
              undefined,
          },
        );

      setRequests((current) =>
        current.map((request) =>
          request.id ===
          updatedRequest.id
            ? updatedRequest
            : request,
        ),
      );

      if (
        decision === "APPROVED"
      ) {
        const updatedBalances =
          await getLeaveBalances();

        setBalances(updatedBalances);
      }

      setSuccess(
        decision === "APPROVED"
          ? "Leave request approved."
          : "Leave request rejected.",
      );
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to review leave request.",
        ),
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCancel(
    requestId: string,
  ) {
    const confirmed =
      window.confirm(
        "Cancel this leave request?",
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setProcessingId(requestId);

    try {
      const updatedRequest =
        await cancelLeaveRequest(
          requestId,
        );

      setRequests((current) =>
        current.map((request) =>
          request.id ===
          updatedRequest.id
            ? updatedRequest
            : request,
        ),
      );

      setSuccess(
        "Leave request cancelled.",
      );
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to cancel leave request.",
        ),
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Loading leave module...
        </p>
      </main>
    );
  }

  return (
    <div className="space-y-6">
          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <TriangleAlert
                size={20}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2
                size={20}
                className="shrink-0"
              />

              <span>{success}</span>
            </div>
          )}

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Leave Requests
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {requests.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Pending
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-600">
                {
                  requests.filter(
                    (request) =>
                      request.status ===
                      "PENDING",
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Approved
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {
                  requests.filter(
                    (request) =>
                      request.status ===
                      "APPROVED",
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Leave Types
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {leaveTypes.length}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {!isManager && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "request",
                    )
                  }
                  className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                    activeTab === "request"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Request Leave
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "my-requests",
                    )
                  }
                  className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                    activeTab ===
                    "my-requests"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  My Requests
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "balances",
                    )
                  }
                  className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                    activeTab ===
                    "balances"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  My Balances
                </button>
              </>
            )}

            {isManager && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "manage",
                    )
                  }
                  className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                    activeTab === "manage"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Manage Requests
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "leave-balances",
                    )
                  }
                  className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                    activeTab ===
                    "leave-balances"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Leave Balances
                </button>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        "leave-types",
                      )
                    }
                    className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                      activeTab ===
                      "leave-types"
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    Leave Types
                  </button>
                )}
              </>
            )}
          </div>

          {isLoading && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Loading leave data...
            </div>
          )}

          {!isLoading &&
            activeTab === "request" &&
            !isManager && (
              <section className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <CalendarDays size={22} />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Request Leave
                    </h2>

                    <p className="text-sm text-slate-500">
                      Submit a new leave
                      request.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={
                    handleSubmitRequest
                  }
                  className="mt-6 space-y-5"
                >
                  <SelectField
                    label="Leave type"
                    required
                    value={leaveTypeId}
                    placeholder="Select leave type"
                    emptyMessage="No active leave types yet"
                    options={leaveTypeOptions}
                    onChange={setLeaveTypeId}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <DateField
                      label="Start date"
                      required
                      value={startDate}
                      onChange={setStartDate}
                    />

                    <DateField
                      label="End date"
                      required
                      value={endDate}
                      minDate={startDate || undefined}
                      onChange={setEndDate}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Reason
                      <span className="text-red-500"> *</span>
                    </label>

                    <textarea
                      required
                      rows={4}
                      value={reason}
                      placeholder="Briefly explain why you need leave..."
                      onChange={(event) =>
                        setReason(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60"
                  >
                    <Plus size={18} />

                    {isSubmitting
                      ? "Submitting..."
                      : "Submit Request"}
                  </button>
                </form>
              </section>
            )}

          {!isLoading &&
            activeTab === "balances" &&
            !isManager && (
              <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {balances.map(
                  (balance) => {
                    const allocated =
                      toNumber(
                        balance.allocatedDays,
                      );

                    const used = toNumber(
                      balance.usedDays,
                    );

                    const remaining =
                      allocated - used;

                    return (
                      <div
                        key={balance.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                      >
                        <h3 className="font-semibold text-slate-900">
                          {balance.leaveType
                            ?.name ??
                            "Unknown leave type"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Year{" "}
                          {balance.year}
                        </p>

                        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">
                              {allocated}
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-600">
                              Allocated
                            </p>
                          </div>

                          <div>
                            <p className="text-2xl font-bold text-sky-700">
                              {used}
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-600">
                              Used
                            </p>
                          </div>

                          <div>
                            <p className="text-2xl font-bold text-emerald-700">
                              {remaining}
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-600">
                              Remaining
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}

                {balances.length ===
                  0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
                    No leave balances
                    found.
                  </div>
                )}
              </section>
            )}

          {!isLoading &&
            activeTab ===
              "leave-types" &&
            isSuperAdmin && (
              <div className="mt-8 grid gap-8 xl:grid-cols-[380px_1fr]">
                <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Settings2
                      size={24}
                    />

                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Create Leave Type
                      </h2>

                      <p className="text-sm text-slate-500">
                        Add annual, medical,
                        casual, or other leave
                        types.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={
                      handleCreateLeaveType
                    }
                    className="mt-6"
                  >
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Name
                    </label>

                    <input
                      required
                      value={typeName}
                      onChange={(event) =>
                        setTypeName(
                          event.target
                            .value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                    />

                    <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                      Description
                    </label>

                    <textarea
                      rows={3}
                      value={
                        typeDescription
                      }
                      onChange={(event) =>
                        setTypeDescription(
                          event.target
                            .value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                    />

                    <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                      Default days
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={
                        typeDefaultDays
                      }
                      onChange={(event) =>
                        setTypeDefaultDays(
                          event.target
                            .value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                    />

                    <button
                      type="submit"
                      disabled={
                        isCreatingType
                      }
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <Plus size={18} />

                      {isCreatingType
                        ? "Creating..."
                        : "Create Leave Type"}
                    </button>
                  </form>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-4">
                            Name
                          </th>

                          <th className="px-6 py-4">
                            Default Days
                          </th>

                          <th className="px-6 py-4">
                            Status
                          </th>

                          <th className="px-6 py-4">
                            Balances
                          </th>

                          <th className="px-6 py-4">
                            Requests
                          </th>

                          <th className="px-6 py-4">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {leaveTypes.map(
                          (leaveType) => (
                            <tr
                              key={
                                leaveType.id
                              }
                              className="text-sm text-slate-700"
                            >
                              <td className="px-6 py-5">
                                <p className="font-semibold text-slate-900">
                                  {
                                    leaveType.name
                                  }
                                </p>

                                <p className="max-w-[250px] truncate text-xs text-slate-500">
                                  {leaveType.description ??
                                    "No description"}
                                </p>
                              </td>

                              <td className="px-6 py-5">
                                {
                                  leaveType.defaultDays
                                }
                              </td>

                              <td className="px-6 py-5">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    leaveType.isActive
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {leaveType.isActive
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </td>

                              <td className="px-6 py-5">
                                {leaveType
                                  ._count
                                  ?.leaveBalances ??
                                  0}
                              </td>

                              <td className="px-6 py-5">
                                {leaveType
                                  ._count
                                  ?.leaveRequests ??
                                  0}
                              </td>

                              <td className="px-6 py-5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openLeaveTypeEditor(
                                      leaveType,
                                    )
                                  }
                                  className="flex items-center gap-1 font-semibold text-blue-700"
                                >
                                  <Pencil
                                    size={
                                      16
                                    }
                                  />

                                  Edit
                                </button>
                              </td>
                            </tr>
                          ),
                        )}

                        {leaveTypes.length ===
                          0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-12 text-center text-slate-500"
                            >
                              No leave types
                              found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

          {!isLoading &&
            activeTab ===
              "leave-balances" &&
            isManager && (
              <div className="mt-8 grid gap-8 xl:grid-cols-[400px_1fr]">
                {isSuperAdmin && (
                  <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Users size={24} />

                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                          Assign Leave
                          Balance
                        </h2>

                        <p className="text-sm text-slate-500">
                          Allocate leave days
                          to an employee.
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={
                        handleCreateLeaveBalance
                      }
                      className="mt-6"
                    >
                      <SelectField
                        label="Leave type"
                        required
                        value={balanceLeaveTypeId}
                        placeholder="Select leave type"
                        options={activeLeaveTypes.map(
                          (leaveType) => ({
                            value: leaveType.id,
                            label: leaveType.name,
                          }),
                        )}
                        onChange={(value) => {
                          setBalanceLeaveTypeId(value);
                          setBalanceEmployeeId("");

                          const selectedType =
                            leaveTypes.find(
                              (leaveType) =>
                                leaveType.id === value,
                            );

                          if (selectedType) {
                            setBalanceAllocatedDays(
                              String(
                                selectedType.defaultDays,
                              ),
                            );
                          }
                        }}
                      />

                      <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                        Year
                      </label>

                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        required
                        value={balanceYear}
                        onChange={(event) => {
                          setBalanceYear(
                            event.target
                              .value,
                          );

                          setBalanceEmployeeId(
                            "",
                          );
                        }}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                      />

                      <SelectField
                        className="mt-5"
                        label="Employee"
                        required
                        value={balanceEmployeeId}
                        placeholder="Select employee"
                        options={availableEmployees.map(
                          (employee) => ({
                            value: employee.id,
                            label: `${getEmployeeName(employee)} (${employee.employeeNumber})`,
                          }),
                        )}
                        onChange={setBalanceEmployeeId}
                      />

                      <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                        Allocated days
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        required
                        value={
                          balanceAllocatedDays
                        }
                        onChange={(event) =>
                          setBalanceAllocatedDays(
                            event.target
                              .value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                      />

                      <button
                        type="submit"
                        disabled={
                          isCreatingBalance
                        }
                        className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isCreatingBalance
                          ? "Assigning..."
                          : "Assign Balance"}
                      </button>
                    </form>
                  </section>
                )}

                <section
                  className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
                    !isSuperAdmin
                      ? "xl:col-span-2"
                      : ""
                  }`}
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
                    <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-300 px-4 py-3">
                      <Search
                        size={18}
                        className="text-slate-400"
                      />

                      <input
                        value={balanceSearch}
                        onChange={(event) =>
                          setBalanceSearch(
                            event.target
                              .value,
                          )
                        }
                        placeholder="Search balances"
                        className="w-full text-sm text-black outline-none"
                      />
                    </div>

                    <p className="text-sm text-slate-500">
                      {
                        filteredBalances.length
                      }{" "}
                      balance(s)
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-4">
                            Employee
                          </th>

                          <th className="px-6 py-4">
                            Leave Type
                          </th>

                          <th className="px-6 py-4">
                            Year
                          </th>

                          <th className="px-6 py-4">
                            Allocated
                          </th>

                          <th className="px-6 py-4">
                            Used
                          </th>

                          <th className="px-6 py-4">
                            Remaining
                          </th>

                          <th className="px-6 py-4">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {filteredBalances.map(
                          (balance) => {
                            const allocated =
                              toNumber(
                                balance.allocatedDays,
                              );

                            const used =
                              toNumber(
                                balance.usedDays,
                              );

                            return (
                              <tr
                                key={
                                  balance.id
                                }
                                className="text-sm text-slate-700"
                              >
                                <td className="px-6 py-5">
                                  <p className="font-semibold text-slate-900">
                                    {getBalanceEmployeeName(
                                      balance,
                                    )}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {getBalanceEmployeeNumber(
                                      balance,
                                    )}
                                  </p>
                                </td>

                                <td className="px-6 py-5">
                                  {balance
                                    .leaveType
                                    ?.name ??
                                    "Unknown"}
                                </td>

                                <td className="px-6 py-5">
                                  {
                                    balance.year
                                  }
                                </td>

                                <td className="px-6 py-5 text-base font-bold text-slate-900">
                                  {allocated}
                                </td>

                                <td className="px-6 py-5 text-base font-bold text-sky-700">
                                  {used}
                                </td>

                                <td className="px-6 py-5 text-base font-bold text-emerald-700">
                                  {allocated -
                                    used}
                                </td>

                                <td className="px-6 py-5">
                                  {isSuperAdmin ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openBalanceEditor(
                                          balance,
                                        )
                                      }
                                      className="flex items-center gap-1 font-semibold text-blue-700"
                                    >
                                      <Pencil
                                        size={
                                          16
                                        }
                                      />

                                      Edit
                                    </button>
                                  ) : (
                                    <span className="text-slate-500">
                                      View only
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          },
                        )}

                        {filteredBalances.length ===
                          0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-12 text-center text-slate-500"
                            >
                              No leave balances
                              found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

          {!isLoading &&
            (activeTab ===
              "my-requests" ||
              activeTab ===
                "manage") && (
              <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-300 px-4 py-3">
                    <Search
                      size={18}
                      className="text-slate-400"
                    />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Search requests"
                      className="w-full text-sm text-black outline-none"
                    />
                  </div>

                  <p className="text-sm text-slate-500">
                    {
                      filteredRequests.length
                    }{" "}
                    request(s)
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        {isManager && (
                          <th className="px-6 py-4">
                            Employee
                          </th>
                        )}

                        <th className="px-6 py-4">
                          Leave Type
                        </th>

                        <th className="px-6 py-4">
                          Dates
                        </th>

                        <th className="px-6 py-4">
                          Days
                        </th>

                        <th className="px-6 py-4">
                          Reason
                        </th>

                        <th className="px-6 py-4">
                          Status
                        </th>

                        <th className="px-6 py-4">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {filteredRequests.map(
                        (request) => (
                          <tr
                            key={request.id}
                            className="text-sm text-slate-700"
                          >
                            {isManager && (
                              <td className="px-6 py-5">
                                <p className="font-semibold text-slate-900">
                                  {getLeaveRequestEmployeeName(
                                    request,
                                  )}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {getLeaveRequestEmployeeNumber(
                                    request,
                                  )}
                                </p>
                              </td>
                            )}

                            <td className="px-6 py-5">
                              {request
                                .leaveType
                                ?.name ??
                                "Unknown leave type"}
                            </td>

                            <td className="px-6 py-5">
                              <p>
                                {formatDate(
                                  request.startDate,
                                )}
                              </p>

                              <p className="text-xs text-slate-500">
                                to{" "}
                                {formatDate(
                                  request.endDate,
                                )}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              {toNumber(
                                request.totalDays,
                              )}
                            </td>

                            <td className="max-w-[250px] px-6 py-5">
                              <p className="truncate">
                                {
                                  request.reason
                                }
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                  request.status,
                                )}`}
                              >
                                {
                                  request.status
                                }
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              {isManager &&
                                request.status ===
                                  "PENDING" && (
                                  <div className="flex gap-3">
                                    <button
                                      type="button"
                                      disabled={
                                        processingId ===
                                        request.id
                                      }
                                      onClick={() =>
                                        void handleReview(
                                          request.id,
                                          "APPROVED",
                                        )
                                      }
                                      className="flex items-center gap-1 font-semibold text-emerald-700 disabled:opacity-50"
                                    >
                                      <CheckCircle2
                                        size={
                                          16
                                        }
                                      />

                                      Approve
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        processingId ===
                                        request.id
                                      }
                                      onClick={() =>
                                        void handleReview(
                                          request.id,
                                          "REJECTED",
                                        )
                                      }
                                      className="flex items-center gap-1 font-semibold text-red-700 disabled:opacity-50"
                                    >
                                      <XCircle
                                        size={
                                          16
                                        }
                                      />

                                      Reject
                                    </button>
                                  </div>
                                )}

                              {!isManager &&
                                request.status ===
                                  "PENDING" && (
                                  <button
                                    type="button"
                                    disabled={
                                      processingId ===
                                      request.id
                                    }
                                    onClick={() =>
                                      void handleCancel(
                                        request.id,
                                      )
                                    }
                                    className="font-semibold text-red-700 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                )}

                              {request.status !==
                                "PENDING" && (
                                <span className="text-slate-500">
                                  No action
                                </span>
                              )}
                            </td>
                          </tr>
                        ),
                      )}

                      {filteredRequests.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan={
                              isManager
                                ? 7
                                : 6
                            }
                            className="px-6 py-12 text-center text-slate-500"
                          >
                            No leave requests
                            found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Leave Type
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update leave type
                  settings.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeLeaveTypeEditor
                }
                disabled={
                  isUpdatingType
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleUpdateLeaveType
              }
              className="mt-6"
            >
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Name
              </label>

              <input
                required
                value={editTypeName}
                onChange={(event) =>
                  setEditTypeName(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
              />

              <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                rows={3}
                value={
                  editTypeDescription
                }
                onChange={(event) =>
                  setEditTypeDescription(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
              />

              <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                Default days
              </label>

              <input
                type="number"
                min="0"
                step="1"
                required
                value={
                  editTypeDefaultDays
                }
                onChange={(event) =>
                  setEditTypeDefaultDays(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
              />

              <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={
                    editTypeIsActive
                  }
                  onChange={(event) =>
                    setEditTypeIsActive(
                      event.target
                        .checked,
                    )
                  }
                  className="h-4 w-4"
                />

                Active leave type
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    closeLeaveTypeEditor
                  }
                  disabled={
                    isUpdatingType
                  }
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isUpdatingType
                  }
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isUpdatingType
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Leave Balance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {getBalanceEmployeeName(
                    editingBalance,
                  )}{" "}
                  —{" "}
                  {editingBalance
                    .leaveType?.name ??
                    "Unknown leave type"}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeBalanceEditor
                }
                disabled={
                  isUpdatingBalance
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleUpdateLeaveBalance
              }
              className="mt-6"
            >
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Allocated days
              </label>

              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={
                  editAllocatedDays
                }
                onChange={(event) =>
                  setEditAllocatedDays(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
              />

              <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                Used days
              </label>

              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={editUsedDays}
                onChange={(event) =>
                  setEditUsedDays(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    closeBalanceEditor
                  }
                  disabled={
                    isUpdatingBalance
                  }
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isUpdatingBalance
                  }
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isUpdatingBalance
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}