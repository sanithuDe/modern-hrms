"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { forgotPassword } from "../../src/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setResetLink("");
    setIsLoading(true);

    try {
      const result = await forgotPassword(email.trim());
      setSuccess(result.message || result.data.message);
      if (result.data.resetLink) {
        setResetLink(result.data.resetLink);
      }
    } catch (err: unknown) {
      let message = "Unable to send reset instructions";

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        if (axiosError.response?.data?.message) {
          message = axiosError.response.data.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#041f22_0%,#062c2f_35%,#0c4a4e_100%)]" />
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/20 bg-white/95 p-8 shadow-[0_30px_80px_rgb(0_0_0/30%)] backdrop-blur-xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-mid)]">
          WRDN HR System
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)]">
          Forgot password
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
          Enter your work email and we will send reset instructions if an account exists.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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

          {error ? (
            <p className="rounded-[var(--radius-md)] border border-red-200 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          {success ? (
            <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]">
              <p>{success}</p>
              {resetLink ? (
                <div className="mt-3 rounded-xl border border-emerald-200/80 bg-white p-3">
                  <p className="text-xs font-semibold text-[var(--ink-muted)]">
                    Local test link (email not configured):
                  </p>
                  <a
                    href={resetLink}
                    className="mt-2 block break-all text-xs font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
                  >
                    {resetLink}
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="hr-btn-primary w-full py-3.5"
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[var(--ink-muted)]">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
