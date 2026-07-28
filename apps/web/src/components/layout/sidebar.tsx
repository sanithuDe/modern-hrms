"use client";

import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  FileSearch,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

interface SidebarProps {
  role: string;
}

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
}

const superAdminLinks: SidebarLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    label: "Departments",
    href: "/dashboard/departments",
    icon: Building2,
  },
  {
    label: "Positions",
    href: "/dashboard/positions",
    icon: BriefcaseBusiness,
  },
  {
    label: "Payroll",
    href: "/dashboard/payroll",
    icon: WalletCards,
  },
  {
    label: "Leave",
    href: "/dashboard/leave",
    icon: CalendarDays,
  },
  {
    label: "Attendance",
    href: "/dashboard/attendance",
    icon: UserRound,
  },
  {
    label: "Performance",
    href: "/dashboard/performance",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Announcements",
    href: "/dashboard/announcements",
    icon: Bell,
  },
  {
    label: "Recruitment",
    href: "/dashboard/recruitment",
    icon: FileText,
  },
  {
    label: "CV Portal",
    href: "/dashboard/cv",
    icon: FileSearch,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const hrManagerLinks: SidebarLink[] =
  superAdminLinks.filter(
    (item) =>
      item.label !== "Settings" &&
      item.label !== "Departments" &&
      item.label !== "Positions",
  );

const employeeLinks: SidebarLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Payroll",
    href: "/dashboard/payroll",
    icon: WalletCards,
  },
  {
    label: "My Leave",
    href: "/dashboard/leave",
    icon: CalendarDays,
  },
  {
    label: "My Attendance",
    href: "/dashboard/attendance",
    icon: UserRound,
  },
  {
    label: "My Performance",
    href: "/dashboard/performance",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Announcements",
    href: "/dashboard/announcements",
    icon: Bell,
  },
  {
    label: "CV Portal",
    href: "/dashboard/cv",
    icon: FileSearch,
  },
];

function getLinksByRole(
  role: string,
): SidebarLink[] {
  if (role === "SUPER_ADMIN") {
    return superAdminLinks;
  }

  if (role === "HR_MANAGER") {
    return hrManagerLinks;
  }

  return employeeLinks;
}

export default function Sidebar({
  role,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const links =
    getLinksByRole(role);

  function handleLogout(): void {
    window.localStorage.removeItem(
      "accessToken",
    );

    window.localStorage.removeItem(
      "authUser",
    );

    router.replace("/login");
  }

  function isActive(
    href: string,
  ): boolean {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(
      `${href}/`,
    ) || pathname === href;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-950 text-white lg:flex">
      <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-2xl font-bold">
          HR Platform
        </h1>

        <p className="mt-1 text-xs text-slate-400">
          Human Resource Management
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-1">
          {links.map((item) => {
            const Icon =
              item.icon;

            const active =
              isActive(
                item.href,
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex items-center gap-3 rounded-lg bg-slate-800 px-3 py-3 text-sm font-semibold text-white"
                    : "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                }
              >
                <Icon
                  size={18}
                  strokeWidth={1.8}
                />

                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={
            handleLogout
          }
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-300 transition hover:bg-red-950 hover:text-red-200"
        >
          <LogOut
            size={18}
            strokeWidth={1.8}
          />

          <span>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}