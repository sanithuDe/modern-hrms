"use client";

import axios from "axios";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

// Header and Sidebar are provided by the shared Shell layout

import {
  getDepartments,
  type Department,
} from "../../../../src/services/department.service";

import {
  createEmployee,
  type UserRole,
} from "../../../../src/services/employee.service";

import {
  getPositions,
  type Position,
} from "../../../../src/services/position.service";

type CreatableUserRole = Exclude<
  UserRole,
  "SUPER_ADMIN"
>;

interface StoredUser {
  email: string;
  role: UserRole;
}

interface CreateEmployeeForm {
  email: string;
  password: string;
  role: CreatableUserRole;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  hireDate: string;
  departmentId: string | null;
  positionId: string | null;
}

const initialForm: CreateEmployeeForm = {
  email: "",
  password: "",
  role: "EMPLOYEE",
  employeeNumber: "",
  firstName: "",
  lastName: "",
  phone: "",
  hireDate: "",
  departmentId: null,
  positionId: null,
};

function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }
  }

  return fallbackMessage;
}

export default function AddEmployeePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [form, setForm] =
    useState<CreateEmployeeForm>(
      initialForm,
    );

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [positions, setPositions] =
    useState<Position[]>([]);

  const [
    isLoadingOptions,
    setIsLoadingOptions,
  ] = useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

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
        !parsedUser.email ||
        !parsedUser.role
      ) {
        throw new Error(
          "Invalid stored user",
        );
      }

      if (
        parsedUser.role !==
          "SUPER_ADMIN" &&
        parsedUser.role !==
          "HR_MANAGER"
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

    async function loadEmployeeOptions() {
      try {
        setIsLoadingOptions(true);
        setError("");

        const [
          departmentData,
          positionData,
        ] = await Promise.all([
          getDepartments(),
          getPositions(),
        ]);

        setDepartments(departmentData);
        setPositions(positionData);
      } catch (requestError: unknown) {
        console.error(
          "Failed to load employee options:",
          requestError,
        );

        setError(
          getErrorMessage(
            requestError,
            "Unable to load departments and positions.",
          ),
        );
      } finally {
        setIsLoadingOptions(false);
      }
    }

    void loadEmployeeOptions();
  }, [user]);

  const filteredPositions =
    useMemo(() => {
      if (!form.departmentId) {
        return [];
      }

      return positions.filter(
        (position) =>
          position.departmentId ===
          form.departmentId,
      );
    }, [
      positions,
      form.departmentId,
    ]);

  function updateField(
    field:
      | "email"
      | "password"
      | "employeeNumber"
      | "firstName"
      | "lastName"
      | "phone"
      | "hireDate",
    value: string,
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleRoleChange(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    const selectedRole =
      event.target
        .value as CreatableUserRole;

    setForm((current) => ({
      ...current,
      role: selectedRole,
    }));
  }

  function handleDepartmentChange(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    const selectedDepartmentId =
      event.target.value || null;

    setForm((current) => ({
      ...current,
      departmentId:
        selectedDepartmentId,
      positionId: null,
    }));
  }

  function handlePositionChange(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    const selectedPositionId =
      event.target.value || null;

    setForm((current) => ({
      ...current,
      positionId: selectedPositionId,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!user) {
      return;
    }

    const token =
      window.localStorage.getItem(
        "accessToken",
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");

    if (
      user.role === "HR_MANAGER" &&
      form.role !== "EMPLOYEE"
    ) {
      setError(
        "HR Managers can only create Employee accounts.",
      );

      return;
    }

    if (!form.departmentId) {
      setError(
        "Please select a department.",
      );

      return;
    }

    if (!form.positionId) {
      setError(
        "Please select a position.",
      );

      return;
    }

    const selectedPosition =
      positions.find(
        (position) =>
          position.id ===
          form.positionId,
      );

    if (!selectedPosition) {
      setError(
        "The selected position was not found.",
      );

      return;
    }

    if (
      selectedPosition.departmentId !==
      form.departmentId
    ) {
      setError(
        "The selected position does not belong to the selected department.",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      await createEmployee({
        email: form.email
          .trim()
          .toLowerCase(),
        password: form.password,
        role: form.role,
        employeeNumber:
          form.employeeNumber.trim(),
        firstName:
          form.firstName.trim(),
        lastName:
          form.lastName.trim(),
        phone:
          form.phone.trim() ||
          undefined,
        hireDate: form.hireDate,
        departmentId:
          form.departmentId,
        positionId: form.positionId,
      });

      router.push(
        "/dashboard/employees",
      );

      router.refresh();
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to create employee.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading employee form...</p>
      </main>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
            <Link
              href="/dashboard/employees"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back to employees
            </Link>

            <div className="mt-5">
              <h1 className="text-3xl font-bold text-slate-900">
                Add Employee
              </h1>

              <p className="mt-2 text-slate-600">
                Create a user account and
                employee profile.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Account information
                </h2>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Temporary password
                    </label>

                    <input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) =>
                        updateField(
                          "password",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Role
                    </label>

                    <select
                      id="role"
                      value={form.role}
                      onChange={
                        handleRoleChange
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    >
                      <option value="EMPLOYEE">
                        Employee
                      </option>

                      {user.role ===
                        "SUPER_ADMIN" && (
                        <option value="HR_MANAGER">
                          HR Manager
                        </option>
                      )}
                    </select>

                    {user.role ===
                      "HR_MANAGER" && (
                      <p className="mt-2 text-xs text-slate-500">
                        HR Managers can only
                        create Employee
                        accounts.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-10 border-t border-slate-200 pt-8">
                <h2 className="text-lg font-semibold text-slate-900">
                  Employee information
                </h2>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="employeeNumber"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Employee number
                    </label>

                    <input
                      id="employeeNumber"
                      type="text"
                      required
                      placeholder="EMP-001"
                      value={
                        form.employeeNumber
                      }
                      onChange={(event) =>
                        updateField(
                          "employeeNumber",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="hireDate"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Hire date
                    </label>

                    <input
                      id="hireDate"
                      type="date"
                      required
                      value={form.hireDate}
                      onChange={(event) =>
                        updateField(
                          "hireDate",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      First name
                    </label>

                    <input
                      id="firstName"
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(event) =>
                        updateField(
                          "firstName",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Last name
                    </label>

                    <input
                      id="lastName"
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(event) =>
                        updateField(
                          "lastName",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Phone number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="departmentId"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Department
                    </label>

                    <select
                      id="departmentId"
                      required
                      value={
                        form.departmentId ??
                        ""
                      }
                      onChange={
                        handleDepartmentChange
                      }
                      disabled={
                        isLoadingOptions
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">
                        {isLoadingOptions
                          ? "Loading departments..."
                          : "Select a department"}
                      </option>

                      {departments.map(
                        (department) => (
                          <option
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {
                              department.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="positionId"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Position
                    </label>

                    <select
                      id="positionId"
                      required
                      value={
                        form.positionId ??
                        ""
                      }
                      onChange={
                        handlePositionChange
                      }
                      disabled={
                        isLoadingOptions ||
                        !form.departmentId
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">
                        {!form.departmentId
                          ? "Select a department first"
                          : filteredPositions.length ===
                              0
                            ? "No positions available"
                            : "Select a position"}
                      </option>

                      {filteredPositions.map(
                        (position) => (
                          <option
                            key={
                              position.id
                            }
                            value={
                              position.id
                            }
                          >
                            {position.title}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </section>

              <div className="mt-10 flex justify-end gap-3 border-t border-slate-200 pt-6">
                <Link
                  href="/dashboard/employees"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isLoadingOptions
                  }
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />

                  {isSubmitting
                    ? "Creating..."
                    : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
    </div>
  );
}