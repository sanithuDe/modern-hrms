"use client";

import axios from "axios";

import {
  Banknote,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Pencil,
  Plus,
  Search,
  TriangleAlert,
  WalletCards,
  X,
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
  createSalaryProfile,
  generatePayroll,
  getMyPayrolls,
  getPayrolls,
  getSalaryProfiles,
  markPayrollPaid,
  updateSalaryProfile,
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

  const [showProfileForm, setShowProfileForm] =
    useState(false);

  const [editingProfile, setEditingProfile] =
    useState<SalaryProfile | null>(null);

  const [profileEmployeeId, setProfileEmployeeId] =
    useState("");

  const [profileBasicSalary, setProfileBasicSalary] =
    useState("");

  const [
    profileFixedAllowance,
    setProfileFixedAllowance,
  ] = useState("0");

  const [
    profileFixedDeduction,
    setProfileFixedDeduction,
  ] = useState("0");

  const [
    isSavingProfile,
    setIsSavingProfile,
  ] = useState(false);

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
      } else {
        setActiveTab("salary-profiles");
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
          fixedAllowance: 0,
          additionalAllowance: 0,
          allowances: 0,
          fixedDeduction: 0,
          additionalDeduction: 0,
          deductions: 0,
          grossSalary: 0,
          netSalary: 0,
        };
      }

      const basicSalary = toNumber(
        selectedSalaryProfile.basicSalary,
      );

      const fixedAllowance = toNumber(
        selectedSalaryProfile.fixedAllowance,
      );

      const extraAllowance = toNumber(
        additionalAllowance,
      );

      const fixedDeduction = toNumber(
        selectedSalaryProfile.fixedDeduction,
      );

      const extraDeduction = toNumber(
        additionalDeduction,
      );

      const allowances =
        fixedAllowance + extraAllowance;

      const deductions =
        fixedDeduction + extraDeduction;

      const grossSalary =
        basicSalary + allowances;

      return {
        basicSalary,
        fixedAllowance,
        additionalAllowance: extraAllowance,
        allowances,
        fixedDeduction,
        additionalDeduction: extraDeduction,
        deductions,
        grossSalary,
        netSalary: grossSalary - deductions,
      };
    }, [
      selectedSalaryProfile,
      additionalAllowance,
      additionalDeduction,
    ]);

  const employeesWithoutProfile =
    useMemo(() => {
      const profileIds = new Set(
        salaryProfiles.map(
          (profile) => profile.employeeId,
        ),
      );

      return employees.filter(
        (employee) =>
          !profileIds.has(employee.id) &&
          (!employee.user?.status ||
            employee.user.status === "ACTIVE"),
      );
    }, [employees, salaryProfiles]);

  function openCreateProfile(): void {
    setEditingProfile(null);
    setProfileEmployeeId(
      employeesWithoutProfile[0]?.id ?? "",
    );
    setProfileBasicSalary("");
    setProfileFixedAllowance("0");
    setProfileFixedDeduction("0");
    setShowProfileForm(true);
    setError("");
    setSuccess("");
  }

  function openEditProfile(
    profile: SalaryProfile,
  ): void {
    setEditingProfile(profile);
    setProfileEmployeeId(profile.employeeId);
    setProfileBasicSalary(
      String(toNumber(profile.basicSalary)),
    );
    setProfileFixedAllowance(
      String(toNumber(profile.fixedAllowance)),
    );
    setProfileFixedDeduction(
      String(toNumber(profile.fixedDeduction)),
    );
    setShowProfileForm(true);
    setError("");
    setSuccess("");
  }

  function closeProfileForm(): void {
    setShowProfileForm(false);
    setEditingProfile(null);
  }

  async function handleSaveSalaryProfile(): Promise<void> {
    if (!isSuperAdmin) {
      return;
    }

    if (!editingProfile && !profileEmployeeId) {
      setError("Please select an employee.");
      return;
    }

    const basic = toNumber(profileBasicSalary);

    if (!profileBasicSalary.trim() || basic < 0) {
      setError("Enter a valid basic salary.");
      return;
    }

    try {
      setIsSavingProfile(true);
      setError("");
      setSuccess("");

      const payload = {
        basicSalary: basic,
        fixedAllowance: toNumber(
          profileFixedAllowance,
        ),
        fixedDeduction: toNumber(
          profileFixedDeduction,
        ),
      };

      if (editingProfile) {
        const updated =
          await updateSalaryProfile(
            editingProfile.employeeId,
            payload,
          );

        setSalaryProfiles((current) =>
          current.map((profile) =>
            profile.id === updated.id
              ? updated
              : profile,
          ),
        );

        setSuccess(
          "Salary profile updated successfully.",
        );
      } else {
        const created =
          await createSalaryProfile({
            employeeId: profileEmployeeId,
            ...payload,
          });

        setSalaryProfiles((current) => [
          created,
          ...current,
        ]);

        setSuccess(
          "Salary profile created successfully.",
        );
      }

      closeProfileForm();
    } catch (requestError: unknown) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to save salary profile.",
        ),
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

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
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <WalletCards size={22} />

                          <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                              Salary Profiles
                            </h2>

                            <p className="text-sm text-slate-500">
                              {isSuperAdmin
                                ? "Set basic salary, fixed allowance, and fixed deduction. These amounts are used when generating payroll."
                                : "View employee salary configurations. Only Super Admin can create or edit profiles."}
                            </p>
                          </div>
                        </div>

                        {isSuperAdmin ? (
                          <button
                            type="button"
                            onClick={openCreateProfile}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            <Plus className="h-4 w-4" />
                            New Profile
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {showProfileForm && isSuperAdmin ? (
                      <div className="border-b border-slate-200 bg-slate-50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {editingProfile
                              ? "Edit Salary Profile"
                              : "Create Salary Profile"}
                          </h3>

                          <button
                            type="button"
                            onClick={closeProfileForm}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                            aria-label="Close form"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {!editingProfile ? (
                            <div className="md:col-span-2">
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Employee
                              </label>
                              <select
                                value={profileEmployeeId}
                                onChange={(event) =>
                                  setProfileEmployeeId(
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                              >
                                <option value="">
                                  Select employee
                                </option>
                                {employeesWithoutProfile.map(
                                  (employee) => (
                                    <option
                                      key={employee.id}
                                      value={employee.id}
                                    >
                                      {employee.employeeNumber}{" "}
                                      - {employee.firstName}{" "}
                                      {employee.lastName}
                                    </option>
                                  ),
                                )}
                              </select>
                              {employeesWithoutProfile.length ===
                              0 ? (
                                <p className="mt-2 text-xs text-amber-700">
                                  All active employees already
                                  have a salary profile.
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <div className="md:col-span-2">
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Employee
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={
                                  editingProfile.employee
                                    ? `${editingProfile.employee.employeeNumber} - ${editingProfile.employee.firstName} ${editingProfile.employee.lastName}`
                                    : "Employee"
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                              />
                            </div>
                          )}

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Basic salary
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={profileBasicSalary}
                              onChange={(event) =>
                                setProfileBasicSalary(
                                  event.target.value,
                                )
                              }
                              placeholder="e.g. 50000"
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Fixed allowance
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={profileFixedAllowance}
                              onChange={(event) =>
                                setProfileFixedAllowance(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Fixed deduction
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={profileFixedDeduction}
                              onChange={(event) =>
                                setProfileFixedDeduction(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={closeProfileForm}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSavingProfile}
                            onClick={() =>
                              void handleSaveSalaryProfile()
                            }
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {isSavingProfile
                              ? "Saving..."
                              : editingProfile
                                ? "Save Changes"
                                : "Create Profile"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {filteredSalaryProfiles.length ===
                    0 ? (
                      <div className="px-6 py-12 text-center text-slate-500">
                        <p className="font-medium text-slate-700">
                          No salary profiles yet
                        </p>
                        <p className="mt-1 text-sm">
                          {isSuperAdmin
                            ? "Create a profile with basic salary first, then generate payroll."
                            : "Ask Super Admin to create salary profiles before generating payroll."}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-6 py-4">
                                Employee
                              </th>
                              <th className="px-6 py-4">
                                Basic Salary
                              </th>
                              <th className="px-6 py-4">
                                Fixed Allowance
                              </th>
                              <th className="px-6 py-4">
                                Fixed Deduction
                              </th>
                              {isSuperAdmin ? (
                                <th className="px-6 py-4 text-right">
                                  Actions
                                </th>
                              ) : null}
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
                                  <td className="px-6 py-5 font-semibold tabular-nums text-slate-900">
                                    {formatMoney(
                                      profile.basicSalary,
                                    )}
                                  </td>
                                  <td className="px-6 py-5 tabular-nums">
                                    {formatMoney(
                                      profile.fixedAllowance,
                                    )}
                                  </td>
                                  <td className="px-6 py-5 tabular-nums">
                                    {formatMoney(
                                      profile.fixedDeduction,
                                    )}
                                  </td>
                                  {isSuperAdmin ? (
                                    <td className="px-6 py-5 text-right">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEditProfile(
                                            profile,
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                    </td>
                                  ) : null}
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
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

                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">
                            Generate Payroll
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Full salary comes from the salary
                            profile. Add only extra allowance
                            or deduction for this month.
                          </p>
                        </div>
                      </div>

                      {salaryProfiles.length === 0 ? (
                        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          No salary profiles found.{" "}
                          {isSuperAdmin
                            ? "Create a salary profile first (basic salary + fixed amounts)."
                            : "Ask Super Admin to create salary profiles before generating."}
                          {isSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab(
                                  "salary-profiles",
                                );
                                openCreateProfile();
                              }}
                              className="ml-1 font-semibold underline"
                            >
                              Create profile
                            </button>
                          ) : null}
                        </div>
                      ) : null}

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
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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

                      {selectedSalaryProfile ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            From salary profile
                          </p>
                          <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-slate-500">
                                Basic
                              </p>
                              <p className="font-semibold tabular-nums text-slate-900">
                                {formatMoney(
                                  selectedSalaryProfile.basicSalary,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">
                                Fixed allow.
                              </p>
                              <p className="font-semibold tabular-nums text-slate-900">
                                {formatMoney(
                                  selectedSalaryProfile.fixedAllowance,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">
                                Fixed deduct.
                              </p>
                              <p className="font-semibold tabular-nums text-slate-900">
                                {formatMoney(
                                  selectedSalaryProfile.fixedDeduction,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

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
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                          />
                        </div>
                      </div>

                      <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                        Additional allowance
                        <span className="ml-1 font-normal text-slate-400">
                          this month only
                        </span>
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
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                      />

                      <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                        Additional deduction
                        <span className="ml-1 font-normal text-slate-400">
                          this month only
                        </span>
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
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void handleGeneratePayroll()
                        }
                        disabled={
                          isGeneratingPayroll ||
                          salaryProfiles.length ===
                            0
                        }
                        className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isGeneratingPayroll
                          ? "Generating..."
                          : "Generate Full Payroll"}
                      </button>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Payroll Preview
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Full calculated salary for the
                        selected employee and month.
                      </p>

                      {!selectedSalaryProfile ? (
                        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            Select an employee to preview
                            full salary
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Basic, allowances, deductions,
                            gross, and net will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-6 space-y-3">
                          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                            <span className="text-sm font-medium text-slate-600">
                              Basic salary
                            </span>
                            <span className="text-base font-semibold tabular-nums text-slate-900">
                              {formatMoney(
                                payrollPreview.basicSalary,
                              )}
                            </span>
                          </div>

                          <div className="rounded-xl border border-slate-200 px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-semibold text-slate-800">
                                Allowances
                              </span>
                              <span className="text-base font-semibold tabular-nums text-slate-900">
                                {formatMoney(
                                  payrollPreview.allowances,
                                )}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">
                                  Fixed allowance
                                </span>
                                <span className="tabular-nums text-slate-700">
                                  {formatMoney(
                                    payrollPreview.fixedAllowance,
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">
                                  Additional allowance
                                </span>
                                <span className="tabular-nums text-slate-700">
                                  {formatMoney(
                                    payrollPreview.additionalAllowance,
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-semibold text-slate-800">
                                Deductions
                              </span>
                              <span className="text-base font-semibold tabular-nums text-slate-900">
                                {formatMoney(
                                  payrollPreview.deductions,
                                )}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">
                                  Fixed deduction
                                </span>
                                <span className="tabular-nums text-slate-700">
                                  {formatMoney(
                                    payrollPreview.fixedDeduction,
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">
                                  Additional deduction
                                </span>
                                <span className="tabular-nums text-slate-700">
                                  {formatMoney(
                                    payrollPreview.additionalDeduction,
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <span className="text-sm font-semibold text-slate-800">
                              Gross salary
                            </span>
                            <span className="text-base font-bold tabular-nums text-slate-900">
                              {formatMoney(
                                payrollPreview.grossSalary,
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-900 px-5 py-4 text-white">
                            <span className="text-sm font-semibold tracking-wide">
                              Net salary
                            </span>
                            <span className="text-xl font-bold tabular-nums">
                              {formatMoney(
                                payrollPreview.netSalary,
                              )}
                            </span>
                          </div>

                          {payrollPreview.netSalary < 0 ? (
                            <p className="text-sm font-medium text-red-600">
                              Net salary cannot be negative.
                              Reduce deductions.
                            </p>
                          ) : null}
                        </div>
                      )}
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

                              <td className="px-6 py-5 font-medium tabular-nums text-slate-800">
                                {formatMoney(
                                  payroll.basicSalary,
                                )}
                              </td>

                              <td className="px-6 py-5 font-medium tabular-nums text-slate-800">
                                {formatMoney(
                                  payroll.allowances,
                                )}
                              </td>

                              <td className="px-6 py-5 font-medium tabular-nums text-slate-800">
                                {formatMoney(
                                  payroll.deductions,
                                )}
                              </td>

                              <td className="px-6 py-5 font-semibold tabular-nums text-slate-900">
                                {formatMoney(
                                  payroll.grossSalary,
                                )}
                              </td>

                              <td className="px-6 py-5 text-base font-bold tabular-nums text-slate-950">
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