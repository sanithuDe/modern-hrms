"use client";

import {
  Bell,
  Search,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

interface HeaderProps {
  email: string;
  role: string;
}

interface PageInformation {
  title: string;
  subtitle: string;
}

interface SearchDestination {
  label: string;
  href: string;
  keywords: string[];
  roles: string[];
}

const SEARCH_DESTINATIONS: SearchDestination[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    keywords: ["dashboard", "home", "overview"],
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    keywords: ["employees", "employee", "staff", "people"],
    roles: ["SUPER_ADMIN", "HR_MANAGER"],
  },
  {
    label: "Shift Assignments",
    href: "/dashboard/shift-assignments",
    keywords: ["shift", "shifts", "assignment", "roster"],
    roles: ["SUPER_ADMIN", "HR_MANAGER"],
  },
  {
    label: "Payroll",
    href: "/dashboard/payroll",
    keywords: ["payroll", "salary", "pay", "wages"],
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Leave",
    href: "/dashboard/leave",
    keywords: ["leave", "vacation", "holiday", "time off"],
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Attendance",
    href: "/dashboard/attendance",
    keywords: ["attendance", "check in", "check-in", "checkout", "punch"],
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Performance",
    href: "/dashboard/performance",
    keywords: ["performance", "review", "appraisal", "score"],
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Announcements",
    href: "/dashboard/announcements",
    keywords: ["announcements", "announcement", "news", "notice", "notification"],
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Recruitment",
    href: "/dashboard/recruitment",
    keywords: ["recruitment", "hiring", "jobs", "candidates", "vacancy"],
    roles: ["SUPER_ADMIN", "HR_MANAGER"],
  },
  {
    label: "CV Portal",
    href: "/dashboard/cv",
    keywords: ["cv", "resume", "portal", "apply", "application"],
    roles: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"],
  },
];

function normalizeRole(role: string): string {
  return role.trim().toUpperCase();
}

function resolveSearchHref(
  item: (typeof SEARCH_DESTINATIONS)[number],
  role: string,
): string {
  if (item.label === "CV Portal" && normalizeRole(role) === "EMPLOYEE") {
    return "/dashboard/cv-portal";
  }

  if (
    item.label === "Attendance" &&
    normalizeRole(role) !== "EMPLOYEE"
  ) {
    return "/dashboard/attendance/manage";
  }

  return item.href;
}

function getPageInformation(
  pathname: string,
  role?: string,
): PageInformation {
  if (pathname === "/dashboard") {
    return {
      title: "Overview",
      subtitle: "People, attendance, payroll and leave at a glance",
    };
  }

  if (pathname === "/dashboard/employees/new") {
    return {
      title: "Add Employee",
      subtitle: "Create a user account and employee profile",
    };
  }

  if (
    pathname.startsWith("/dashboard/employees/") &&
    pathname.endsWith("/edit")
  ) {
    return {
      title: "Edit Employee",
      subtitle: "Update employee and account information",
    };
  }

  if (pathname.startsWith("/dashboard/employees/")) {
    return {
      title: "Employee Details",
      subtitle: "View and manage this employee record",
    };
  }

  if (pathname.startsWith("/dashboard/employees")) {
    return {
      title: "Employees",
      subtitle: "Create and manage employee records",
    };
  }

  if (pathname.startsWith("/dashboard/departments")) {
    return {
      title: "Departments",
      subtitle: "Create and manage company departments",
    };
  }

  if (pathname.startsWith("/dashboard/positions")) {
    return {
      title: "Positions",
      subtitle: "Create and manage employee job positions",
    };
  }

  if (pathname.startsWith("/dashboard/shift-assignments")) {
    return {
      title: "Shift Assignments",
      subtitle: "Assign and manage employee shifts",
    };
  }

  if (pathname.startsWith("/dashboard/payroll")) {
    const isEmployee = normalizeRole(role || "") === "EMPLOYEE";
    return {
      title: isEmployee ? "My Payroll" : "Payroll",
      subtitle: isEmployee
        ? "View your monthly salary and payroll history"
        : "Manage employee salary and payroll records",
    };
  }

  if (pathname.startsWith("/dashboard/leave")) {
    return {
      title: "Leave",
      subtitle: "Manage leave balances and requests",
    };
  }

  if (pathname.startsWith("/dashboard/attendance/manage")) {
    return {
      title: "Attendance",
      subtitle: "View and filter employee attendance history",
    };
  }

  if (pathname.startsWith("/dashboard/attendance")) {
    return {
      title: "Attendance",
      subtitle:
        role && normalizeRole(role) !== "EMPLOYEE"
          ? "View and filter employee attendance history"
          : "Track your check-in, check-out, and working time",
    };
  }

  if (pathname.startsWith("/dashboard/performance")) {
    return {
      title: "Performance",
      subtitle: "Monitor employee performance and progress",
    };
  }

  if (pathname.startsWith("/dashboard/announcements")) {
    return {
      title: "Announcements",
      subtitle: "Create and manage company announcements",
    };
  }

  if (pathname.startsWith("/dashboard/recruitment")) {
    return {
      title: "Recruitment",
      subtitle: "Manage candidates and recruitment activities",
    };
  }

  if (
    pathname.startsWith("/dashboard/cv") ||
    pathname.startsWith("/dashboard/cv-portal")
  ) {
    return {
      title: "CV Portal",
      subtitle: "Submit, analyze, and manage candidate CVs",
    };
  }

  if (pathname.startsWith("/dashboard/settings")) {
    return {
      title: "Settings",
      subtitle: "Manage HR platform settings",
    };
  }

  return {
    title: "Overview",
    subtitle: "People, attendance, payroll and leave at a glance",
  };
}

