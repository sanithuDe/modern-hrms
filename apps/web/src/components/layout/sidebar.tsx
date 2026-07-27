"use client";

import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  role: string;
}

const superAdminLinks = [
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
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const hrManagerLinks = superAdminLinks.filter(
  (item) =>
    item.label !== "Settings" &&
    item.label !== "Departments" &&
    item.label !== "Positions",
);

const employeeLinks = [
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
];

export default function Sidebar({ role }: SidebarProps) {
  const router = useRouter();

  const links =
    role === "SUPER_ADMIN"
      ? superAdminLinks
      : role === "HR_MANAGER"
        ? hrManagerLinks
        : employeeLinks;

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    router.push("/login");
  }

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-2xl font-bold">
          HR Platform
        </h1>

        <p className="mt-1 text-xs text-slate-400">
          Human Resource Management
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-300 transition hover:bg-red-950 hover:text-red-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}