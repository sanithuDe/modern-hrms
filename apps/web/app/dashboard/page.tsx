"use client";

import {
    Bell,
    CalendarCheck,
    CircleDollarSign,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Link from "next/link";
import Header from "../../src/components/layout/header";
import Sidebar from "../../src/components/layout/sidebar";
import { getEmployees } from "../../src/services/employee.service";

interface StoredUser {
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [employeeCount, setEmployeeCount] = useState(0);

 const dashboardCards = [
  {
    title: "Total Employees",
    value: String(employeeCount),
    description: "Active employees",
    icon: Users,
    href: "/dashboard/employees",
  },
  {
    title: "Pending Leave",
    value: "0",
    description: "Requests awaiting review",
    icon: CalendarCheck,
    href: "/dashboard/leave",
  },
  {
    title: "Payroll Status",
    value: "Draft",
    description: "Current payroll period",
    icon: CircleDollarSign,
    href: "/dashboard/payroll",
  },
  {
    title: "Announcements",
    value: "0",
    description: "Published announcements",
    icon: Bell,
    href: "/dashboard/announcements",
  },
];

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("authUser");

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as StoredUser;
      setUser(parsedUser);

      getEmployees()
        .then((employees) => {
          setEmployeeCount(employees.length);
        })
        .catch(() => {
          setEmployeeCount(0);
        });
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");
      router.replace("/login");
    }
  }, [router]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Loading dashboard...
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role={user.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          email={user.email}
          role={user.role}
        />

        <main className="flex-1 p-8">
          <section>
            <h1 className="text-3xl font-bold text-slate-900">
              Overview
            </h1>

            <p className="mt-2 text-slate-600">
              Review the latest HR activity and system information.
            </p>
          </section>

          <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
  key={card.title}
  href={card.href}
  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
>
                
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                      <Icon size={22} />
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
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Activity
              </h2>

              <div className="mt-6 rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-800">
                  Employee account created
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  The first employee account was added successfully.
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Quick Actions
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
  href="/dashboard/employees/new"
  className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
>
  Add Employee
</Link>

                <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700">
                  Create Announcement
                </button>

                <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700">
                  Review Leave
                </button>

                <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700">
                  View Payroll
                </button>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}