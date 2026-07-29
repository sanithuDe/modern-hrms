import type { Metadata } from "next";

import {
  LegalDocumentLayout,
  Section,
} from "../../src/components/legal/LegalDocumentLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions | HR Platform",
  description:
    "Terms and Conditions for using the HR Platform human resource management system.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalDocumentLayout
      title="Terms & Conditions"
      lastUpdated="July 29, 2026"
    >
      <Section title="1. Acceptance of Terms">
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to
          and use of HR Platform, including the web application and mobile
          application. By creating an account or using the platform, you agree
          to these Terms.
        </p>
      </Section>

      <Section title="2. Eligibility and Accounts">
        <p>
          HR Platform is provided for authorized workplace users only. Accounts
          are created and managed by your organization. You are responsible for
          maintaining the confidentiality of your login credentials and for all
          activity that occurs under your account.
        </p>

        <p>
          You must notify your administrator immediately if you suspect
          unauthorized access to your account.
        </p>
      </Section>

      <Section title="3. Permitted Use">
        <p>
          You may use HR Platform only for legitimate employment and HR-related
          purposes approved by your organization. You agree not to:
        </p>

        <ul className="list-disc space-y-2 pl-5">
          <li>Access data or features outside your assigned role permissions.</li>
          <li>Share login credentials with others.</li>
          <li>Attempt to disrupt, reverse engineer, or compromise the platform.</li>
          <li>Upload false, misleading, or unlawful information.</li>
          <li>Use the platform in a way that violates applicable laws or company policies.</li>
        </ul>
      </Section>

      <Section title="4. Role-Based Access">
        <p>
          Features available to you depend on your assigned role, such as
          Employee, HR Manager, or Super Admin. Attempting to bypass role
          restrictions or access unauthorized modules is prohibited.
        </p>
      </Section>

      <Section title="5. Employee and HR Data">
        <p>
          Users who submit or manage employee information are responsible for
          ensuring that data is accurate, current, and collected in compliance
          with applicable employment, privacy, and labor laws. HR Platform
          provides tools to manage HR records but does not replace your
          organization&apos;s legal obligations.
        </p>
      </Section>

      <Section title="6. Attendance, Leave, and Payroll">
        <p>
          Attendance check-in/check-out, leave approvals, and payroll actions
          must be used in good faith and in accordance with company policy.
          Automated calculations and statuses are based on configured rules and
          assigned shifts. Your organization remains responsible for final HR
          decisions and payroll processing.
        </p>
      </Section>

      <Section title="7. Recruitment and CV Submissions">
        <p>
          Users who upload CVs or recruitment documents confirm that they have
          the right to submit such materials and that the information provided
          is truthful to the best of their knowledge. Uploaded files may be
          processed for recruitment and analysis purposes within the platform.
        </p>
      </Section>

      <Section title="8. Service Availability">
        <p>
          We aim to keep HR Platform available and reliable, but uninterrupted
          access is not guaranteed. Maintenance, updates, network issues, or
          third-party service interruptions may temporarily affect availability.
        </p>
      </Section>

      <Section title="9. Intellectual Property">
        <p>
          HR Platform, including its software, design, branding, and content
          provided by us, is protected by applicable intellectual property laws.
          You may not copy, modify, distribute, or create derivative works from
          the platform except as expressly permitted by your organization or us.
        </p>
      </Section>

      <Section title="10. Disclaimer">
        <p>
          HR Platform is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. To the fullest extent permitted by law, we
          disclaim warranties of merchantability, fitness for a particular
          purpose, and non-infringement.
        </p>
      </Section>

      <Section title="11. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, HR Platform and its operators
          shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages arising from your use of the
          platform, including loss of data, business interruption, or payroll
          processing errors caused by misuse or misconfiguration.
        </p>
      </Section>

      <Section title="12. Suspension and Termination">
        <p>
          We or your organization may suspend or terminate access to the platform
          if these Terms are violated, if an account is inactive, or if continued
          access is no longer authorized. Upon termination, your right to use
          the platform ceases immediately.
        </p>
      </Section>

      <Section title="13. Changes to These Terms">
        <p>
          We may revise these Terms from time to time. Updated Terms will be
          posted on this page with a revised effective date. Continued use of
          the platform after changes become effective constitutes acceptance of
          the updated Terms.
        </p>
      </Section>

      <Section title="14. Governing Law">
        <p>
          These Terms shall be governed by the laws applicable in your
          organization&apos;s jurisdiction, unless otherwise required by
          mandatory local law.
        </p>
      </Section>

      <Section title="15. Contact">
        <p>
          For questions about these Terms, please contact your organization&apos;s
          HR administrator or platform administrator.
        </p>
      </Section>
    </LegalDocumentLayout>
  );
}
