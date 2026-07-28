"use client";

import {
  Bell,
  Search,
} from "lucide-react";

import {
  usePathname,
} from "next/navigation";

interface HeaderProps {
  email: string;
  role: string;
}

interface PageInformation {
  title: string;
  subtitle: string;
}

function getPageInformation(
  pathname: string,
): PageInformation {
  if (
    pathname ===
    "/dashboard"
  ) {
    return {
      title:
        "Dashboard",

      subtitle:
        "Welcome back to your HR workspace",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/employees",
    )
  ) {
    return {
      title:
        "Employees",

      subtitle:
        "Create and manage employee records",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/departments",
    )
  ) {
    return {
      title:
        "Departments",

      subtitle:
        "Create and manage company departments",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/positions",
    )
  ) {
    return {
      title:
        "Positions",

      subtitle:
        "Create and manage employee job positions",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/payroll",
    )
  ) {
    return {
      title:
        "Payroll",

      subtitle:
        "Manage employee salary and payroll records",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/leave",
    )
  ) {
    return {
      title:
        "Leave",

      subtitle:
        "Manage leave balances and requests",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/attendance",
    )
  ) {
    return {
      title:
        "Attendance",

      subtitle:
        "Track check-in, check-out, and working time",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/performance",
    )
  ) {
    return {
      title:
        "Performance",

      subtitle:
        "Monitor employee performance and progress",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/announcements",
    )
  ) {
    return {
      title:
        "Announcements",

      subtitle:
        "Create and manage company announcements",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/recruitment",
    )
  ) {
    return {
      title:
        "Recruitment",

      subtitle:
        "Manage candidates and recruitment activities",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/cv",
    )
  ) {
    return {
      title:
        "CV Portal",

      subtitle:
        "Submit, analyze, and manage candidate CVs",
    };
  }

  if (
    pathname.startsWith(
      "/dashboard/settings",
    )
  ) {
    return {
      title:
        "Settings",

      subtitle:
        "Manage HR platform settings",
    };
  }

  return {
    title:
      "Dashboard",

    subtitle:
      "Welcome back to your HR workspace",
  };
}

export default function Header({
  email,
  role,
}: HeaderProps) {
  const pathname =
    usePathname();

  const pageInformation =
    getPageInformation(
      pathname,
    );

  const formattedRole = (
    role || "EMPLOYEE"
  ).replaceAll(
    "_",
    " ",
  );

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {
            pageInformation.title
          }
        </h2>

        <p className="text-sm text-slate-500">
          {
            pageInformation.subtitle
          }
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 md:flex">
          <Search
            size={17}
            className="text-slate-400"
          />

          <input
            type="search"
            placeholder="Search"
            className="w-44 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
        >
          <Bell size={18} />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">
            {email ||
              "admin@example.com"}
          </p>

          <p className="text-xs text-slate-500">
            {formattedRole}
          </p>
        </div>
      </div>
    </header>
  );
}