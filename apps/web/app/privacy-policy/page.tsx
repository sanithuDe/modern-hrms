"use client";

import { useEffect, useState } from "react";

import {
  LegalDocumentLayout,
  Section,
} from "../../src/components/legal/LegalDocumentLayout";

export default function PrivacyPolicyPage() {
  const [backHref, setBackHref] = useState("/login");

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    const user = window.localStorage.getItem("authUser");
    setBackHref(token && user ? "/dashboard" : "/login");
  }, []);

  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      lastUpdated="July 29, 2026"
      backHref={backHref}
    >
      <Section title="1. Introduction">
        <p>
          This Privacy Policy explains how HR Platform collects, uses,
          stores, and protects personal information when you use our HR
          web and mobile applications.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p>
          We may collect account details, employee records, attendance
          data, leave information, payroll records, performance reviews,
          recruitment and CV uploads, and technical usage data needed to
          operate the platform securely.
        </p>
      </Section>

      <Section title="3. How We Use Information">
        <p>
          Information is used to provide HR services, authenticate users,
          enforce role-based access, process leave and payroll actions,
          publish announcements, and maintain platform security.
        </p>
      </Section>

      <Section title="4. Data Sharing">
        <p>
          We do not sell personal data. Information is shared only with
          authorized users in your organization, required service
          providers, or when required by law.
        </p>
      </Section>

      <Section title="5. Security and Retention">
        <p>
          We apply reasonable safeguards to protect data. Records are
          retained as long as needed for HR operations and legal
          obligations.
        </p>
      </Section>

      <Section title="6. Your Rights">
        <p>
          You may request access, correction, or deletion of certain
          information through your organization&apos;s HR or platform
          administrator.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          For privacy questions, contact your organization&apos;s HR
          administrator, platform administrator, or use the{" "}
          <a href="/contact-us" className="font-medium text-slate-900 underline">
            Contact Us
          </a>{" "}
          page.
        </p>
      </Section>
    </LegalDocumentLayout>
  );
}
