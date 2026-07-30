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

interface StoredUser {
  email: string;
  role: string;
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
    const token =
      window.localStorage.getItem(
        "accessToken",
      );

    const storedUserValue =
      window.localStorage.getItem(
        "authUser",
      );

    if (
      !token ||
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
        const parsedUser =
          JSON.parse(
            storedUser,
          ) as StoredUser;

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

          setError(
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

          if (!error) {
            setError(
              getErrorMessage(
                employeeResult.reason,
              ),
            );
          }
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          getErrorMessage(
            loadError,
          ),
        );

        setEmployeeCount(0);
        setAnnouncementCount(0);
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

  const dashboardCards =
    useMemo<DashboardCard[]>(
      () => [
        {
          title:
            "Total Employees",

          value:
            String(
              employeeCount,
            ),

          description:
            "Active employee records",

          icon:
            Users,

          href:
            "/dashboard/employees",
        },

        {
          title:
            "Pending Leave",

          value:
            "0",

          description:
            "Requests awaiting review",

          icon:
            CalendarCheck,

          href:
            "/dashboard/leave",
        },

        {
          title:
            "Payroll Status",

          value:
            "Draft",

          description:
            "Current payroll period",

          icon:
            CircleDollarSign,

          href:
            "/dashboard/payroll",
        },

        {
          title:
            "Announcements",

          value:
            String(
              announcementCount,
            ),

          description:
            "Published announcements",

          icon:
            Bell,

          href:
            "/dashboard/announcements",
        },
      ],
      [
        employeeCount,
        announcementCount,
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

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
                className="hr-card hr-card-hover group p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-[var(--brand-soft)] p-3 text-[var(--brand)] transition group-hover:scale-105">
                    <Icon
                      size={22}
                    />
                  </div>

                  <span className="hr-chip bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </div>

                <p className="mt-6 text-sm font-semibold text-[var(--ink-muted)]">
                  {card.title}
                </p>

                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
                  {card.value}
                </p>

                <p className="mt-2 text-sm text-[var(--ink-faint)]">
                  {
                    card.description
                  }
                </p>
              </Link>
            );
          },
        )}
      </section>

      <section>
        <article className="hr-card p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            Recent Activity
          </h2>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-5">
              <p className="text-sm font-semibold text-[var(--ink)]">
                Employee records
                available
              </p>

              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                There are currently{" "}
                {employeeCount} employee
                record
                {employeeCount === 1
                  ? ""
                  : "s"}{" "}
                in the system.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-5">
              <p className="text-sm font-semibold text-[var(--ink)]">
                Published
                announcements
              </p>

              <p className="mt-1 text-sm text-[var(--ink-muted)]">
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
      </section>
    </div>
  );
}