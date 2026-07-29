"use client";

import {
    BarChart3,
    Bell,
    CalendarCheck,
    CalendarClock,
    CircleDollarSign,
    FileSearch,
    LayoutDashboard,
    LogOut,
    UserRound,
    Users,
} from "lucide-react";

import Link from "next/link";

import {
    usePathname,
    useRouter,
} from "next/navigation";

interface SidebarProps {
  role: string;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      "SUPER_ADMIN",
      "HR_MANAGER",
      "EMPLOYEE",
    ],
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: Users,
    roles: [
      "SUPER_ADMIN",
      "HR_MANAGER",
    ],
  },
  {
    label: "Shift Assignments",
    href:
      "/dashboard/shift-assignments",
    icon: CalendarClock,
    roles: [
      "HR_MANAGER",
    ],
  },
  {
    label: "Payroll",
    href: "/dashboard/payroll",
    icon: CircleDollarSign,
    roles: [
      "SUPER_ADMIN",
      "HR_MANAGER",
    ],
  },
  {
    label: "My Payroll",
    href: "/dashboard/payroll",
    icon: CircleDollarSign,
    roles: [
      "EMPLOYEE",
    ],
  },
  {
    label: "Leave",
    href: "/dashboard/leave",
    icon: CalendarCheck,
    roles: [
      "SUPER_ADMIN",
      "HR_MANAGER",
      "EMPLOYEE",
    ],
  },
  {
    label: "Attendance",
    href: "/dashboard/attendance",
    icon: UserRound,
    roles: [
      "SUPER_ADMIN",
      "HR_MANAGER",
      "EMPLOYEE",
    ],
  },
  {
    label: "Performance",
    href: "/dashboard/performance",
    icon: BarChart3,
    roles: [
      "SUPER_ADMIN",
      "HR_MANAGER",
      "EMPLOYEE",
    ],
  },
  {
    label: "Announcements",
    href:
      "/dashboard/announcements",
    icon: Bell,
    roles: [
      "SUPER_ADMIN",
      "HR_MANAGER",
      "EMPLOYEE",
    ],
  },
  {
    label: "Recruitment",
    href:
      "/dashboard/recruitment",
    icon: FileSearch,
    roles: [
      "SUPER_ADMIN",
      "HR_MANAGER",
    ],
  },
  {
    label: "CV Portal",
    href: "/dashboard/cv-portal",
    icon: FileSearch,
    roles: [
      "SUPER_ADMIN",
      "HR_MANAGER",
      "EMPLOYEE",
    ],
  },
];

function normalizeRole(
  role: string,
): string {
  return role
    .trim()
    .toUpperCase();
}

function isActivePath(
  pathname: string,
  href: string,
): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

export default function Sidebar({
  role,
}: SidebarProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const normalizedRole =
    normalizeRole(role);

  const visibleItems =
    navigationItems.filter(
      (item) =>
        item.roles.includes(
          normalizedRole,
        ),
    );

  function handleLogout(): void {
    window.localStorage.removeItem(
      "accessToken",
    );

    window.localStorage.removeItem(
      "authUser",
    );

    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col bg-[#030617] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/dashboard"
          className="block"
        >
          <h1 className="text-xl font-bold">
            HR Platform
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Human Resource Management
          </p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {visibleItems.map(
          (item) => {
            const Icon =
              item.icon;

            const active =
              isActivePath(
                pathname,
                item.href,
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
                  active
                    ? "bg-slate-700/70 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span>
                  {item.label}
                </span>
              </Link>
            );
          },
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 space-y-1 px-3">
          <Link
            href="/privacy-policy"
            className="block text-xs text-slate-400 transition hover:text-white"
          >
            Privacy Policy
          </Link>

          <Link
            href="/terms-and-conditions"
            className="block text-xs text-slate-400 transition hover:text-white"
          >
            Terms &amp; Conditions
          </Link>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-4 w-4 shrink-0" />

          <span>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}