export default function Header({
  email,
  role,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pageInformation = getPageInformation(pathname, role);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const normalizedRole = normalizeRole(role || "EMPLOYEE");

  const formattedRole = (role || "EMPLOYEE").replaceAll("_", " ");
  const initials = (email || "HR")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  const availableDestinations = useMemo(
    () =>
      SEARCH_DESTINATIONS.filter((item) =>
        item.roles.includes(normalizedRole),
      ),
    [normalizedRole],
  );

  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      return availableDestinations.slice(0, 6);
    }

    return availableDestinations.filter((item) => {
      const haystack = [item.label, ...item.keywords]
        .join(" ")
        .toLowerCase();

      return haystack.includes(trimmed);
    });
  }, [availableDestinations, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function goTo(href: string) {
    setQuery("");
    setOpen(false);
    router.push(href);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (matches.length === 0) {
      return;
    }

    const selected =
      matches[Math.min(activeIndex, matches.length - 1)] ?? matches[0];

    goTo(resolveSearchHref(selected, normalizedRole));
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        matches.length === 0 ? 0 : (current + 1) % matches.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        matches.length === 0
          ? 0
          : (current - 1 + matches.length) % matches.length,
      );
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/80 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
      <div className="flex w-full items-center justify-between gap-4 py-4">
        <div className="min-w-0 shrink">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-mid)]">
            Workspace
          </p>
          <h2 className="mt-0.5 truncate font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--ink)] sm:text-2xl">
            {pageInformation.title}
          </h2>
          <p className="mt-0.5 hidden max-w-md truncate text-sm text-[var(--ink-muted)] sm:block">
            {pageInformation.subtitle}
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div ref={searchRef} className="relative hidden md:block">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--canvas)] px-3.5 py-2.5"
            >
              <Search size={16} className="shrink-0 text-[var(--ink-faint)]" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search pages (leave, payroll…)"
                className="w-44 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] lg:w-56"
                aria-label="Search workspace pages"
                aria-expanded={open}
                aria-controls="workspace-search-results"
                autoComplete="off"
              />
            </form>

            {open ? (
              <div
                id="workspace-search-results"
                className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-elevated)]"
              >
                {matches.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-[var(--ink-muted)]">
                    No matching page found.
                  </p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {matches.map((item, index) => (
                      <li key={item.href}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() =>
                            goTo(resolveSearchHref(item, normalizedRole))
                          }
                          className={[
                            "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition",
                            index === activeIndex
                              ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                              : "text-[var(--ink)] hover:bg-[var(--canvas)]",
                          ].join(" ")}
                        >
                          <span className="font-semibold">{item.label}</span>
                          <span className="text-xs text-[var(--ink-faint)]">
                            Open
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Open announcements"
            title="Announcements"
            onClick={() => router.push("/dashboard/announcements")}
            className="rounded-full border border-[var(--line)] bg-white p-2.5 text-[var(--ink-muted)] transition hover:border-[var(--brand-mid)] hover:text-[var(--brand)]"
          >
            <Bell size={17} />
          </button>

          <div className="flex items-center gap-3 rounded-full border border-[var(--line)] bg-white py-1.5 pl-1.5 pr-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand-mid),var(--brand-dark))] text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-[160px] truncate text-sm font-semibold text-[var(--ink)]">
                {email || "admin@example.com"}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                {formattedRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
