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
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";

// Header and Sidebar are provided by the shared Shell layout

import {
    getDepartments,
    type Department,
} from "../../../../../src/services/department.service";

import {
    getEmployeeById,
    updateEmployee,
    type UpdateEmployeeInput,
    type UserRole,
} from "../../../../../src/services/employee.service";

import {
    getPositions,
    type Position,
} from "../../../../../src/services/position.service";

interface StoredUser {
  email: string;
  role: UserRole;
}

interface EditEmployeeForm {
  firstName: string;
  lastName: string;
  phone: string;
  hireDate: string;
  departmentId: string;
  positionId: string;
  role: UserRole;
}

const initialForm: EditEmployeeForm = {
  firstName: "",
  lastName: "",
  phone: "",
  hireDate: "",
  departmentId: "",
  positionId: "",
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

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [positions, setPositions] =
    useState<Position[]>([]);

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

        const [
          employeeData,
          departmentData,
          positionData,
        ] = await Promise.all([
          getEmployeeById(params.id),
          getDepartments(),
          getPositions(),
        ]);

        setDepartments(departmentData);
        setPositions(positionData);

        setForm({
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          phone: employeeData.phone ?? "",
          hireDate: formatDateForInput(
            employeeData.hireDate,
          ),
          departmentId:
            employeeData.departmentId ?? "",
          positionId:
            employeeData.positionId ?? "",
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

  const filteredPositions = useMemo(() => {
    if (!form.departmentId) {
      return [];
    }

    return positions.filter(
      (position) =>
        position.departmentId ===
        form.departmentId,
    );
  }, [positions, form.departmentId]);

  function updateTextField(
    field:
      | "firstName"
      | "lastName"
      | "phone"
      | "hireDate",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleRoleChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    setForm((current) => ({
      ...current,
      role: event.target.value as UserRole,
    }));
  }

  function handleDepartmentChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    setForm((current) => ({
      ...current,
      departmentId: event.target.value,
      positionId: "",
    }));
  }

  function handlePositionChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    setForm((current) => ({
      ...current,
      positionId: event.target.value,
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

    if (!form.departmentId) {
      setError("Please select a department.");
      return;
    }

    if (!form.positionId) {
      setError("Please select a position.");
      return;
    }

    const selectedPosition =
      positions.find(
        (position) =>
          position.id === form.positionId,
      );

    if (
      !selectedPosition ||
      selectedPosition.departmentId !==
        form.departmentId
    ) {
      setError(
        "The selected position does not belong to the selected department.",
      );
      return;
    }

    const payload: UpdateEmployeeInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || null,
      hireDate: form.hireDate,
      departmentId: form.departmentId,
      positionId: form.positionId,
      role: form.role,
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
        <p className="text-slate-600">Loading edit form...</p>
      </main>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
            <Link
              href={`/dashboard/employees/${params.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back to employee
            </Link>

            <div className="mt-5">
              <h1 className="text-3xl font-bold text-slate-900">
                Edit Employee
              </h1>

              <p className="mt-2 text-slate-600">
                Update employee and account
                information.
              </p>
            </div>

            {isLoading ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
                Loading employee information...
              </div>
            ) : (
              <form
                onSubmit={(event) => void handleSubmit(event)}
                className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
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
                      value={form.phone}
                      onChange={(event) =>
                        updateTextField(
                          "phone",
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
                        updateTextField(
                          "hireDate",
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
                      value={form.departmentId}
                      onChange={
                        handleDepartmentChange
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    >
                      <option value="">
                        Select a department
                      </option>

                      {departments.map(
                        (department) => (
                          <option
                            key={department.id}
                            value={department.id}
                          >
                            {department.name}
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
                      value={form.positionId}
                      onChange={
                        handlePositionChange
                      }
                      disabled={!form.departmentId}
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
                            key={position.id}
                            value={position.id}
                          >
                            {position.title}
                          </option>
                        ),
                      )}
                    </select>
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
                      onChange={handleRoleChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    >
                      <option value="EMPLOYEE">
                        Employee
                      </option>

                      <option value="HR_MANAGER">
                        HR Manager
                      </option>

                      {user.role === "SUPER_ADMIN" && (
                        <option value="SUPER_ADMIN">
                          Super Admin
                        </option>
                      )}
                    </select>
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
    </div>
  );
}