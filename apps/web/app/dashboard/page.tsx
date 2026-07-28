"use client";

import {
  Bell,
  CalendarCheck,
  CircleDollarSign,
  Users,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAnnouncements,
} from "../../src/services/announcement.service";

import {
  getEmployees,
} from "../../src/services/employee.service";

type UserRole =
  | "SUPER_ADMIN"
  | "HR_MANAGER"
  | "EMPLOYEE";

interface StoredUser {
  email: string;
  role: UserRole;
}

interface DashboardCard {
  title: string;
  value: string;
  description: string;
  href: string;
  icon: typeof Users;
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const responseError =
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

    const message =
      responseError.response?.data
        ?.message;

    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load dashboard information";
}

function isUserRole(
  value: unknown,
): value is UserRole {
  return (
    value === "SUPER_ADMIN" ||
    value === "HR_MANAGER" ||
    value === "EMPLOYEE"
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(
      null,
    );

  const [
    employeeCount,
    setEmployeeCount,
  ] = useState(0);

  const [
    announcementCount,
    setAnnouncementCount,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const accessToken =
      window.localStorage.getItem(
        "accessToken",
      );

    const storedUserValue =
      window.localStorage.getItem(
        "authUser",
      );

    if (
      !accessToken ||
      !storedUserValue
    ) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    let isMounted = true;

    async function loadDashboard(
      storedUser: string,
    ): Promise<void> {
      try {
        const parsedValue: unknown =
          JSON.parse(
            storedUser,
          );

        if (
          typeof parsedValue !==
            "object" ||
          parsedValue === null
        ) {
          throw new Error(
            "Invalid stored user information",
          );
        }

        const possibleUser =
          parsedValue as {
            email?: unknown;
            role?: unknown;
          };

        if (
          typeof possibleUser.email !==
            "string" ||
          !possibleUser.email.trim() ||
          !isUserRole(
            possibleUser.role,
          )
        ) {
          throw new Error(
            "Invalid stored user information",
          );
        }

        const parsedUser: StoredUser =
          {
            email:
              possibleUser.email,
            role:
              possibleUser.role,
          };

        if (!isMounted) {
          return;
        }

        setUser(parsedUser);
        setError("");

        const canViewEmployees =
          parsedUser.role ===
            "SUPER_ADMIN" ||
          parsedUser.role ===
            "HR_MANAGER";

        const announcementPromise =
          getAnnouncements();

        const employeePromise =
          canViewEmployees
            ? getEmployees()
            : Promise.resolve([]);

        const [
          announcementResult,
          employeeResult,
        ] =
          await Promise.allSettled([
            announcementPromise,
            employeePromise,
          ]);

        if (!isMounted) {
          return;
        }

        const errorMessages: string[] =
          [];

        if (
          announcementResult.status ===
          "fulfilled"
        ) {
          const publishedCount =
            announcementResult.value.filter(
              (announcement) =>
                announcement.status ===
                "PUBLISHED",
            ).length;

          setAnnouncementCount(
            publishedCount,
          );
        } else {
          setAnnouncementCount(0);

          errorMessages.push(
            getErrorMessage(
              announcementResult.reason,
            ),
          );
        }

        if (
          employeeResult.status ===
          "fulfilled"
        ) {
          setEmployeeCount(
            employeeResult.value.length,
          );
        } else {
          setEmployeeCount(0);

          errorMessages.push(
            getErrorMessage(
              employeeResult.reason,
            ),
          );
        }

        setError(
          errorMessages.join(" "),
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setUser(null);
        setEmployeeCount(0);
        setAnnouncementCount(0);

        setError(
          getErrorMessage(
            loadError,
          ),
        );

        window.localStorage.removeItem(
          "accessToken",
        );

        window.localStorage.removeItem(
          "authUser",
        );

        router.replace("/login");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard(
      storedUserValue,
    );

    return () => {
      isMounted = false;
    };
  }, [router]);

  const canManageEmployees =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_MANAGER";

  const canManagePayroll =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_MANAGER";

  const dashboardCards =
    useMemo<DashboardCard[]>(
      () => [
        {
          title:
            canManageEmployees
              ? "Total Employees"
              : "Employee Profile",

          value:
            canManageEmployees
              ? String(
                  employeeCount,
                )
              : "View",

          description:
            canManageEmployees
              ? "Active employee records"
              : "View your employee information",

          icon: Users,

          href:
            canManageEmployees
              ? "/dashboard/employees"
              : "/dashboard",
        },

        {
          title: "Pending Leave",

          value: "0",

          description:
            canManageEmployees
              ? "Requests awaiting review"
              : "Your pending leave requests",

          icon: CalendarCheck,

          href: "/dashboard/leave",
        },

        {
          title:
            canManagePayroll
              ? "Payroll Status"
              : "My Payroll",

          value:
            canManagePayroll
              ? "Draft"
              : "View",

          description:
            canManagePayroll
              ? "Current payroll period"
              : "View your payroll records",

          icon: CircleDollarSign,

          href: "/dashboard/payroll",
        },

        {
          title: "Announcements",

          value: String(
            announcementCount,
          ),

          description:
            "Published announcements",

          icon: Bell,

          href:
            "/dashboard/announcements",
        },
      ],
      [
        announcementCount,
        canManageEmployees,
        canManagePayroll,
        employeeCount,
      ],
    );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          User information could not be
          loaded. Please log in again.
        </div>
      </div>
    );
  }

  const formattedRole =
    user.role.replaceAll(
      "_",
      " ",
    );

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">
          Overview
        </h1>

        <p className="mt-2 text-slate-600">
          Signed in as{" "}
          <span className="font-medium text-slate-800">
            {formattedRole}
          </span>
          . Review the latest HR activity
          and system information.
        </p>
      </section>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map(
          (card) => {
            const Icon =
              card.icon;

            return (
              <Link
                key={
                  card.title
                }
                href={
                  card.href
                }
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                    <Icon
                      size={22}
                    />
                  </div>

                  <span className="text-xs font-medium text-emerald-600">
                    Active
                  </span>
                </div>

                <p className="mt-6 text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {card.value}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {
                    card.description
                  }
                </p>
              </Link>
            );
          },
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Activity
          </h2>

          <div className="mt-6 space-y-3">
            {canManageEmployees ? (
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-800">
                  Employee records
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  There are currently{" "}
                  {employeeCount} employee
                  record
                  {employeeCount === 1
                    ? ""
                    : "s"}{" "}
                  in the system.
                </p>
              </div>
            ) : null}

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-800">
                Published
                announcements
              </p>

              <p className="mt-1 text-sm text-slate-500">
                There{" "}
                {announcementCount === 1
                  ? "is"
                  : "are"}{" "}
                currently{" "}
                {announcementCount} published
                announcement
                {announcementCount === 1
                  ? ""
                  : "s"}
                .
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {canManageEmployees ? (
              <Link
                href="/dashboard/employees/new"
                className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Add Employee
              </Link>
            ) : null}

            <Link
              href="/dashboard/announcements"
              className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {canManageEmployees
                ? "Create Announcement"
                : "View Announcements"}
            </Link>

            <Link
              href="/dashboard/leave"
              className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {canManageEmployees
                ? "Review Leave"
                : "My Leave"}
            </Link>

            <Link
              href="/dashboard/payroll"
              className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {canManagePayroll
                ? "View Payroll"
                : "My Payroll"}
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}