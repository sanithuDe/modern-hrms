"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import Header from "../../src/components/layout/header";
import Sidebar from "../../src/components/layout/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface StoredUser {
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const token =
      window.localStorage.getItem(
        "accessToken",
      );

    const storedUser =
      window.localStorage.getItem(
        "authUser",
      );

    if (!token || !storedUser) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    try {
      const parsedUser =
        JSON.parse(
          storedUser,
        ) as StoredUser;

      if (
        !parsedUser.email ||
        !parsedUser.role
      ) {
        throw new Error(
          "Invalid stored user",
        );
      }

      setUser(parsedUser);
    } catch {
      window.localStorage.removeItem(
        "accessToken",
      );

      window.localStorage.removeItem(
        "authUser",
      );

      setLoading(false);
      router.replace("/login");
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fa]">
        <p className="text-sm text-slate-600">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f6fa]">
      <Sidebar role={user.role} />

      <div className="min-h-screen lg:pl-64">
        <Header
          email={user.email}
          role={user.role}
        />

        <main className="min-h-[calc(100vh-80px)] px-7 py-7">
          {children}
        </main>
      </div>
    </div>
  );
}