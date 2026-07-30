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
import Image from "next/image";

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
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: Users,
    roles: ["SUPER_ADMIN", "HR_MANAGER"],
  },
  {
    label: "Shift Assignments",
    href: "/dashboard/shift-assignments",
    icon: CalendarClock,
    roles: ["SUPER_ADMIN", "HR_MANAGER"],
  },
  {
    label: "Payroll",
    href: "/dashboard/payroll",
    icon: CircleDollarSign,
    roles: ["SUPER_ADMIN", "HR_MANAGER"],
  },
  {
    label: "My Payroll",
    href: "/dashboard/payroll",
    icon: CircleDollarSign,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Leave",
    href: "/dashboard/leave",
    icon: CalendarCheck,
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Attendance",
    href: "/dashboard/attendance",
    icon: UserRound,
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Performance",
    href: "/dashboard/performance",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Announcements",
    href: "/dashboard/announcements",
    icon: Bell,
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Recruitment",
    href: "/dashboard/recruitment",
    icon: FileSearch,
    roles: ["SUPER_ADMIN", "HR_MANAGER"],
  },
  {
    label: "CV Portal",
    href: "/dashboard/cv",
    icon: FileSearch,
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
];

function normalizeRole(role: string): string {
  return role.trim().toUpperCase();
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function cvPortalHref(role: string): string {
  return normalizeRole(role) === "EMPLOYEE"
    ? "/dashboard/cv-portal"
    : "/dashboard/cv";
}

function isCvPortalActive(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard/cv-portal") ||
    pathname.startsWith("/dashboard/cv")
  );
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const normalizedRole = normalizeRole(role);

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(normalizedRole),
  );

  function handleLogout(): void {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("authUser");
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 z-40 flex h-[var(--ui-vh)] w-[248px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,#083538_0%,#0c4a4e_48%,#0a3d40_100%)] text-white shadow-[8px_0_32px_rgb(8_53_56/18%)]">
      <div className="relative border-b border-white/10 px-4 py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgb(26_138_125/35%),transparent_55%)]" />
        <Link href="/dashboard" className="relative block">
          <Image
            src="/wrdn-option-c.png"
            alt="WRDN HR System"
            width={480}
            height={144}
            priority
            className="h-auto w-[210px] max-w-full"
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const href =
            item.label === "CV Portal"
              ? cvPortalHref(normalizedRole)
              : item.href;
          const active =
            item.label === "CV Portal"
              ? isCvPortalActive(pathname)
              : isActivePath(pathname, href);

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={href}
              className={[
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                active
                  ? "bg-white text-[var(--brand-dark)] shadow-lg shadow-black/10"
                  : "text-teal-50/80 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-lg transition",
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "bg-white/5 text-teal-100/80 group-hover:bg-white/10",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 space-y-1 px-3">
          <Link
            href="/contact-us"
            className="block text-xs text-teal-100/60 transition hover:text-white"
          >
            Contact Us
          </Link>
          <Link
            href="/privacy-policy"
            className="block text-xs text-teal-100/60 transition hover:text-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-and-conditions"
            className="block text-xs text-teal-100/60 transition hover:text-white"
          >
            Terms &amp; Conditions
          </Link>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 hover:text-rose-100"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
