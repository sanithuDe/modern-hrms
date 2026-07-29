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
  currentCompany: string;
  phone: string;
  linkedInUrl: string;
  portfolioUrl: string;
  notes: string;
}

const initialFormState: CvFormState = {
  jobOpeningId: "",
  yearsOfExperience: "0",
  currentJobTitle: "",
  currentCompany: "",
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
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    case "WITHDRAWN":
      return "bg-slate-200 text-slate-700";

    case "INTERVIEW":
      return "bg-purple-100 text-purple-700";

    case "OFFERED":
      return "bg-blue-100 text-blue-700";

    case "SCREENING":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-indigo-100 text-indigo-700";
  }
}

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
        [name]: value,
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

          currentCompany:
            form.currentCompany.trim(),

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

  async function handleWithdraw(
    submission:
      EmployeeCvSubmission,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        `Withdraw your application for "${submission.jobOpening.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setWithdrawingId(
      submission.id,
    );

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
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">
          Loading CV Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-slate-950">
          CV Portal
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Submit your CV for an open
          position and track your
          application status.
        </p>
      </div>

          {error ? (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <Upload size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Submit a CV
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Select an open job and
                  upload a PDF or DOCX
                  file.
                </p>
              </div>
            </div>

            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label
                    htmlFor="jobOpeningId"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Job opening
                  </label>

                  <select
                    id="jobOpeningId"
                    name="jobOpeningId"
                    value={
                      form.jobOpeningId
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      loading ||
                      submitting
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                    required
                  >
                    <option value="">
                      Select a job
                    </option>

                    {jobs.map(
                      (job) => (
                        <option
                          key={job.id}
                          value={job.id}
                        >
                          {job.title}
                          {job.department
                            ? ` — ${job.department.name}`
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="yearsOfExperience"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Years of experience
                  </label>

                  <input
                    id="yearsOfExperience"
                    name="yearsOfExperience"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={
                      form.yearsOfExperience
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-900"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="currentJobTitle"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Current job title
                  </label>

                  <input
                    id="currentJobTitle"
                    name="currentJobTitle"
                    value={
                      form.currentJobTitle
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={submitting}
                    placeholder="Software Engineer"
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="currentCompany"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Current company
                  </label>

                  <input
                    id="currentCompany"
                    name="currentCompany"
                    value={
                      form.currentCompany
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={submitting}
                    placeholder="Company name"
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Phone
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={
                      handleInputChange
                    }
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="linkedInUrl"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    LinkedIn URL
                  </label>

                  <input
                    id="linkedInUrl"
                    name="linkedInUrl"
                    type="url"
                    value={
                      form.linkedInUrl
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={submitting}
                    placeholder="https://..."
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="portfolioUrl"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Portfolio URL
                  </label>

                  <input
                    id="portfolioUrl"
                    name="portfolioUrl"
                    type="url"
                    value={
                      form.portfolioUrl
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={submitting}
                    placeholder="https://..."
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cv"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    CV file
                  </label>

                  <input
                    id="cv"
                    name="cv"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={
                      handleFileChange
                    }
                    disabled={submitting}
                    className="block h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium"
                    required
                  />

                  {cvFile ? (
                    <p className="mt-2 text-xs text-slate-600">
                      Selected:{" "}
                      {cvFile.name}
                    </p>
                  ) : null}
                </div>

                <div className="lg:col-span-2">
                  <label
                    htmlFor="notes"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Notes
                  </label>

                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={form.notes}
                    onChange={
                      handleInputChange
                    }
                    disabled={submitting}
                    placeholder="Add any relevant information..."
                    className="w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>
              </div>

              {selectedJob ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness
                      size={18}
                    />

                    <h3 className="font-semibold text-slate-900">
                      {
                        selectedJob.title
                      }
                    </h3>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {
                      selectedJob.description
                    }
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                    <span>
                      Experience:{" "}
                      {
                        selectedJob.minimumExperience
                      }{" "}
                      years
                    </span>

                    <span>
                      Vacancies:{" "}
                      {
                        selectedJob.numberOfVacancies
                      }
                    </span>

                    <span>
                      Deadline:{" "}
                      {formatDate(
                        selectedJob.applicationDeadline,
                      )}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    loading ||
                    jobs.length === 0
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={17} />

                  {submitting
                    ? "Submitting..."
                    : "Submit CV"}
                </button>
              </div>

              {!loading &&
              jobs.length === 0 ? (
                <p className="mt-4 text-sm text-amber-700">
                  There are currently no
                  open job positions.
                </p>
              ) : null}
            </form>
          </section>

          <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                <FileText size={21} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  My CV submissions
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  View your applications
                  and current status.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-600">
                Loading submissions...
              </div>
            ) : submissions.length ===
              0 ? (
              <div className="p-10 text-center">
                <FileText
                  className="mx-auto text-slate-400"
                  size={36}
                />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No CV submissions yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Select an open job and
                  submit your CV above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Job
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        CV
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Applied
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Stage
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Analysis
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {submissions.map(
                      (submission) => {
                        const canWithdraw =
                          ![
                            "HIRED",
                            "REJECTED",
                            "WITHDRAWN",
                          ].includes(
                            submission.stage,
                          );

                        return (
                          <tr
                            key={
                              submission.id
                            }
                          >
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">
                                {
                                  submission
                                    .jobOpening
                                    .title
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {submission
                                  .jobOpening
                                  .department
                                  ?.name ??
                                  "No department"}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {submission.resumeFileName ??
                                "CV file"}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                              {formatDate(
                                submission.appliedAt,
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                  submission.stage,
                                )}`}
                              >
                                {formatStatus(
                                  submission.stage,
                                )}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {submission
                                .cvAnalysis
                                ?.status
                                ? formatStatus(
                                    submission
                                      .cvAnalysis
                                      .status,
                                  )
                                : "Pending"}
                            </td>

                            <td className="px-6 py-4 text-right">
                              {canWithdraw ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleWithdraw(
                                      submission,
                                    )
                                  }
                                  disabled={
                                    withdrawingId ===
                                    submission.id
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  <XCircle
                                    size={15}
                                  />

                                  {withdrawingId ===
                                  submission.id
                                    ? "Withdrawing..."
                                    : "Withdraw"}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  No action
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
    </div>
  );
}