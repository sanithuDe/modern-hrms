"use client";

import {
    type ReactNode,
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";
import Shell from "../../src/components/layout/shell";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface StoredUser {
  id?: string;
  email: string;
  role:
    | "SUPER_ADMIN"
    | "HR_MANAGER"
    | "EMPLOYEE";
}

function isStoredUser(
  value: unknown,
): value is StoredUser {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const user =
    value as Partial<StoredUser>;

  const validRole =
    user.role === "SUPER_ADMIN" ||
    user.role === "HR_MANAGER" ||
    user.role === "EMPLOYEE";

  return (
    typeof user.email === "string" &&
    user.email.trim().length > 0 &&
    validRole
  );
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const accessToken =
      window.localStorage.getItem(
        "accessToken",
      );

    const storedUserValue =
      window.localStorage.getItem(
        "authUser",
      );

    if (
      !accessToken ||
      !storedUserValue
    ) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser: unknown =
        JSON.parse(
          storedUserValue,
        );

      if (!isStoredUser(parsedUser)) {
        throw new Error(
          "Invalid stored user",
        );
      }
    } catch {
      window.localStorage.removeItem(
        "accessToken",
      );

      window.localStorage.removeItem(
        "authUser",
      );

      router.replace("/login");
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return <Shell>{children}</Shell>;
}