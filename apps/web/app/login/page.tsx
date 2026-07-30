"use client";

import {
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { login } from "../../src/services/auth.service";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const result = await login({
        email,
        password,
      });

      localStorage.setItem(
        "accessToken",
        result.data.accessToken,
      );

      localStorage.setItem(
        "authUser",
        JSON.stringify(result.data.user),
      );

      router.push("/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Full-bleed brand atmosphere — first thing visitors see */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#041f22_0%,#062c2f_22%,#083538_48%,#0c4a4e_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-8 lg:px-10">
        {/* Hero brand — dominant first signal */}
        <div className="mb-8 text-center lg:mb-10 lg:text-left">
          <Image
            src="/wrdn-option-c.png"
            alt="WRDN HR System"
            width={360}
            height={108}
            priority
            className="mx-auto mb-3 h-auto w-[210px] sm:w-[250px] lg:mx-0 lg:w-[300px]"
          />
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-teal-50/75 lg:mx-0">
            Sign in to your secure people-operations workspace.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-[32px] border border-white/20 bg-white/95 shadow-[0_40px_100px_rgb(0_0_0/35%)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(165deg,#062c2f_0%,#083538_45%,#0c4a4e_100%)] p-10 text-white lg:flex xl:p-12">
            <div className="pointer-events-none absolute -right-10 top-10 h-48 w-48 rounded-full bg-teal-300/15 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-50/90">
                <ShieldCheck className="h-3.5 w-3.5" />
                Trusted workplace access
              </div>

              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.22em] text-teal-100/70">
                HR Platform
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.15] tracking-tight text-white xl:text-[2.75rem]">
                People operations,
                <br />
                refined for teams.
              </h2>
            </div>

            <div className="relative space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-teal-100" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Role-based security
                  </p>
                  <p className="mt-1 text-xs leading-5 text-teal-50/75">
                    Separate access for Super Admin, HR Manager, and Employee.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-100" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Intelligent hiring support
                  </p>
                  <p className="mt-1 text-xs leading-5 text-teal-50/75">
                    CV analysis, match scores, and clear hiring stages.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center p-8 sm:p-10 xl:p-12">
            <div className="mb-8">
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)]">
                Sign in
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                Enter your credentials to open WRDN HR System.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="hr-label">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="hr-input"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="mb-0 block text-sm font-semibold text-[rgb(15_28_30/78%)]">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="hr-input"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error ? (
                <p className="rounded-[var(--radius-md)] border border-red-200 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="hr-btn-primary w-full py-3.5 text-[15px]"
              >
                {isLoading ? "Signing you in..." : "Sign in to WRDN"}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
              <p className="text-xs leading-5 text-[var(--ink-muted)]">
                Authorized personnel only. Activity may be monitored for
                security and compliance.
              </p>
            </div>

            <p className="mt-6 text-center text-xs leading-6 text-[var(--ink-muted)]">
              By signing in, you agree to our{" "}
              <Link
                href="/terms-and-conditions"
                className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
              >
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>
              .{" "}
              <Link
                href="/contact-us"
                className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
              >
                Contact Us
              </Link>
            </p>
          </section>
        </div>

        <p className="mt-6 text-center text-[11px] font-medium tracking-wide text-white/50">
          © {new Date().getFullYear()} WRDN HR System · All rights reserved
        </p>
      </div>
    </main>
  );
}
