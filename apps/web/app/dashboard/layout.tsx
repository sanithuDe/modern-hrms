"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import Header from "../../src/components/layout/header";
import Sidebar from "../../src/components/layout/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface StoredUser {
  email?: string;
  role?: string;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [email, setEmail] = useState(
    "admin@example.com",
  );

  const [role, setRole] = useState(
    "EMPLOYEE",
  );

  useEffect(() => {
    const storedUser =
      window.localStorage.getItem(
        "authUser",
      );

    if (!storedUser) {
      return;
    }

    try {
      const user = JSON.parse(
        storedUser,
      ) as StoredUser;

      if (user.email) {
        setEmail(user.email);
      }

      if (user.role) {
        setRole(user.role);
      }
    } catch {
      setEmail("admin@example.com");
      setRole("EMPLOYEE");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f6fa]">
      <Sidebar role={role} />

      <div className="min-h-screen lg:pl-64">
        <Header
          email={email}
          role={role}
        />

        <main className="min-h-[calc(100vh-80px)] px-7 py-7">
          {children}
        </main>
      </div>
    </div>
  );
}