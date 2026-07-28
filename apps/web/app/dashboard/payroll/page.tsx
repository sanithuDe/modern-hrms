"use client";

import axios from "axios";
import {
  BadgeDollarSign,
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
  type FormEvent,
} from "react";


import Sidebar from "../../../src/components/layout/sidebar";

import {
  getEmployees,
  type Employee,
} from "../../../src/services/employee.service";

import {
  approvePayroll,
  createSalaryProfile,
  generatePayroll,
  getPayrolls,
  getSalaryProfiles,
  markPayrollPaid,
  updateSalaryProfile,
  type Payroll,
  type SalaryProfile,
} from "../../../src/services/payroll.service";

interface StoredUser {
  email: string;
  role: string;
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
    const responseData = requestError.response?.data as
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

  if (requestError instanceof Error) {
    return requestError.message;
  }

  return fallbackMessage;
}

function toNumber(value: string | number): number {
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
  employee: Pick<
    Employee,
    "firstName" | "lastName"
  >,
): string {
  return `${employee.firstName} ${employee.lastName}`;
}

function getProfileEmployeeName(
  profile: SalaryProfile,
): string {
  if (!profile.employee) {
    return "Unknown employee";
  }

  return `${profile.employee.firstName} ${profile.employee.lastName}`;
}

function getProfileEmployeeNumber(
  profile: SalaryProfile,
): string {
  return (
    profile.employee?.employeeNumber ??
    "—"
  );
}

function getPayrollEmployeeName(
  payroll: Payroll,
): string {
  if (!payroll.employee) {
    return "Unknown employee";
  }

  return `${payroll.employee.firstName} ${payroll.employee.lastName}`;
}

