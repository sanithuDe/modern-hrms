import type { Metadata } from "next";

import {
  LegalDocumentLayout,
  Section,
} from "../../src/components/legal/LegalDocumentLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | HR Platform",
  description:
    "Privacy Policy for the HR Platform human resource management system.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      lastUpdated="July 29, 2026"
    >
      <Section title="1. Introduction">
        <p>
          This Privacy Policy explains how HR Platform (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, and
          protects personal information when you use our human resource
          management web and mobile applications.
        </p>

        <p>
          By accessing or using HR Platform, you agree to the collection and
          use of information in accordance with this policy.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p>
          We may collect the following categories of information:
        </p>

        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account information:</strong> name, email address, role,
            login credentials, and account status.
          </li>

          <li>
            <strong>Employee records:</strong> employee number, department,
            position, hire date, contact details, and employment-related data.
          </li>

          <li>
            <strong>Attendance data:</strong> check-in and check-out times,
            shift assignments, working hours, late minutes, and attendance
            status.
          </li>

          <li>
            <strong>Leave information:</strong> leave types, balances, requests,
            approvals, and related comments.
          </li>

          <li>
            <strong>Payroll information:</strong> salary profiles, payroll
            records, allowances, deductions, and payment status.
          </li>

          <li>
            <strong>Performance data:</strong> review scores, comments, and
            evaluation history.
          </li>

          <li>
            <strong>Recruitment and CV data:</strong> uploaded resumes, candidate
            details, job applications, and analysis results.
          </li>

          <li>
            <strong>Technical data:</strong> device type, browser or app
            version, IP address, and usage logs needed to operate and secure
            the platform.
          </li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>
          We use collected information to:
        </p>

        <ul className="list-disc space-y-2 pl-5">
          <li>Provide HR, attendance, leave, payroll, and recruitment services.</li>
          <li>Authenticate users and enforce role-based access control.</li>
          <li>Process leave requests, payroll actions, and performance reviews.</li>
          <li>Generate reports and operational insights for authorized users.</li>
          <li>Maintain platform security, prevent misuse, and troubleshoot issues.</li>
          <li>Communicate announcements and important workplace updates.</li>
        </ul>
      </Section>

      <Section title="4. Legal Basis and Authorization">
        <p>
          HR Platform is intended for workplace use. Employee data is processed
          for legitimate business and employment-related purposes. Access to
          personal information is restricted based on user roles such as
          Employee, HR Manager, and Super Admin.
        </p>
      </Section>

      <Section title="5. Data Sharing">
        <p>
          We do not sell personal information. Data may be shared only:
        </p>

        <ul className="list-disc space-y-2 pl-5">
          <li>With authorized personnel inside your organization based on role permissions.</li>
          <li>With service providers that help operate the platform, under confidentiality obligations.</li>
          <li>When required by law, regulation, court order, or legal process.</li>
        </ul>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We retain personal information for as long as necessary to provide
          HR services, meet legal obligations, resolve disputes, and enforce
          agreements. Retention periods may vary depending on the type of record
          and applicable employment or payroll laws.
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          We implement reasonable administrative, technical, and organizational
          safeguards to protect personal information, including authentication
          controls, access restrictions, and secure communication where
          applicable. However, no system can be guaranteed to be completely
          secure.
        </p>
      </Section>

      <Section title="8. Your Rights">
        <p>
          Depending on your location and employment context, you may have rights
          to access, correct, update, or request deletion of certain personal
          information. Requests should be submitted through your organization&apos;s
          HR administrator or designated contact.
        </p>
      </Section>

      <Section title="9. Cookies and Local Storage">
        <p>
          The web application may use browser local storage to maintain login
          sessions and user preferences. The mobile application may use secure
          on-device storage for authentication tokens.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page with an updated effective date. Continued use of
          the platform after changes are posted constitutes acceptance of the
          revised policy.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          If you have questions about this Privacy Policy or how your data is
          handled, please contact your organization&apos;s HR administrator or
          platform administrator.
        </p>
      </Section>
    </LegalDocumentLayout>
  );
}
