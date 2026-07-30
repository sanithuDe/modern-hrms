"use client";

import { Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getEmployees,
    type Employee,
} from "../../../src/services/employee.service";

interface StoredUser {
  email: string;
  role: string;
}

function formatRole(role: string): string {
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

export default function EmployeesPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [search, setSearch] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
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

      if (
        parsedUser.role !== "SUPER_ADMIN" &&
        parsedUser.role !== "HR_MANAGER"
      ) {
        router.replace("/dashboard");
        return;
      }

      setUser(parsedUser);

      getEmployees()
        .then((data) => {
          setEmployees(data);
        })
        .catch((requestError: unknown) => {
          console.error(requestError);
          setError(
            "Unable to load employees.",
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
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

  const filteredEmployees =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      if (!keyword) {
        return employees;
      }

      return employees.filter(
        (employee) => {
          const fullName =
            `${employee.firstName} ${employee.lastName}`.toLowerCase();

          return (
            fullName.includes(keyword) ||
            employee.employeeNumber
              .toLowerCase()
              .includes(keyword) ||
            employee.user.email
              .toLowerCase()
              .includes(keyword) ||
            employee.department?.name
              .toLowerCase()
              .includes(keyword) ||
            employee.position?.title
              .toLowerCase()
              .includes(keyword)
          );
        },
      );
    }, [employees, search]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Loading employees...
        </p>
      </main>
    );
  }

  return (
    <div className="space-y-6">
          <div className="flex justify-end">
            <Link
              href="/dashboard/employees/new"
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
            >
              <UserPlus size={18} />
              Add Employee
            </Link>
          </div>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
              <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-300 px-4 py-3">
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
                  placeholder="Search employees"
                  className="w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <p className="text-sm text-slate-500">
                {filteredEmployees.length}{" "}
                employee(s)
              </p>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-slate-500">
                Loading employee records...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                {error}
              </div>
            ) : filteredEmployees.length ===
              0 ? (
              <div className="p-8 text-center text-slate-500">
                No employees found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">
                        Employee
                      </th>

                      <th className="px-6 py-4">
                        Number
                      </th>

                      <th className="px-6 py-4">
                        Department
                      </th>

                      <th className="px-6 py-4">
                        Position
                      </th>

                      <th className="px-6 py-4">
                        Role
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredEmployees.map(
                      (employee) => (
                        <tr
                          key={employee.id}
                          className="text-sm text-slate-700"
                        >
                          <td className="px-6 py-5">
                            <p className="font-medium text-slate-900">
                              {
                                employee.firstName
                              }{" "}
                              {
                                employee.lastName
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                employee.user
                                  .email
                              }
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            {
                              employee.employeeNumber
                            }
                          </td>

                          <td className="px-6 py-5">
                            {employee.department
                              ?.name ??
                              "Not assigned"}
                          </td>

                          <td className="px-6 py-5">
                            {employee.position
                              ?.title ??
                              "Not assigned"}
                          </td>

                          <td className="px-6 py-5">
                            {formatRole(
                              employee.user.role,
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClassName(
                                employee.user
                                  .status,
                              )}`}
                            >
                              {
                                employee.user
                                  .status
                              }
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <Link
                              href={`/dashboard/employees/${employee.id}`}
                              className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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