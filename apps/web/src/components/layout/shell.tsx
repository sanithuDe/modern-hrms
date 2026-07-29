"use client";

import type { ReactNode } from "react";

import Header from "./header";
import Sidebar from "./sidebar";

interface ShellProps {
  children: ReactNode;
}

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem("authUser");

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return {
      email: parsed?.email ?? "",
      role: parsed?.role ?? "EMPLOYEE",
    };
  } catch {
    return null;
  }
}

export default function Shell({ children }: ShellProps) {
  const storedUser = getStoredUser();

  const email = storedUser?.email ?? "";
  const role = storedUser?.role ?? "EMPLOYEE";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header email={email} role={role} />

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
