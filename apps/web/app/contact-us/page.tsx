"use client";

import {
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { submitContactMessage } from "../../src/services/contact.service";

export default function ContactUsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    const user = window.localStorage.getItem("authUser");
    setIsSignedIn(Boolean(token && user));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccess(result.message || result.data.message);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      let nextError = "Unable to send your message. Please try again.";

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        if (axiosError.response?.data?.message) {
          nextError = axiosError.response.data.message;
        }
      } else if (err instanceof Error) {
        nextError = err.message;
      }

      setError(nextError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#041f22_0%,#062c2f_30%,#0c4a4e_55%,#f0f4f5_55.2%)]" />
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={isSignedIn ? "/dashboard" : "/login"}
            className="flex items-center gap-3"
          >
            <Image
              src="/wrdn-option-c.png"
              alt="WRDN HR System"
              width={360}
              height={108}
              priority
              className="h-auto w-[190px] sm:w-[220px]"
            />
          </Link>

          <Link
            href={isSignedIn ? "/dashboard" : "/login"}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            {isSignedIn ? "Back to home" : "Back to sign in"}
          </Link>
        </div>

        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100/80">
            Contact Us
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            We&apos;re here to help
          </h1>
          <p className="mt-3 text-sm leading-6 text-teal-50/80 sm:text-[15px]">
            Questions about WRDN HR System, account access, or support?
            Send a message and our team will respond as soon as possible.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-4">
            <div className="hr-card p-6">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
                Reach WRDN
              </h2>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Mail size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">Email</p>
                    <p className="mt-0.5 text-[var(--ink-muted)]">
                      support@wrdn-hr.local
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Phone size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">Phone</p>
                    <p className="mt-0.5 text-[var(--ink-muted)]">
                      +94 11 000 0000
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">Office</p>
                    <p className="mt-0.5 text-[var(--ink-muted)]">
                      Colombo, Sri Lanka
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-teal-200/50 bg-[linear-gradient(145deg,#083538_0%,#0c4a4e_100%)] p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/70">
                Support hours
              </p>
              <p className="mt-3 text-lg font-semibold">
                Mon – Fri · 9:00 AM – 5:00 PM
              </p>
              <p className="mt-2 text-sm text-teal-50/80">
                For urgent account access issues, include your registered work email in the message.
              </p>
            </div>
          </aside>

          <section className="hr-card p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">
              Send a message
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Fill in the form below and we will get back to you.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="hr-label">
                    Full name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="hr-input"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="hr-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="hr-input"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="hr-label">
                  Subject
                </label>
                <input
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="hr-input"
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="hr-label">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="hr-input min-h-[140px] resize-y py-3"
                  placeholder="Write your message..."
                  required
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
                className="hr-btn-primary"
              >
                <Send size={16} />
                {isLoading ? "Sending..." : "Send message"}
              </button>
            </form>
          </section>
        </div>

        <footer className="mt-10 flex flex-wrap justify-center gap-5 text-sm text-[var(--ink-muted)]">
          <Link href="/privacy-policy" className="font-semibold hover:text-[var(--brand)]">
            Privacy Policy
          </Link>
          <Link href="/terms-and-conditions" className="font-semibold hover:text-[var(--brand)]">
            Terms &amp; Conditions
          </Link>
          <Link
            href={isSignedIn ? "/dashboard" : "/login"}
            className="font-semibold hover:text-[var(--brand)]"
          >
            {isSignedIn ? "Home" : "Sign in"}
          </Link>
        </footer>
      </div>
    </main>
  );
}
