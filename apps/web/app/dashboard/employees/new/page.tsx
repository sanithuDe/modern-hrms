"use client";

import axios from "axios";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  createEmployee,
  type UserRole,
} from "../../../../src/services/employee.service";
import { sanitizePhoneDigits } from "../../../../src/lib/phone";
import { DateField } from "../../../../src/components/ui/DateTimeFields";
import { SelectField } from "../../../../src/components/ui/SelectField";

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
  departmentName: string;
  positionTitle: string;
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
  departmentName: "",
  positionTitle: "",
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

  function updateField(
    field:
      | "email"
      | "password"
      | "employeeNumber"
      | "firstName"
      | "lastName"
      | "phone"
      | "hireDate"
      | "departmentName"
      | "positionTitle",
    value: string,
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleRoleChange(value: string): void {
    const selectedRole = value as CreatableUserRole;

    setForm((current) => ({
      ...current,
      role: selectedRole,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!user) {
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

    if (!form.departmentName.trim()) {
      setError(
        "Please enter a department.",
      );

      return;
    }

    if (!form.positionTitle.trim()) {
      setError(
        "Please enter a position.",
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
        role:
          user.role === "HR_MANAGER"
            ? "EMPLOYEE"
            : form.role,
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
        departmentName:
          form.departmentName.trim(),
        positionTitle:
          form.positionTitle.trim(),
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
        <p className="text-slate-600">
          Loading employee form...
        </p>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
            <Link
              href="/dashboard/employees"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back to employees
            </Link>

            <form
              onSubmit={handleSubmit}
              className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
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
                    {user.role === "SUPER_ADMIN" ? (
                      <SelectField
                        label="Role"
                        value={form.role}
                        onChange={handleRoleChange}
                        options={[
                          {
                            value: "EMPLOYEE",
                            label: "Employee",
                          },
                          {
                            value: "HR_MANAGER",
                            label: "HR Manager",
                          },
                        ]}
                      />
                    ) : (
                      <>
                        <label
                          htmlFor="role"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Role
                        </label>
                        <input
                          id="role"
                          type="text"
                          readOnly
                          value="Employee"
                          className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-900 outline-none"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          HR Managers can only create Employee accounts.
                        </p>
                      </>
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

                  <DateField
                    label="Hire date"
                    required
                    value={form.hireDate}
                    onChange={(value) =>
                      updateField("hireDate", value)
                    }
                  />

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
                      inputMode="numeric"
                      autoComplete="tel"
                      pattern="[0-9]*"
                      maxLength={15}
                      placeholder="Digits only"
                      value={form.phone}
                      onChange={(event) =>
                        updateField(
                          "phone",
                          sanitizePhoneDigits(event.target.value),
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="departmentName"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Department
                    </label>

                    <input
                      id="departmentName"
                      type="text"
                      required
                      placeholder="e.g. Security"
                      value={form.departmentName}
                      onChange={(event) =>
                        updateField(
                          "departmentName",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="positionTitle"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Position
                    </label>

                    <input
                      id="positionTitle"
                      type="text"
                      required
                      placeholder="e.g. Security Engineer"
                      value={form.positionTitle}
                      onChange={(event) =>
                        updateField(
                          "positionTitle",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    />
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
                  disabled={isSubmitting}
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
  );
}