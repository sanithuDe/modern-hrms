"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { resetPassword } from "../../src/services/auth.service";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenFromQuery = useMemo(
    () => searchParams.get("token")?.trim() || "",
    [searchParams],
  );

  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token.trim()) {
      setError("Reset token is missing. Open the link from your email.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword({
        token: token.trim(),
        password,
        confirmPassword,
      });

      setSuccess(result.message || result.data.message);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      let message = "Unable to reset password";

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
    <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/20 bg-white/95 p-8 shadow-[0_30px_80px_rgb(0_0_0/30%)] backdrop-blur-xl sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-mid)]">
        WRDN HR System
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)]">
        Reset password
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
        Choose a new password for your account.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {!tokenFromQuery ? (
          <div>
            <label htmlFor="token" className="hr-label">
              Reset token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="hr-input"
              placeholder="Paste token from reset email"
              required
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="password" className="hr-label">
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="hr-input"
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="hr-label">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="hr-input"
            placeholder="Repeat new password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {error ? (
          <p className="rounded-[var(--radius-md)] border border-red-200 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-[var(--radius-md)] border border-emerald-200 bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="hr-btn-primary w-full py-3.5"
        >
          {isLoading ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--ink-muted)]">
        <Link
          href="/login"
          className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#041f22_0%,#062c2f_35%,#0c4a4e_100%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />

      <Suspense
        fallback={
          <div className="rounded-[28px] bg-white/95 px-8 py-10 text-sm text-[var(--ink-muted)]">
            Loading reset form...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
