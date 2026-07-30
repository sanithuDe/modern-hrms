"use client";

import axios from "axios";
import {
    BriefcaseBusiness,
    FileText,
    Send,
    Upload,
    XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";

// Header and Sidebar are provided by the shared Shell layout

import {
    createMyCvSubmission,
    getCvPortalJobs,
    getMyCvSubmissions,
    withdrawMyCvSubmission,
    type CvPortalJob,
    type EmployeeCvSubmission,
} from "../../../src/services/cv-portal.service";
import { sanitizePhoneDigits } from "../../../src/lib/phone";
import { SelectField } from "../../../src/components/ui/SelectField";

interface StoredUser {
  id?: string;
  email: string;
  role:
    | "SUPER_ADMIN"
    | "HR_MANAGER"
    | "EMPLOYEE";
}

interface CvFormState {
  jobOpeningId: string;
  yearsOfExperience: string;
  currentJobTitle: string;
  candidateName: string;
  phone: string;
  linkedInUrl: string;
  portfolioUrl: string;
  notes: string;
}

const initialFormState: CvFormState = {
  jobOpeningId: "",
  yearsOfExperience: "0",
  currentJobTitle: "",
  candidateName: "",
  phone: "",
  linkedInUrl: "",
  portfolioUrl: "",
  notes: "",
};

function getErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      error.response?.data?.message;

    if (
      typeof responseMessage === "string" &&
      responseMessage.trim().length > 0
    ) {
      return responseMessage;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatStatus(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getStatusClass(
  status: EmployeeCvSubmission["stage"],
): string {
  switch (status) {
    case "HIRED":
      return "bg-emerald-50 text-[var(--success)] ring-1 ring-emerald-200";

    case "REJECTED":
      return "bg-[var(--danger-soft)] text-[var(--danger)] ring-1 ring-red-200";

    case "WITHDRAWN":
      return "bg-[var(--canvas)] text-[var(--ink-muted)] ring-1 ring-[var(--line)]";

    case "INTERVIEW":
    case "OFFERED":
      return "bg-[var(--brand-soft)] text-[var(--brand)] ring-1 ring-teal-200";

    case "SCREENING":
      return "bg-[var(--warning-soft)] text-[var(--warning)] ring-1 ring-amber-200";

    default:
      return "bg-[var(--canvas)] text-[var(--ink)] ring-1 ring-[var(--line)]";
  }
}

const fieldLabel = "hr-label";

const fieldControl = "hr-input h-11";


export default function CvPortalPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [jobs, setJobs] =
    useState<CvPortalJob[]>([]);

  const [submissions, setSubmissions] =
    useState<EmployeeCvSubmission[]>([]);

  const [form, setForm] =
    useState<CvFormState>(
      initialFormState,
    );

  const [cvFile, setCvFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [withdrawingId, setWithdrawingId] =
    useState<string | null>(null);

  const [pendingWithdraw, setPendingWithdraw] =
    useState<EmployeeCvSubmission | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const selectedJob =
    useMemo(
      () =>
        jobs.find(
          (job) =>
            job.id ===
            form.jobOpeningId,
        ) ?? null,
      [
        jobs,
        form.jobOpeningId,
      ],
    );

  const loadCvPortalData =
    useCallback(
      async (): Promise<void> => {
        setLoading(true);
        setError("");

        try {
          const [
            jobResults,
            submissionResults,
          ] = await Promise.all([
            getCvPortalJobs(),
            getMyCvSubmissions(),
          ]);

          setJobs(jobResults);
          setSubmissions(
            submissionResults,
          );
        } catch (loadError) {
          setError(
            getErrorMessage(
              loadError,
            ),
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    const accessToken =
      localStorage.getItem(
        "accessToken",
      );

    const storedUserValue =
      localStorage.getItem(
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
      const storedUser =
        JSON.parse(
          storedUserValue,
        ) as StoredUser;

      // HR / Super Admin use the management portal (analyze, ranking, delete)
      if (
        storedUser.role === "SUPER_ADMIN" ||
        storedUser.role === "HR_MANAGER"
      ) {
        router.replace("/dashboard/cv");
        return;
      }

      setUser(storedUser);
      void loadCvPortalData();
    } catch {
      localStorage.removeItem(
        "accessToken",
      );

      localStorage.removeItem(
        "authUser",
      );

      router.replace("/login");
    }
  }, [
    loadCvPortalData,
    router,
  ]);

  function handleInputChange(
    event:
      ChangeEvent<
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
      >,
  ): void {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (currentForm) => ({
        ...currentForm,
        [name]:
          name === "phone"
            ? sanitizePhoneDigits(value)
            : value,
      }),
    );
  }

  function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    setError("");
    setSuccess("");

    const selectedFile =
      event.target.files?.[0] ??
      null;

    if (!selectedFile) {
      setCvFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      !allowedTypes.includes(
        selectedFile.type,
      )
    ) {
      setCvFile(null);
      event.target.value = "";

      setError(
        "Only PDF and DOCX files are allowed.",
      );

      return;
    }

    setCvFile(selectedFile);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.jobOpeningId) {
      setError(
        "Select a job opening.",
      );

      return;
    }

    if (!form.candidateName.trim()) {
      setError(
        "Enter the candidate name.",
      );

      return;
    }

    if (!cvFile) {
      setError(
        "Choose a PDF or DOCX CV file.",
      );

      return;
    }

    const yearsOfExperience =
      Number(
        form.yearsOfExperience,
      );

    if (
      !Number.isFinite(
        yearsOfExperience,
      ) ||
      yearsOfExperience < 0
    ) {
      setError(
        "Enter a valid number of years of experience.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const submission =
        await createMyCvSubmission({
          jobOpeningId:
            form.jobOpeningId,

          yearsOfExperience,

          currentJobTitle:
            form.currentJobTitle.trim(),

          candidateName:
            form.candidateName.trim(),

          phone:
            form.phone.trim(),

          linkedInUrl:
            form.linkedInUrl.trim(),

          portfolioUrl:
            form.portfolioUrl.trim(),

          notes:
            form.notes.trim(),

          cv:
            cvFile,
        });

      setSubmissions(
        (currentSubmissions) => [
          submission,
          ...currentSubmissions,
        ],
      );

      setForm(
        initialFormState,
      );

      setCvFile(null);

      const fileInput =
        document.getElementById(
          "cv",
        ) as
          | HTMLInputElement
          | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setSuccess(
        "CV submitted successfully.",
      );
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openWithdrawConfirmation(
    submission: EmployeeCvSubmission,
  ): void {
    setError("");
    setSuccess("");
    setPendingWithdraw(submission);
  }

  function closeWithdrawConfirmation(): void {
    if (withdrawingId) {
      return;
    }

    setPendingWithdraw(null);
  }

  async function confirmWithdraw(): Promise<void> {
    if (!pendingWithdraw) {
      return;
    }

    const submission = pendingWithdraw;

    setError("");
    setSuccess("");
    setWithdrawingId(submission.id);

    try {
      const updatedSubmission =
        await withdrawMyCvSubmission(
          submission.id,
        );

      setSubmissions(
        (currentSubmissions) =>
          currentSubmissions.map(
            (currentSubmission) =>
              currentSubmission.id ===
              updatedSubmission.id
                ? updatedSubmission
                : currentSubmission,
          ),
      );

      setPendingWithdraw(null);
      setSuccess(
        "Application withdrawn successfully.",
      );
    } catch (withdrawError) {
      setError(
        getErrorMessage(
          withdrawError,
        ),
      );
    } finally {
      setWithdrawingId(null);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm font-medium text-[var(--ink-muted)]">
          Loading CV Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-[var(--success-soft)] px-4 py-3 text-sm font-medium text-[var(--success)]">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <section className="hr-card overflow-hidden">
          <div className="relative overflow-hidden border-b border-[var(--line)] px-6 py-6 sm:px-8">
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(120deg,#083538_0%,#0c4a4e_48%,#14686e_100%)]"
            />
            <div className="relative flex items-start gap-4 text-white">
              <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/25">
                <Upload size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Submit a CV
                </h2>
                <p className="mt-1 text-sm text-teal-50/85">
                  Select an open job and upload a PDF or DOCX file.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="space-y-6 p-6 sm:p-8"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <SelectField
                  label="Job opening"
                  required
                  value={form.jobOpeningId}
                  placeholder="Select a job"
                  disabled={loading || submitting}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      jobOpeningId: value,
                    }))
                  }
                  options={jobs.map((job) => ({
                    value: job.id,
                    label: `${job.title}${job.department ? ` — ${job.department.name}` : ""} (${job.numberOfVacancies} vacancy${job.numberOfVacancies === 1 ? "" : "s"})`,
                  }))}
                />
              </div>

              <div>
                <label htmlFor="yearsOfExperience" className={fieldLabel}>
                  Years of experience
                </label>
                <input
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.yearsOfExperience}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={fieldControl}
                  required
                />
              </div>

              <div>
                <label htmlFor="currentJobTitle" className={fieldLabel}>
                  Current job title
                </label>
                <input
                  id="currentJobTitle"
                  name="currentJobTitle"
                  value={form.currentJobTitle}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="Software Engineer"
                  className={fieldControl}
                />
              </div>

              <div>
                <label htmlFor="candidateName" className={fieldLabel}>
                  Candidate name
                </label>
                <input
                  id="candidateName"
                  name="candidateName"
                  value={form.candidateName}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="Candidate full name"
                  className={fieldControl}
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className={fieldLabel}>
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="[0-9]*"
                  maxLength={15}
                  placeholder="Digits only"
                  value={form.phone}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={fieldControl}
                />
              </div>

              <div>
                <label htmlFor="linkedInUrl" className={fieldLabel}>
                  LinkedIn URL
                </label>
                <input
                  id="linkedInUrl"
                  name="linkedInUrl"
                  type="url"
                  value={form.linkedInUrl}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="https://..."
                  className={fieldControl}
                />
              </div>

              <div>
                <label htmlFor="portfolioUrl" className={fieldLabel}>
                  Portfolio URL
                </label>
                <input
                  id="portfolioUrl"
                  name="portfolioUrl"
                  type="url"
                  value={form.portfolioUrl}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="https://..."
                  className={fieldControl}
                />
              </div>

              <div>
                <label htmlFor="cv" className={fieldLabel}>
                  CV file
                </label>
                <label
                  htmlFor="cv"
                  className={`flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed px-4 py-5 text-center transition ${
                    cvFile
                      ? "border-[var(--brand-mid)] bg-[var(--brand-soft)]"
                      : "border-[var(--line-strong)] bg-[var(--canvas)] hover:border-[var(--brand-mid)] hover:bg-[var(--brand-soft)]"
                  }`}
                >
                  <FileText className="text-[var(--brand)]" size={26} />
                  <span className="mt-2 text-sm font-semibold text-[var(--ink)]">
                    {cvFile ? cvFile.name : "Drop or browse PDF / DOCX"}
                  </span>
                  <span className="mt-1 text-xs text-[var(--ink-muted)]">
                    Max quality resume, one file
                  </span>
                  <input
                    id="cv"
                    name="cv"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    disabled={submitting}
                    className="sr-only"
                    required
                  />
                </label>
              </div>

              <div className="lg:col-span-2">
                <label htmlFor="notes" className={fieldLabel}>
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={form.notes}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="Add any relevant information..."
                  className="hr-input min-h-[110px] resize-y py-3"
                />
              </div>
            </div>

            {selectedJob ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--canvas)] p-5">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness size={18} className="text-[var(--brand)]" />
                  <h3 className="font-semibold text-[var(--ink)]">
                    {selectedJob.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                  {selectedJob.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[var(--ink)]">
                  <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[var(--line)]">
                    Experience: {selectedJob.minimumExperience} years
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[var(--line)]">
                    Vacancies: {selectedJob.numberOfVacancies}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[var(--line)]">
                    Deadline: {formatDate(selectedJob.applicationDeadline)}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {!loading && jobs.length === 0 ? (
                <p className="text-sm font-semibold text-[var(--ink)]">
                  There are currently no open job positions.
                </p>
              ) : (
                <p className="text-sm text-[var(--ink-muted)]">
                  {jobs.length} open role{jobs.length === 1 ? "" : "s"} available
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || loading || jobs.length === 0}
                className="hr-btn-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Send size={17} />
                {submitting ? "Submitting..." : "Submit CV"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="hr-card p-6">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
              How it works
            </h3>
            <ol className="mt-5 space-y-4">
              {[
                "Choose the role that matches your skills.",
                "Fill in experience and contact details.",
                "Upload your CV and submit the application.",
                "Track stage updates under My submissions.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand)] ring-1 ring-teal-200">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-teal-200/60 bg-[linear-gradient(145deg,#083538_0%,#0c4a4e_55%,#14686e_100%)] p-6 text-white shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/70">
              Tip
            </p>
            <p className="mt-3 text-lg font-semibold leading-snug">
              Use a clear file name like{" "}
              <span className="underline decoration-teal-200/50">
                FirstName_LastName_CV.pdf
              </span>
            </p>
            <p className="mt-3 text-sm text-teal-50/80">
              PDF usually parses best for AI analysis after HR reviews your application.
            </p>
          </div>
        </aside>
      </div>

      <section className="hr-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-6 py-5 sm:px-8">
          <div className="rounded-2xl bg-[var(--brand-soft)] p-3 text-[var(--brand)]">
            <FileText size={21} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
              My CV submissions
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              View your applications and current status.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm font-medium text-[var(--ink-muted)]">
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)]">
              <FileText className="text-[var(--brand)]" size={28} />
            </div>
            <p className="mt-4 text-base font-semibold text-[var(--ink)]">
              No CV submissions yet
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Select an open job and submit your CV above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--line)]">
              <thead className="bg-[var(--canvas)]">
                <tr>
                  {["Job", "CV", "Applied", "Stage", "Analysis", "Action"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] ${
                          heading === "Action" ? "text-right" : "text-left"
                        }`}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] bg-white">
                {submissions.map((submission) => {
                  const canWithdraw = ![
                    "HIRED",
                    "REJECTED",
                    "WITHDRAWN",
                  ].includes(submission.stage);

                  return (
                    <tr key={submission.id} className="hover:bg-[var(--canvas)]/80">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[var(--ink)]">
                          {submission.jobOpening.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">
                          {submission.jobOpening.department?.name ??
                            "No department"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--ink-muted)]">
                        {submission.resumeFileName ?? "CV file"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--ink-muted)]">
                        {formatDate(submission.appliedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            submission.stage,
                          )}`}
                        >
                          {formatStatus(submission.stage)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[var(--ink-muted)]">
                        {submission.cvAnalysis?.status
                          ? formatStatus(submission.cvAnalysis.status)
                          : "Pending"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canWithdraw ? (
                          <button
                            type="button"
                            onClick={() => openWithdrawConfirmation(submission)}
                            disabled={withdrawingId === submission.id}
                            className="hr-btn-secondary px-3 py-2 text-xs disabled:opacity-50"
                          >
                            <XCircle size={15} />
                            {withdrawingId === submission.id
                              ? "Withdrawing..."
                              : "Withdraw"}
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-[var(--ink-faint)]">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pendingWithdraw ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--brand-dark)]/45 p-4 backdrop-blur-sm"
          onMouseDown={closeWithdrawConfirmation}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-application-title"
            className="hr-card w-full max-w-md p-6 shadow-[var(--shadow-elevated)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--warning-soft)] text-[var(--warning)]">
                <XCircle size={22} />
              </div>

              <div>
                <h2
                  id="withdraw-application-title"
                  className="text-xl font-semibold text-[var(--ink)]"
                >
                  Withdraw application
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                  Are you sure you want to withdraw your application for{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    {pendingWithdraw.jobOpening.title}
                  </span>
                  ?
                </p>

                <p className="mt-2 text-sm font-medium text-[var(--warning)]">
                  You can submit again later if the job is still open.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(withdrawingId)}
                onClick={closeWithdrawConfirmation}
                className="hr-btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={Boolean(withdrawingId)}
                onClick={() => void confirmWithdraw()}
                className="hr-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle size={17} />
                {withdrawingId === pendingWithdraw.id
                  ? "Withdrawing..."
                  : "Withdraw Application"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}