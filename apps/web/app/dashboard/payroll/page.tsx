"use client";

import axios from "axios";

import {
  Banknote,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Search,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

// Sidebar is provided by the shared Shell layout

import {
  getEmployees,
  type Employee,
} from "../../../src/services/employee.service";

import {
  approvePayroll,
  generatePayroll,
  getMyPayrolls,
  getPayrolls,
  getSalaryProfiles,
  markPayrollPaid,
  type Payroll,
  type SalaryProfile,
} from "../../../src/services/payroll.service";

interface StoredUser {
  email: string;
  role:
    | "SUPER_ADMIN"
    | "HR_MANAGER"
    | "EMPLOYEE";
}

type PayrollTab =
  | "salary-profiles"
  | "generate"
  | "history";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getRequestErrorMessage(
  requestError: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError(requestError)) {
    const responseData =
      requestError.response?.data as
        | {
            message?: unknown;
            error?: unknown;
          }
        | undefined;

    if (
      typeof responseData?.message ===
      "string"
    ) {
      return responseData.message;
    }

    if (
      typeof responseData?.error ===
      "string"
    ) {
      return responseData.error;
    }
  }

  if (requestError instanceof Error) {
    return requestError.message;
  }

  return fallbackMessage;
}

function toNumber(
  value: string | number,
): number {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

function formatMoney(
  value: string | number,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(toNumber(value));
}

function getEmployeeName(
  employee: Payroll["employee"],
): string {
  if (!employee) {
    return "Unknown employee";
  }

  return `${employee.firstName} ${employee.lastName}`;
}

function getStatusClass(
  status: Payroll["status"],
): string {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-700";

    case "APPROVED":
      return "bg-blue-100 text-blue-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function PayrollPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [
    salaryProfiles,
    setSalaryProfiles,
  ] = useState<SalaryProfile[]>([]);

  const [payrolls, setPayrolls] =
    useState<Payroll[]>([]);

  const [activeTab, setActiveTab] =
    useState<PayrollTab>("history");

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    payrollEmployeeId,
    setPayrollEmployeeId,
  ] = useState("");

  const currentDate = new Date();

  const [payrollYear, setPayrollYear] =
    useState(
      String(currentDate.getFullYear()),
    );

  const [payrollMonth, setPayrollMonth] =
    useState(
      String(currentDate.getMonth() + 1),
    );

  const [
    additionalAllowance,
    setAdditionalAllowance,
  ] = useState("0");

  const [
    additionalDeduction,
    setAdditionalDeduction,
  ] = useState("0");

  const [
    isGeneratingPayroll,
    setIsGeneratingPayroll,
  ] = useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const isEmployee =
    user?.role === "EMPLOYEE";

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN";

  const canGeneratePayroll =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_MANAGER";

  useEffect(() => {
    const accessToken =
      localStorage.getItem(
        "accessToken",
      );

    const storedUser =
      localStorage.getItem("authUser");

    if (!accessToken || !storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser =
        JSON.parse(
          storedUser,
        ) as StoredUser;

      const allowedRoles = [
        "SUPER_ADMIN",
        "HR_MANAGER",
        "EMPLOYEE",
      ];

      if (
        !allowedRoles.includes(
          parsedUser.role,
        )
      ) {
        router.replace("/login");
        return;
      }

      setUser(parsedUser);

      if (
        parsedUser.role === "EMPLOYEE"
      ) {
        setActiveTab("history");
      }

      void loadPayrollData(
        parsedUser.role,
      );
    } catch {
      localStorage.removeItem(
        "accessToken",
      );

      localStorage.removeItem(
        "authUser",
      );

      router.replace("/login");
    }
  }, [router]);

  async function loadPayrollData(
    role: StoredUser["role"],
  ) {
    try {
      setIsLoading(true);
      setError("");

      if (role === "EMPLOYEE") {
        const payrollData =
          await getMyPayrolls();

        setEmployees([]);
        setSalaryProfiles([]);

        setPayrolls(
          Array.isArray(payrollData)
            ? payrollData
            : [],
        );

        return;
      }

      const [
        employeeData,
        salaryProfileData,
        payrollData,
      ] = await Promise.all([
        getEmployees(),
        getSalaryProfiles(),
        getPayrolls(),
      ]);

      setEmployees(
        Array.isArray(employeeData)
          ? employeeData
          : [],
      );

      setSalaryProfiles(
        Array.isArray(salaryProfileData)
          ? salaryProfileData
          : [],
      );

      setPayrolls(
        Array.isArray(payrollData)
          ? payrollData
          : [],
      );
    } catch (requestError: unknown) {
      console.error(requestError);

      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to load payroll data.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  const filteredSalaryProfiles =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      if (!keyword) {
        return salaryProfiles;
      }

      return salaryProfiles.filter(
        (profile) => {
          const employeeName =
            profile.employee
              ? `${profile.employee.firstName} ${profile.employee.lastName}`.toLowerCase()
              : "";

          const employeeNumber =
            profile.employee
              ?.employeeNumber
              .toLowerCase() ?? "";

          return (
            employeeName.includes(keyword) ||
            employeeNumber.includes(keyword)
          );
        },
      );
    }, [salaryProfiles, search]);

  const filteredPayrolls =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      if (!keyword) {
        return payrolls;
      }

      return payrolls.filter(
        (payroll) => {
          const employeeName =
            getEmployeeName(
              payroll.employee,
            ).toLowerCase();

          const employeeNumber =
            payroll.employee
              ?.employeeNumber
              .toLowerCase() ?? "";

          const monthName =
            monthNames[
              payroll.month - 1
            ]?.toLowerCase() ?? "";

          return (
            employeeName.includes(keyword) ||
            employeeNumber.includes(
              keyword,
            ) ||
            payroll.status
              .toLowerCase()
              .includes(keyword) ||
            monthName.includes(keyword) ||
            String(payroll.year).includes(
              keyword,
            )
          );
        },
      );
    }, [payrolls, search]);

  const selectedSalaryProfile =
    useMemo(() => {
      return salaryProfiles.find(
        (profile) =>
          profile.employeeId ===
          payrollEmployeeId,
      );
    }, [
      salaryProfiles,
      payrollEmployeeId,
    ]);

  const payrollPreview =
    useMemo(() => {
      if (!selectedSalaryProfile) {
        return {
          basicSalary: 0,
          allowances: 0,
          deductions: 0,
          grossSalary: 0,
          netSalary: 0,
        };
      }

      const basicSalary = toNumber(
        selectedSalaryProfile.basicSalary,
      );

      const allowances =
        toNumber(
          selectedSalaryProfile.fixedAllowance,
        ) +
        toNumber(additionalAllowance);

      const deductions =
        toNumber(
          selectedSalaryProfile.fixedDeduction,
        ) +
        toNumber(additionalDeduction);

      const grossSalary =
        basicSalary + allowances;

      return {
        basicSalary,
        allowances,
        deductions,
        grossSalary,
        netSalary:
          grossSalary - deductions,
      };
    }, [
      selectedSalaryProfile,
      additionalAllowance,
      additionalDeduction,
    ]);

  async function handleGeneratePayroll() {
    if (!canGeneratePayroll) {
      return;
    }

    if (!payrollEmployeeId) {
      setError(
        "Please select an employee.",
      );

      return;
    }

    const year = Number(payrollYear);
    const month = Number(payrollMonth);

    if (
      !Number.isInteger(year) ||
      year < 2000
    ) {
      setError(
        "Enter a valid payroll year.",
      );

      return;
    }

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      setError(
        "Select a valid payroll month.",
      );

      return;
    }

    if (payrollPreview.netSalary < 0) {
      setError(
        "Net salary cannot be negative.",
      );

      return;
    }

    try {
      setIsGeneratingPayroll(true);
      setError("");
      setSuccess("");

      const payroll =
        await generatePayroll({
          employeeId:
            payrollEmployeeId,
          year,
          month,
          additionalAllowance:
            toNumber(
              additionalAllowance,
            ),
          additionalDeduction:
            toNumber(
              additionalDeduction,
            ),
        });

      setPayrolls((current) => [
        payroll,
        ...current,
      ]);

      setPayrollEmployeeId("");
      setAdditionalAllowance("0");
      setAdditionalDeduction("0");

      setSuccess(
        "Payroll generated successfully.",
      );

      setActiveTab("history");
    } catch (requestError: unknown) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to generate payroll.",
        ),
      );
    } finally {
      setIsGeneratingPayroll(false);
    }
  }

  async function handleApprovePayroll(
    payrollId: string,
  ) {
    if (!isSuperAdmin) {
      return;
    }

    try {
      setProcessingId(payrollId);
      setError("");
      setSuccess("");

      const updatedPayroll =
        await approvePayroll(payrollId);

      setPayrolls((current) =>
        current.map((payroll) =>
          payroll.id ===
          updatedPayroll.id
            ? updatedPayroll
            : payroll,
        ),
      );

      setSuccess(
        "Payroll approved successfully.",
      );
    } catch (requestError: unknown) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to approve payroll.",
        ),
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleMarkPaid(
    payrollId: string,
  ) {
    if (!isSuperAdmin) {
      return;
    }

    try {
      setProcessingId(payrollId);
      setError("");
      setSuccess("");

      const updatedPayroll =
        await markPayrollPaid(payrollId);

      setPayrolls((current) =>
        current.map((payroll) =>
          payroll.id ===
          updatedPayroll.id
            ? updatedPayroll
            : payroll,
        ),
      );

      setSuccess(
        "Payroll marked as paid.",
      );
    } catch (requestError: unknown) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to mark payroll as paid.",
        ),
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading payroll...</p>
      </main>
    );
  }

  return (
    <div className="p-8">
      <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isEmployee
                ? "My Payroll"
                : "Payroll"}
            </h1>

            <p className="mt-2 text-slate-600">
              {isEmployee
                ? "View your monthly salary and payroll history."
                : "Manage employee salary profiles and monthly payroll."}
            </p>
          </div>

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
            {!isEmployee && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Employees
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {employees.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Salary Profiles
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {salaryProfiles.length}
                  </p>
                </div>
              </>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                {isEmployee
                  ? "My Payroll Records"
                  : "Draft Payrolls"}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {isEmployee
                  ? payrolls.length
                  : payrolls.filter(
                      (payroll) =>
                        payroll.status ===
                        "DRAFT",
                    ).length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Paid Payrolls
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {
                  payrolls.filter(
                    (payroll) =>
                      payroll.status ===
                      "PAID",
                  ).length
                }
              </p>
            </div>
          </div>

          {!isEmployee && (
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "salary-profiles",
                  )
                }
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                  activeTab ===
                  "salary-profiles"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700"
                }`}
              >
                Salary Profiles
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab("generate")
                }
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                  activeTab === "generate"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700"
                }`}
              >
                Generate Payroll
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab("history")
                }
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                  activeTab === "history"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700"
                }`}
              >
                Payroll History
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Loading payroll data...
            </div>
          ) : (
            <>
              {!isEmployee &&
                activeTab ===
                  "salary-profiles" && (
                  <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-5">
                      <div className="flex items-center gap-3">
                        <WalletCards size={22} />

                        <div>
                          <h2 className="font-semibold text-slate-900">
                            Salary Profiles
                          </h2>

                          <p className="text-sm text-slate-500">
                            View employee salary
                            configurations.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-6 py-4">
                              Employee
                            </th>

                            <th className="px-6 py-4">
                              Basic Salary
                            </th>

                            <th className="px-6 py-4">
                              Allowance
                            </th>

                            <th className="px-6 py-4">
                              Deduction
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                          {filteredSalaryProfiles.map(
                            (profile) => (
                              <tr
                                key={profile.id}
                                className="text-sm text-slate-700"
                              >
                                <td className="px-6 py-5">
                                  <p className="font-semibold text-slate-900">
                                    {profile.employee
                                      ? `${profile.employee.firstName} ${profile.employee.lastName}`
                                      : "Unknown employee"}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {profile.employee
                                      ?.employeeNumber ??
                                      "—"}
                                  </p>
                                </td>

                                <td className="px-6 py-5">
                                  {formatMoney(
                                    profile.basicSalary,
                                  )}
                                </td>

                                <td className="px-6 py-5">
                                  {formatMoney(
                                    profile.fixedAllowance,
                                  )}
                                </td>

                                <td className="px-6 py-5">
                                  {formatMoney(
                                    profile.fixedDeduction,
                                  )}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

              {!isEmployee &&
                activeTab === "generate" && (
                  <div className="mt-8 grid gap-8 xl:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-3">
                        <CircleDollarSign
                          size={22}
                        />

                        <h2 className="font-semibold text-slate-900">
                          Generate Payroll
                        </h2>
                      </div>

                      <label className="mb-2 mt-6 block text-sm font-medium text-slate-700">
                        Employee
                      </label>

                      <select
                        value={
                          payrollEmployeeId
                        }
                        onChange={(event) =>
                          setPayrollEmployeeId(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                      >
                        <option value="">
                          Select an employee
                        </option>

                        {salaryProfiles.map(
                          (profile) => (
                            <option
                              key={profile.id}
                              value={
                                profile.employeeId
                              }
                            >
                              {profile.employee
                                ? `${profile.employee.firstName} ${profile.employee.lastName}`
                                : "Unknown employee"}
                            </option>
                          ),
                        )}
                      </select>

                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Month
                          </label>

                          <select
                            value={
                              payrollMonth
                            }
                            onChange={(
                              event,
                            ) =>
                              setPayrollMonth(
                                event.target
                                  .value,
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                          >
                            {monthNames.map(
                              (
                                month,
                                index,
                              ) => (
                                <option
                                  key={month}
                                  value={
                                    index + 1
                                  }
                                >
                                  {month}
                                </option>
                              ),
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Year
                          </label>

                          <input
                            type="number"
                            min="2000"
                            value={
                              payrollYear
                            }
                            onChange={(
                              event,
                            ) =>
                              setPayrollYear(
                                event.target
                                  .value,
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                          />
                        </div>
                      </div>

                      <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                        Additional allowance
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          additionalAllowance
                        }
                        onChange={(event) =>
                          setAdditionalAllowance(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                      />

                      <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                        Additional deduction
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          additionalDeduction
                        }
                        onChange={(event) =>
                          setAdditionalDeduction(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void handleGeneratePayroll()
                        }
                        disabled={
                          isGeneratingPayroll
                        }
                        className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isGeneratingPayroll
                          ? "Generating..."
                          : "Generate Payroll"}
                      </button>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="font-semibold text-slate-900">
                        Payroll Preview
                      </h2>

                      <div className="mt-6 space-y-4">
                        <div className="flex justify-between">
                          <span>
                            Basic salary
                          </span>

                          <strong>
                            {formatMoney(
                              payrollPreview.basicSalary,
                            )}
                          </strong>
                        </div>

                        <div className="flex justify-between">
                          <span>
                            Allowances
                          </span>

                          <strong>
                            {formatMoney(
                              payrollPreview.allowances,
                            )}
                          </strong>
                        </div>

                        <div className="flex justify-between">
                          <span>
                            Deductions
                          </span>

                          <strong>
                            {formatMoney(
                              payrollPreview.deductions,
                            )}
                          </strong>
                        </div>

                        <div className="flex justify-between rounded-xl bg-slate-900 p-5 text-white">
                          <span>
                            Net salary
                          </span>

                          <strong>
                            {formatMoney(
                              payrollPreview.netSalary,
                            )}
                          </strong>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

              {(isEmployee ||
                activeTab ===
                  "history") && (
                <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {isEmployee
                          ? "My Payroll History"
                          : "Payroll History"}
                      </h2>

                      <p className="text-sm text-slate-500">
                        {isEmployee
                          ? "Only your payroll records are displayed."
                          : "All employee payroll records."}
                      </p>
                    </div>

                    <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3">
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
                        placeholder="Search payroll history"
                        className="w-full bg-white text-sm text-black outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          {!isEmployee && (
                            <th className="px-6 py-4">
                              Employee
                            </th>
                          )}

                          <th className="px-6 py-4">
                            Period
                          </th>

                          <th className="px-6 py-4">
                            Basic
                          </th>

                          <th className="px-6 py-4">
                            Allowances
                          </th>

                          <th className="px-6 py-4">
                            Deductions
                          </th>

                          <th className="px-6 py-4">
                            Gross
                          </th>

                          <th className="px-6 py-4">
                            Net Salary
                          </th>

                          <th className="px-6 py-4">
                            Status
                          </th>

                          {!isEmployee && (
                            <th className="px-6 py-4">
                              Action
                            </th>
                          )}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {filteredPayrolls.map(
                          (payroll) => (
                            <tr
                              key={payroll.id}
                              className="text-sm text-slate-700"
                            >
                              {!isEmployee && (
                                <td className="px-6 py-5">
                                  <p className="font-semibold text-slate-900">
                                    {getEmployeeName(
                                      payroll.employee,
                                    )}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {payroll.employee
                                      ?.employeeNumber ??
                                      "—"}
                                  </p>
                                </td>
                              )}

                              <td className="px-6 py-5">
                                {monthNames[
                                  payroll.month -
                                    1
                                ] ??
                                  "Unknown"}{" "}
                                {payroll.year}
                              </td>

                              <td className="px-6 py-5">
                                {formatMoney(
                                  payroll.basicSalary,
                                )}
                              </td>

                              <td className="px-6 py-5">
                                {formatMoney(
                                  payroll.allowances,
                                )}
                              </td>

                              <td className="px-6 py-5">
                                {formatMoney(
                                  payroll.deductions,
                                )}
                              </td>

                              <td className="px-6 py-5">
                                {formatMoney(
                                  payroll.grossSalary,
                                )}
                              </td>

                              <td className="px-6 py-5 font-bold text-slate-900">
                                {formatMoney(
                                  payroll.netSalary,
                                )}
                              </td>

                              <td className="px-6 py-5">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                    payroll.status,
                                  )}`}
                                >
                                  {
                                    payroll.status
                                  }
                                </span>
                              </td>

                              {!isEmployee && (
                                <td className="px-6 py-5">
                                  {isSuperAdmin &&
                                    payroll.status ===
                                      "DRAFT" && (
                                      <button
                                        type="button"
                                        disabled={
                                          processingId ===
                                          payroll.id
                                        }
                                        onClick={() =>
                                          void handleApprovePayroll(
                                            payroll.id,
                                          )
                                        }
                                        className="flex items-center gap-1 font-semibold text-blue-700 hover:underline disabled:opacity-50"
                                      >
                                        <Check
                                          size={16}
                                        />

                                        Approve
                                      </button>
                                    )}

                                  {isSuperAdmin &&
                                    payroll.status ===
                                      "APPROVED" && (
                                      <button
                                        type="button"
                                        disabled={
                                          processingId ===
                                          payroll.id
                                        }
                                        onClick={() =>
                                          void handleMarkPaid(
                                            payroll.id,
                                          )
                                        }
                                        className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                                      >
                                        <Banknote
                                          size={16}
                                        />

                                        Mark Paid
                                      </button>
                                    )}

                                  {!isSuperAdmin && (
                                    <span className="text-slate-500">
                                      View only
                                    </span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ),
                        )}

                        {filteredPayrolls.length ===
                          0 && (
                          <tr>
                            <td
                              colSpan={
                                isEmployee
                                  ? 7
                                  : 9
                              }
                              className="px-6 py-12 text-center text-slate-500"
                            >
                              No payroll records
                              found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
    </div>
  );
}