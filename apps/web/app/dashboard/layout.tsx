"use client";

import {
    useEffect,
    useState,
    type ReactNode,
} from "react";

import {
    usePathname,
    useRouter,
} from "next/navigation";

import Header from "../../src/components/layout/header";
import Sidebar from "../../src/components/layout/sidebar";

type UserRole =
  | "SUPER_ADMIN"
  | "HR_MANAGER"
  | "EMPLOYEE";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface StoredUser {
  id?: string;
  email: string;
  role: UserRole;
}

const employeeAllowedPaths = [
  "/dashboard",
  "/dashboard/payroll",
  "/dashboard/leave",
  "/dashboard/attendance",
  "/dashboard/performance",
  "/dashboard/announcements",
  "/dashboard/cv",
  "/dashboard/cv-portal",
];

const hrManagerBlockedPaths = [
  "/dashboard/settings",
];

function pathMatches(
  pathname: string,
  allowedPath: string,
): boolean {
  if (
    allowedPath === "/dashboard"
  ) {
    return (
      pathname ===
      "/dashboard"
    );
  }

  return (
    pathname === allowedPath ||
    pathname.startsWith(
      `${allowedPath}/`,
    )
  );
}

function canAccessPath(
  role: UserRole,
  pathname: string,
): boolean {
  if (
    role === "SUPER_ADMIN"
  ) {
    return true;
  }

  if (
    role === "HR_MANAGER"
  ) {
    return !hrManagerBlockedPaths.some(
      (blockedPath) =>
        pathMatches(
          pathname,
          blockedPath,
        ),
    );
  }

  return employeeAllowedPaths.some(
    (allowedPath) =>
      pathMatches(
        pathname,
        allowedPath,
      ),
  );
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const [user, setUser] =
    useState<StoredUser | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

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
      setUser(null);
      setLoading(false);
      router.replace(
        "/login",
      );

      return;
    }

    try {
      const parsedUser =
        JSON.parse(
          storedUserValue,
        ) as StoredUser;

      const validRoles: UserRole[] =
        [
          "SUPER_ADMIN",
          "HR_MANAGER",
          "EMPLOYEE",
        ];

      if (
        !parsedUser.email ||
        !parsedUser.role ||
        !validRoles.includes(
          parsedUser.role,
        )
      ) {
        throw new Error(
          "Invalid stored user",
        );
      }

      if (
        !canAccessPath(
          parsedUser.role,
          pathname,
        )
      ) {
        setUser(
          parsedUser,
        );

        setLoading(false);

        router.replace(
          "/dashboard",
        );

        return;
      }

      setUser(
        parsedUser,
      );

      setLoading(false);
    } catch {
      window.localStorage.removeItem(
        "accessToken",
      );

      window.localStorage.removeItem(
        "authUser",
      );

      setUser(null);
      setLoading(false);

      router.replace(
        "/login",
      );
    }
  }, [
    pathname,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fa]">
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
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f3f6fa]">
      <Sidebar role={user.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header email={user.email} role={user.role} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-7 lg:py-7">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}