function getPayrollEmployeeNumber(
  payroll: Payroll,
): string {
  return (
    payroll.employee?.employeeNumber ??
    "—"
  );
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
    useState<PayrollTab>(
      "salary-profiles",
    );

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    salaryEmployeeId,
    setSalaryEmployeeId,
  ] = useState("");

  const [basicSalary, setBasicSalary] =
    useState("");

  const [
    fixedAllowance,
    setFixedAllowance,
  ] = useState("0");

  const [
    fixedDeduction,
    setFixedDeduction,
  ] = useState("0");

  const [
    isCreatingProfile,
    setIsCreatingProfile,
  ] = useState(false);

  const [
    editingProfile,
    setEditingProfile,
  ] = useState<SalaryProfile | null>(
    null,
  );

  const [
    editBasicSalary,
    setEditBasicSalary,
  ] = useState("");

  const [
    editFixedAllowance,
    setEditFixedAllowance,
  ] = useState("");

  const [
    editFixedDeduction,
    setEditFixedDeduction,
  ] = useState("");

  const [
    isUpdatingProfile,
    setIsUpdatingProfile,
  ] = useState(false);

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

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN";

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
        JSON.parse(
          storedUser,
        ) as StoredUser;

      if (
        parsedUser.role !==
          "SUPER_ADMIN" &&
        parsedUser.role !== "HR_MANAGER"
      ) {
        router.replace("/dashboard");
        return;
      }

      setUser(parsedUser);

      void loadPayrollData();
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

  async function loadPayrollData() {
    try {
      setIsLoading(true);
      setError("");

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

  const employeesWithoutProfile =
    useMemo(() => {
      const profileEmployeeIds =
        new Set(
          salaryProfiles.map(
            (profile) =>
              profile.employeeId,
          ),
        );

      return employees.filter(
        (employee) =>
          !profileEmployeeIds.has(
            employee.id,
          ),
      );
    }, [employees, salaryProfiles]);

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
            getProfileEmployeeName(
              profile,
            ).toLowerCase();

          const employeeNumber =
            getProfileEmployeeNumber(
              profile,
            ).toLowerCase();

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
            getPayrollEmployeeName(
              payroll,
            ).toLowerCase();

          const employeeNumber =
            getPayrollEmployeeNumber(
              payroll,
            ).toLowerCase();

          const month =
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
            month.includes(keyword) ||
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
          allowance: 0,
          deduction: 0,
          grossSalary: 0,
          netSalary: 0,
        };
      }

      const salary = toNumber(
        selectedSalaryProfile.basicSalary,
      );

      const allowance =
        toNumber(
          selectedSalaryProfile.fixedAllowance,
        ) +
        toNumber(additionalAllowance);

      const deduction =
        toNumber(
          selectedSalaryProfile.fixedDeduction,
        ) +
        toNumber(additionalDeduction);

      const grossSalary =
        salary + allowance;

      return {
        basicSalary: salary,
        allowance,
        deduction,
        grossSalary,
        netSalary:
          grossSalary - deduction,
      };
    }, [
      selectedSalaryProfile,
      additionalAllowance,
      additionalDeduction,
    ]);

  async function handleCreateSalaryProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!isSuperAdmin) {
      setError(
        "Only Super Admin can create salary profiles.",
      );
      return;
    }

    if (!salaryEmployeeId) {
      setError(
        "Please select an employee.",
      );
      return;
    }

    const parsedBasicSalary =
      Number(basicSalary);

    const parsedAllowance =
      Number(fixedAllowance || 0);

    const parsedDeduction =
      Number(fixedDeduction || 0);

    if (
      !Number.isFinite(
        parsedBasicSalary,
      ) ||
      parsedBasicSalary < 0
    ) {
      setError(
        "Enter a valid basic salary.",
      );
      return;
    }

    if (
      !Number.isFinite(
        parsedAllowance,
      ) ||
      parsedAllowance < 0
    ) {
      setError(
        "Enter a valid fixed allowance.",
      );
      return;
    }

    if (
      !Number.isFinite(
        parsedDeduction,
      ) ||
      parsedDeduction < 0
    ) {
      setError(
        "Enter a valid fixed deduction.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsCreatingProfile(true);

    try {
      const profile =
        await createSalaryProfile({
          employeeId:
            salaryEmployeeId,
          basicSalary:
            parsedBasicSalary,
          fixedAllowance:
            parsedAllowance,
          fixedDeduction:
            parsedDeduction,
        });

      const selectedEmployee =
        employees.find(
          (employee) =>
            employee.id ===
            profile.employeeId,
        );

      const normalizedProfile: SalaryProfile = {
        ...profile,
        employee:
          profile.employee ??
          (selectedEmployee
            ? {
                id:
                  selectedEmployee.id,
                employeeNumber:
                  selectedEmployee.employeeNumber,
                firstName:
                  selectedEmployee.firstName,
                lastName:
                  selectedEmployee.lastName,
                department:
                  selectedEmployee.department,
                position:
                  selectedEmployee.position,
              }
            : null),
      };

      setSalaryProfiles(
        (current) => [
          normalizedProfile,
          ...current,
        ],
      );

      setSalaryEmployeeId("");
      setBasicSalary("");
      setFixedAllowance("0");
      setFixedDeduction("0");

      setSuccess(
        "Salary profile created successfully.",
      );
    } catch (requestError: unknown) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to create salary profile.",
        ),
      );
    } finally {
      setIsCreatingProfile(false);
    }
  }

  function openProfileEditor(
    profile: SalaryProfile,
  ) {
    setError("");
    setSuccess("");

    setEditingProfile(profile);

    setEditBasicSalary(
      String(profile.basicSalary),
    );

    setEditFixedAllowance(
      String(profile.fixedAllowance),
    );

    setEditFixedDeduction(
      String(profile.fixedDeduction),
    );
  }

  function closeProfileEditor() {
    if (isUpdatingProfile) {
      return;
    }

    setEditingProfile(null);
    setEditBasicSalary("");
    setEditFixedAllowance("");
    setEditFixedDeduction("");
  }

  async function handleUpdateSalaryProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingProfile) {
      return;
    }

    const parsedBasicSalary =
      Number(editBasicSalary);

    const parsedAllowance =
      Number(editFixedAllowance || 0);

    const parsedDeduction =
      Number(editFixedDeduction || 0);

    if (
      !Number.isFinite(
        parsedBasicSalary,
      ) ||
      parsedBasicSalary < 0
    ) {
      setError(
        "Enter a valid basic salary.",
      );
      return;
    }

    if (
      !Number.isFinite(
        parsedAllowance,
      ) ||
      parsedAllowance < 0
    ) {
      setError(
        "Enter a valid fixed allowance.",
      );
      return;
    }

    if (
      !Number.isFinite(
        parsedDeduction,
      ) ||
      parsedDeduction < 0
    ) {
      setError(
        "Enter a valid fixed deduction.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsUpdatingProfile(true);

    try {
      const profile =
        await updateSalaryProfile(
          editingProfile.employeeId,
          {
            basicSalary:
              parsedBasicSalary,
            fixedAllowance:
              parsedAllowance,
            fixedDeduction:
              parsedDeduction,
          },
        );

      setSalaryProfiles((current) =>
        current.map(
          (currentProfile) => {
            if (
              currentProfile.id !==
              profile.id
            ) {
              return currentProfile;
            }

            return {
              ...currentProfile,
              ...profile,
              employee:
                profile.employee ??
                currentProfile.employee,
            };
          },
        ),
      );

      closeProfileEditor();

      setSuccess(
        "Salary profile updated successfully.",
      );
    } catch (requestError: unknown) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to update salary profile.",
        ),
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function handleGeneratePayroll(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!payrollEmployeeId) {
      setError(
        "Please select an employee.",
      );
      return;
    }

    if (!selectedSalaryProfile) {
      setError(
        "This employee does not have a salary profile.",
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

    setError("");
    setSuccess("");
    setIsGeneratingPayroll(true);

    try {
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

      const selectedProfile =
        salaryProfiles.find(
          (profile) =>
            profile.employeeId ===
            payroll.employeeId,
        );

      const normalizedPayroll: Payroll = {
        ...payroll,
        employee:
          payroll.employee ??
          selectedProfile?.employee ??
          null,
      };

      setPayrolls((current) => [
        normalizedPayroll,
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
    setError("");
    setSuccess("");
    setProcessingId(payrollId);

    try {
      const updatedPayroll =
        await approvePayroll(
          payrollId,
        );

      setPayrolls((current) =>
        current.map((payroll) =>
          payroll.id ===
          updatedPayroll.id
            ? {
                ...payroll,
                ...updatedPayroll,
                employee:
                  updatedPayroll.employee ??
                  payroll.employee,
              }
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
    setError("");
    setSuccess("");
    setProcessingId(payrollId);

    try {
      const updatedPayroll =
        await markPayrollPaid(
          payrollId,
        );

      setPayrolls((current) =>
        current.map((payroll) =>
          payroll.id ===
          updatedPayroll.id
            ? {
                ...payroll,
                ...updatedPayroll,
                employee:
                  updatedPayroll.employee ??
                  payroll.employee,
              }
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
        <p className="text-slate-600">
          Loading payroll...
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role={user.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Payroll
            </h1>

            <p className="mt-2 text-slate-600">
              Manage employee salary profiles
              and monthly payroll.
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

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Draft Payrolls
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {
                  payrolls.filter(
                    (payroll) =>
                      payroll.status ===
                      "DRAFT",
                  ).length
                }
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

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "salary-profiles",
                )
              }
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
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
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
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
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                activeTab === "history"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-700"
              }`}
            >
              Payroll History
            </button>
          </div>

          {isLoading && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Loading payroll data...
            </div>
          )}

          {!isLoading &&
            activeTab ===
              "salary-profiles" && (
              <div className="mt-8 grid gap-8 xl:grid-cols-[380px_1fr]">
                {isSuperAdmin && (
                  <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-100 p-3">
                        <WalletCards
                          size={22}
                          className="text-slate-700"
                        />
                      </div>

                      <div>
                        <h2 className="font-semibold text-slate-900">
                          Salary Profile
                        </h2>

                        <p className="text-sm text-slate-500">
                          Configure an employee
                          salary.
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={
                        handleCreateSalaryProfile
                      }
                      className="mt-6"
                    >
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Employee
                      </label>

                      <select
                        required
                        value={
                          salaryEmployeeId
                        }
                        onChange={(event) =>
                          setSalaryEmployeeId(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black outline-none"
                      >
                        <option value="">
                          Select an employee
                        </option>

                        {employeesWithoutProfile.map(
                          (employee) => (
                            <option
                              key={
                                employee.id
                              }
                              value={
                                employee.id
                              }
                            >
                              {getEmployeeName(
                                employee,
                              )}{" "}
                              (
                              {
                                employee.employeeNumber
                              }
                              )
                            </option>
                          ),
                        )}
                      </select>

                      <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                        Basic salary
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={basicSalary}
                        onChange={(event) =>
                          setBasicSalary(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black outline-none"
                      />

                      <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                        Fixed allowance
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          fixedAllowance
                        }
                        onChange={(event) =>
                          setFixedAllowance(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black outline-none"
                      />

                      <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                        Fixed deduction
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          fixedDeduction
                        }
                        onChange={(event) =>
                          setFixedDeduction(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black outline-none"
                      />

                      <button
                        type="submit"
                        disabled={
                          isCreatingProfile
                        }
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Plus size={18} />

                        {isCreatingProfile
                          ? "Creating..."
                          : "Create Profile"}
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
                    <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3">
                      <Search
                        size={18}
                        className="text-slate-400"
                      />

                      <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                          setSearch(
                            event.target.value,
                          )
                        }
                        placeholder="Search salary profiles"
                        className="w-full bg-white text-sm text-black outline-none"
                      />
                    </div>

                    <p className="text-sm text-slate-500">
                      {
                        filteredSalaryProfiles.length
                      }{" "}
                      profile(s)
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-4">
                            Employee
                          </th>

                          <th className="px-6 py-4">
                            Basic
                          </th>

                          <th className="px-6 py-4">
                            Allowance
                          </th>

                          <th className="px-6 py-4">
                            Deduction
                          </th>

                          <th className="px-6 py-4">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {filteredSalaryProfiles.map(
                          (profile) => (
                            <tr
                              key={
                                profile.id
                              }
                              className="text-sm text-slate-700"
                            >
                              <td className="px-6 py-5">
                                <p className="font-semibold text-slate-900">
                                  {getProfileEmployeeName(
                                    profile,
                                  )}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {getProfileEmployeeNumber(
                                    profile,
                                  )}
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

                              <td className="px-6 py-5">
                                {isSuperAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openProfileEditor(
                                        profile,
                                      )
                                    }
                                    className="flex items-center gap-1 font-medium text-blue-700 hover:underline"
                                  >
                                    <Pencil
                                      size={
                                        15
                                      }
                                    />

                                    Edit
                                  </button>
                                ) : (
                                  "View only"
                                )}
                              </td>
                            </tr>
                          ),
                        )}

                        {filteredSalaryProfiles.length ===
                          0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-10 text-center text-slate-500"
                            >
                              No salary profiles
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
            activeTab === "generate" && (
              <div className="mt-8 grid gap-8 xl:grid-cols-[440px_1fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-3">
                      <CircleDollarSign
                        size={22}
                      />
                    </div>

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Generate Payroll
                      </h2>

                      <p className="text-sm text-slate-500">
                        Create a monthly
                        payroll record.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={
                      handleGeneratePayroll
                    }
                    className="mt-6"
                  >
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Employee
                    </label>

                    <select
                      required
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
                            {getProfileEmployeeName(
                              profile,
                            )}
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
                                key={
                                  month
                                }
                                value={
                                  index +
                                  1
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
                      type="submit"
                      disabled={
                        isGeneratingPayroll
                      }
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <BadgeDollarSign
                        size={18}
                      />

                      {isGeneratingPayroll
                        ? "Generating..."
                        : "Generate Payroll"}
                    </button>
                  </form>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Payroll Preview
                  </h2>

                  {!selectedSalaryProfile ? (
                    <p className="mt-4 text-slate-500">
                      Select an employee to
                      calculate payroll.
                    </p>
                  ) : (
                    <div className="mt-6 space-y-4">
                      <div className="flex justify-between border-b border-slate-200 pb-4">
                        <span className="text-slate-600">
                          Basic salary
                        </span>

                        <strong>
                          {formatMoney(
                            payrollPreview.basicSalary,
                          )}
                        </strong>
                      </div>

                      <div className="flex justify-between border-b border-slate-200 pb-4">
                        <span className="text-slate-600">
                          Total allowances
                        </span>

                        <strong className="text-emerald-700">
                          +
                          {formatMoney(
                            payrollPreview.allowance,
                          )}
                        </strong>
                      </div>

                      <div className="flex justify-between border-b border-slate-200 pb-4">
                        <span className="text-slate-600">
                          Gross salary
                        </span>

                        <strong>
                          {formatMoney(
                            payrollPreview.grossSalary,
                          )}
                        </strong>
                      </div>

                      <div className="flex justify-between border-b border-slate-200 pb-4">
                        <span className="text-slate-600">
                          Total deductions
                        </span>

                        <strong className="text-red-600">
                          -
                          {formatMoney(
                            payrollPreview.deduction,
                          )}
                        </strong>
                      </div>

                      <div className="flex justify-between rounded-2xl bg-slate-900 p-5 text-white">
                        <span>
                          Net salary
                        </span>

                        <strong className="text-xl">
                          {formatMoney(
                            payrollPreview.netSalary,
                          )}
                        </strong>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

          {!isLoading &&
            activeTab === "history" && (
              <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
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

                  <p className="text-sm text-slate-500">
                    {
                      filteredPayrolls.length
                    }{" "}
                    record(s)
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-4">
                          Employee
                        </th>

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
                          Net Salary
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
                      {filteredPayrolls.map(
                        (payroll) => (
                          <tr
                            key={payroll.id}
                            className="text-sm text-slate-700"
                          >
                            <td className="px-6 py-5">
                              <p className="font-semibold text-slate-900">
                                {getPayrollEmployeeName(
                                  payroll,
                                )}
                              </p>

                              <p className="text-xs text-slate-500">
                                {getPayrollEmployeeNumber(
                                  payroll,
                                )}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              {monthNames[
                                payroll.month -
                                  1
                              ] ??
                                "Unknown month"}{" "}
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
                                {payroll.status}
                              </span>
                            </td>

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
                                    className="flex items-center gap-1 font-semibold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Check
                                      size={
                                        16
                                      }
                                    />

                                    {processingId ===
                                    payroll.id
                                      ? "Processing..."
                                      : "Approve"}
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
                                    className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Banknote
                                      size={
                                        16
                                      }
                                    />

                                    {processingId ===
                                    payroll.id
                                      ? "Processing..."
                                      : "Mark Paid"}
                                  </button>
                                )}

                              {payroll.status ===
                                "PAID" && (
                                <span className="font-medium text-emerald-700">
                                  Completed
                                </span>
                              )}

                              {payroll.status ===
                                "CANCELLED" && (
                                <span className="font-medium text-red-700">
                                  Cancelled
                                </span>
                              )}
                            </td>
                          </tr>
                        ),
                      )}

                      {filteredPayrolls.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan={8}
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
        </main>
      </div>

      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Salary Profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {getProfileEmployeeName(
                    editingProfile,
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeProfileEditor}
                disabled={
                  isUpdatingProfile
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close salary profile editor"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleUpdateSalaryProfile
              }
              className="mt-6"
            >
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Basic salary
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={editBasicSalary}
                onChange={(event) =>
                  setEditBasicSalary(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black outline-none"
              />

              <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                Fixed allowance
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={editFixedAllowance}
                onChange={(event) =>
                  setEditFixedAllowance(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black outline-none"
              />

              <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
                Fixed deduction
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={editFixedDeduction}
                onChange={(event) =>
                  setEditFixedDeduction(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black outline-none"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    closeProfileEditor
                  }
                  disabled={
                    isUpdatingProfile
                  }
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isUpdatingProfile
                  }
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingProfile
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