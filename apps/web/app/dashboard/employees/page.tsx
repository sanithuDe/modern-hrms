"use client";

import axios from "axios";
import {
    Search,
    UserPlus,
} from "lucide-react";
import Link from "next/link";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getEmployees,
    type Employee,
} from "../../../src/services/employee.service";

function formatRole(
  role: string,
): string {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function getStatusClassName(
  status: string,
): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "SUSPENDED":
      return "bg-amber-50 text-amber-700";

    case "INACTIVE":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message;

    if (
      typeof message === "string"
    ) {
      return message;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load employees.";
}

export default function EmployeesPage() {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [search, setSearch] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadEmployees(): Promise<void> {
      try {
        setIsLoading(true);
        setError("");

        const result =
          await getEmployees();

        setEmployees(result);
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadEmployees();
  }, []);

  const filteredEmployees =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return employees;
      }

      return employees.filter(
        (employee) => {
          const searchableValue = [
            employee.firstName,
            employee.lastName,
            employee.employeeNumber,
            employee.user?.email,
            employee.user?.role,
            employee.department?.name,
            employee.position?.title,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableValue.includes(
            keyword,
          );
        },
      );
    }, [
      employees,
      search,
    ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Employees
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            View and manage employee
            accounts.
          </p>
        </div>

        <Link
          href="/dashboard/employees/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <UserPlus size={17} />
          Add Employee
        </Link>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search employees"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-900"
            />
          </div>

          <p className="text-sm text-slate-600">
            {filteredEmployees.length}{" "}
            employee(s)
          </p>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Loading employees...
          </div>
        ) : filteredEmployees.length ===
          0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            No employees found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    Number
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    Department
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    Position
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    Role
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map(
                  (employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-slate-200 last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-950">
                          {employee.firstName}{" "}
                          {employee.lastName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {employee.user
                            ?.email ??
                            "No email"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {
                          employee.employeeNumber
                        }
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {employee.department
                          ?.name ??
                          "Not assigned"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {employee.position
                          ?.title ??
                          "Not assigned"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatRole(
                          employee.user
                            ?.role ??
                            "EMPLOYEE",
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(
                            employee.user
                              ?.status ??
                              "ACTIVE",
                          )}`}
                        >
                          {employee.user
                            ?.status ??
                            "ACTIVE"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/employees/${employee.id}`}
                          className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </Link>
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
  );
}