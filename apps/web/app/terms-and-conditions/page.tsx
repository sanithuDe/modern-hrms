"use client";

import { useEffect, useState } from "react";

import {
  LegalDocumentLayout,
  Section,
} from "../../src/components/legal/LegalDocumentLayout";

export default function TermsAndConditionsPage() {
  const [backHref, setBackHref] = useState("/login");

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    const user = window.localStorage.getItem("authUser");
    setBackHref(token && user ? "/dashboard" : "/login");
  }, []);

  return (
    <LegalDocumentLayout
      title="Terms & Conditions"
      lastUpdated="July 29, 2026"
      backHref={backHref}
    >
      <Section title="1. Acceptance">
        <p>
          By using HR Platform, you agree to these Terms and Conditions
          for the web and mobile applications.
        </p>
      </Section>

      <Section title="2. Accounts">
        <p>
          Accounts are authorized for workplace use only. You are
          responsible for keeping your login credentials secure and
          notifying your administrator of unauthorized access.
        </p>
      </Section>

      <Section title="3. Permitted Use">
        <p>
          Use the platform only for legitimate HR purposes. Do not bypass
          role permissions, share credentials, upload false information,
          or attempt to disrupt the system.
        </p>
      </Section>

      <Section title="4. HR Data">
        <p>
          Users managing employee data must ensure information is accurate
          and handled in compliance with applicable employment and privacy
          laws.
        </p>
      </Section>

      <Section title="5. Attendance, Leave, and Payroll">
        <p>
          Check-in, leave, and payroll features must be used in accordance
          with company policy. Final HR decisions remain the responsibility
          of your organization.
        </p>
      </Section>

      <Section title="6. Service Availability">
        <p>
          We aim to keep the platform available but do not guarantee
          uninterrupted access due to maintenance, updates, or network
          issues.
        </p>
      </Section>

      <Section title="7. Limitation of Liability">
        <p>
          HR Platform is provided &quot;as is&quot; to the fullest extent
          permitted by law. We are not liable for indirect or consequential
          damages arising from platform use.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          For questions about these Terms, contact your organization&apos;s
          HR administrator, platform administrator, or use the{" "}
          <a href="/contact-us" className="font-medium text-slate-900 underline">
            Contact Us
          </a>{" "}
          page.
        </p>
      </Section>
    </LegalDocumentLayout>
  );
}
