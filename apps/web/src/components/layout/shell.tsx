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
    <div className="flex min-h-screen">
      <Sidebar role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header email={email} role={role} />

        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
