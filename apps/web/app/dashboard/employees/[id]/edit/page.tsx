"use client";

import axios from "axios";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import {
    useParams,
    useRouter,
} from "next/navigation";
import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    getEmployeeById,
    updateEmployee,
    type UpdateEmployeeInput,
    type UserRole,
} from "../../../../../src/services/employee.service";
import { sanitizePhoneDigits } from "../../../../../src/lib/phone";
import { DateField } from "../../../../../src/components/ui/DateTimeFields";
import { SelectField } from "../../../../../src/components/ui/SelectField";

interface StoredUser {
  email: string;
  role: UserRole;
}

interface EditEmployeeForm {
  firstName: string;
  lastName: string;
  phone: string;
  hireDate: string;
  departmentName: string;
  positionTitle: string;
  role: UserRole;
}

const initialForm: EditEmployeeForm = {
  firstName: "",
  lastName: "",
  phone: "",
  hireDate: "",
  departmentName: "",
  positionTitle: "",
  role: "EMPLOYEE",
};

function formatDateForInput(
  dateValue: string,
): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [form, setForm] =
    useState<EditEmployeeForm>(initialForm);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

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

      if (
        parsedUser.role !== "SUPER_ADMIN" &&
        parsedUser.role !== "HR_MANAGER"
      ) {
        router.replace("/dashboard");
        return;
      }

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

    async function loadPageData() {
      try {
        setIsLoading(true);
        setError("");

        const employeeData =
          await getEmployeeById(params.id);

        setForm({
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          phone: sanitizePhoneDigits(employeeData.phone ?? ""),
          hireDate: formatDateForInput(
            employeeData.hireDate,
          ),
          departmentName:
            employeeData.department?.name ?? "",
          positionTitle:
            employeeData.position?.title ?? "",
          role: employeeData.user.role,
        });
      } catch (requestError: unknown) {
        if (axios.isAxiosError(requestError)) {
          const message =
            requestError.response?.data?.message;

          setError(
            typeof message === "string"
              ? message
              : "Unable to load employee information.",
          );
        } else {
          setError(
            "Unable to load employee information.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadPageData();
  }, [params.id, user]);

  function updateTextField(
    field:
      | "firstName"
      | "lastName"
      | "phone"
      | "hireDate"
      | "departmentName"
      | "positionTitle",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleRoleChange(value: string) {
    setForm((current) => ({
      ...current,
      role: value as UserRole,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    if (!form.hireDate) {
      setError("Hire date is required.");
      return;
    }

    if (!form.departmentName.trim()) {
      setError("Please enter a department.");
      return;
    }

    if (!form.positionTitle.trim()) {
      setError("Please enter a position.");
      return;
    }

    const payload: UpdateEmployeeInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || null,
      hireDate: form.hireDate,
      departmentName: form.departmentName.trim(),
      positionTitle: form.positionTitle.trim(),
      ...(user?.role === "SUPER_ADMIN" && form.role !== "SUPER_ADMIN"
        ? { role: form.role }
        : {}),
    };

    try {
      setIsSubmitting(true);

      await updateEmployee(
        params.id,
        payload,
      );

      router.push(
        `/dashboard/employees/${params.id}`,
      );

      router.refresh();
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError)) {
        const message =
          requestError.response?.data?.message;

        setError(
          typeof message === "string"
            ? message
            : "Unable to update employee.",
        );
      } else {
        setError(
          "Unable to update employee.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Loading edit form...
        </p>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
            <Link
              href={`/dashboard/employees/${params.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back to employee
            </Link>

            {isLoading ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
                Loading employee information...
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
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
                        updateTextField(
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
                        updateTextField(
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
                      Phone
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
                        updateTextField(
                          "phone",
                          sanitizePhoneDigits(event.target.value),
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
                      updateTextField("hireDate", value)
                    }
                  />

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
                        updateTextField(
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
                        updateTextField(
                          "positionTitle",
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
                        disabled={form.role === "SUPER_ADMIN"}
                        options={[
                          {
                            value: "EMPLOYEE",
                            label: "Employee",
                          },
                          {
                            value: "HR_MANAGER",
                            label: "HR Manager",
                          },
                          ...(form.role === "SUPER_ADMIN"
                            ? [
                                {
                                  value: "SUPER_ADMIN",
                                  label: "Super Admin",
                                },
                              ]
                            : []),
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
                          value={
                            form.role === "HR_MANAGER"
                              ? "HR Manager"
                              : form.role === "SUPER_ADMIN"
                                ? "Super Admin"
                                : "Employee"
                          }
                          className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-900 outline-none"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          HR Managers cannot change account roles.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-10 flex justify-end gap-3 border-t border-slate-200 pt-6">
                  <Link
                    href={`/dashboard/employees/${params.id}`}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={17} />

                    {isSubmitting
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
    </div>
  );
}
