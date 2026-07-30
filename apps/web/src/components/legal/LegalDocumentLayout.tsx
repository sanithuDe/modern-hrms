import Link from "next/link";
import type { ReactNode } from "react";

interface LegalDocumentLayoutProps {
  title: string;
  lastUpdated: string;
  backHref?: string;
  children: ReactNode;
}

export function LegalDocumentLayout({
  title,
  lastUpdated,
  backHref = "/dashboard",
  children,
}: LegalDocumentLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={backHref}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            &larr; {backHref === "/dashboard" ? "Back to dashboard" : "Back"}
          </Link>
        </div>

        <article className="rounded-2xl bg-white p-8 shadow-lg sm:p-10">
          <header className="border-b border-slate-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              HR Platform
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {title}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Last updated: {lastUpdated}
            </p>
          </header>

          <div className="prose prose-slate mt-8 max-w-none space-y-6 text-slate-700">
            {children}
          </div>

          <footer className="mt-10 flex flex-wrap gap-4 border-t border-slate-200 pt-6 text-sm">
            <Link
              href="/contact-us"
              className="font-medium text-slate-600 transition hover:text-slate-900"
            >
              Contact Us
            </Link>

            <Link
              href="/privacy-policy"
              className="font-medium text-slate-600 transition hover:text-slate-900"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms-and-conditions"
              className="font-medium text-slate-600 transition hover:text-slate-900"
            >
              Terms &amp; Conditions
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
        {children}
      </div>
    </section>
  );
}

export { Section };
