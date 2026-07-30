"use client";

import {
    Award,
    BriefcaseBusiness,
    CheckCircle2,
    CircleAlert,
    Clock3,
    FileSearch,
    FileText,
    LoaderCircle,
    RefreshCcw,
    Send,
    Sparkles,
    Trash2,
    Upload,
    XCircle
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";

import {
    analyzeCvSubmission,
    createMyCvSubmission,
    deleteCvSubmission,
    getAllCvSubmissions,
    getCvAnalysisForHr,
    getCvPortalJobs,
    getJobCandidateRanking,
    getMyCvSubmissions,
    reanalyzeCvSubmission,
    withdrawMyCvSubmission,
    type CandidateRankingItem,
    type CandidateStage,
    type CvAnalysis,
    type CvAnalysisStatus,
    type CvPortalJob,
    type EmployeeCvSubmission,
    type HrCvSubmission,
    type JobCandidateRanking,
} from "../../../src/services/cv-portal.service";
import { updateCandidateStage } from "../../../src/services/recruitment.service";

const HIRING_STAGES: CandidateStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFERED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

interface StoredUser {
  email: string;
  role: "SUPER_ADMIN" | "HR_MANAGER" | "EMPLOYEE";
}

interface EmployeeSubmissionForm {
  jobOpeningId: string;
  yearsOfExperience: string;
  currentJobTitle: string;
  candidateName: string;
  phone: string;
  linkedInUrl: string;
  portfolioUrl: string;
  notes: string;
}

const initialEmployeeForm: EmployeeSubmissionForm = {
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
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const responseError =
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

    const message =
      responseError.response?.data
        ?.message;

    if (message) {
      return message;
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
    return "Not available";
  }

  return new Date(
    value,
  ).toLocaleString();
}

function formatMoney(
  value:
    | string
    | number
    | null,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "Not available";
  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "Not available";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function formatScore(
  value:
    | string
    | number
    | null,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "0";
  }

  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    return "0";
  }

  return parsed.toFixed(1);
}

function getStatusClasses(
  status: CvAnalysisStatus,
): string {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PROCESSING":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getStageClasses(
  stage: string,
): string {
  switch (stage) {
    case "HIRED":
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
    case "WITHDRAWN":
      return "bg-red-100 text-red-700";

    case "INTERVIEW":
    case "OFFERED":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getRecommendationClasses(
  recommendation:
    | string
    | null,
): string {
  switch (recommendation) {
    case "HIGHLY_RECOMMENDED":
      return "bg-emerald-100 text-emerald-700";

    case "RECOMMENDED":
      return "bg-blue-100 text-blue-700";

    case "CONSIDER":
      return "bg-amber-100 text-amber-700";

    case "NOT_RECOMMENDED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function humanize(
  value: string,
): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function EmployeeCvPortal() {
  const [jobs, setJobs] =
    useState<CvPortalJob[]>([]);

  const [
    submissions,
    setSubmissions,
  ] =
    useState<EmployeeCvSubmission[]>(
      [],
    );

  const [form, setForm] =
    useState<EmployeeSubmissionForm>(
      initialEmployeeForm,
    );

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    withdrawingId,
    setWithdrawingId,
  ] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadEmployeeData(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const [
        jobsResult,
        submissionsResult,
      ] =
        await Promise.all([
          getCvPortalJobs(),
          getMyCvSubmissions(),
        ]);

      setJobs(jobsResult);
      setSubmissions(
        submissionsResult,
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
  }

  useEffect(() => {
    void loadEmployeeData();
  }, []);

  function updateForm<
    Key extends keyof EmployeeSubmissionForm,
  >(
    key: Key,
    value: EmployeeSubmissionForm[Key],
  ): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const file =
      event.target.files?.[0] ??
      null;

    setSelectedFile(file);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!selectedFile) {
      setError(
        "Please select a PDF or DOCX CV file.",
      );

      return;
    }

    if (!form.jobOpeningId) {
      setError(
        "Please select a job opening.",
      );

      return;
    }

    if (!form.candidateName.trim()) {
      setError(
        "Please enter the candidate name.",
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await createMyCvSubmission({
        jobOpeningId:
          form.jobOpeningId,

        yearsOfExperience:
          Number(
            form.yearsOfExperience,
          ),

        currentJobTitle:
          form.currentJobTitle,

        candidateName:
          form.candidateName.trim(),

        phone:
          form.phone,

        linkedInUrl:
          form.linkedInUrl,

        portfolioUrl:
          form.portfolioUrl,

        notes:
          form.notes,

        cv:
          selectedFile,
      });

      setForm(
        initialEmployeeForm,
      );

      setSelectedFile(
        null,
      );

      setSuccess(
        "Your CV was submitted successfully.",
      );

      await loadEmployeeData();
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
    submissionId: string,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        "Are you sure you want to withdraw this application?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setWithdrawingId(
        submissionId,
      );

      setError("");
      setSuccess("");

      await withdrawMyCvSubmission(
        submissionId,
      );

      setSuccess(
        "Application withdrawn successfully.",
      );

      await loadEmployeeData();
    } catch (withdrawError) {
      setError(
        getErrorMessage(
          withdrawError,
        ),
      );
    } finally {
      setWithdrawingId(
        null,
      );
    }
  }

  if (loading) {
    return (
      <LoadingState text="Loading CV Portal..." />
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">
          CV Portal
        </h1>

        <p className="mt-2 text-slate-600">
          Submit your CV for an open
          position and track your
          application status.
        </p>
      </section>

      <MessageBanners
        error={error}
        success={success}
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <Upload size={21} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Submit a CV
            </h2>

            <p className="text-sm text-slate-500">
              Choose an open job and
              upload a PDF or DOCX file.
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Job opening
            </label>

            <select
              required
              value={
                form.jobOpeningId
              }
              onChange={(event) =>
                updateForm(
                  "jobOpeningId",
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="">
                Select a job
              </option>

              {jobs.map((job) => (
                <option
                  key={job.id}
                  value={job.id}
                >
                  {job.title}
                  {job.location
                    ? ` — ${job.location}`
                    : ""}
                  {` (${job.numberOfVacancies} vacancy${job.numberOfVacancies === 1 ? "" : "s"})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Years of experience
            </label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              required
              value={
                form.yearsOfExperience
              }
              onChange={(event) =>
                updateForm(
                  "yearsOfExperience",
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Current job title
            </label>

            <input
              type="text"
              value={
                form.currentJobTitle
              }
              onChange={(event) =>
                updateForm(
                  "currentJobTitle",
                  event.target.value,
                )
              }
              placeholder="Software Engineer"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Candidate name
            </label>

            <input
              type="text"
              value={
                form.candidateName
              }
              onChange={(event) =>
                updateForm(
                  "candidateName",
                  event.target.value,
                )
              }
              placeholder="Candidate full name"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Phone
            </label>

            <input
              type="text"
              value={form.phone}
              onChange={(event) =>
                updateForm(
                  "phone",
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              LinkedIn URL
            </label>

            <input
              type="url"
              value={
                form.linkedInUrl
              }
              onChange={(event) =>
                updateForm(
                  "linkedInUrl",
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Portfolio URL
            </label>

            <input
              type="url"
              value={
                form.portfolioUrl
              }
              onChange={(event) =>
                updateForm(
                  "portfolioUrl",
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              CV file
            </label>

            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              onChange={
                handleFileChange
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
            />

            {selectedFile ? (
              <p className="mt-2 text-xs text-slate-500">
                Selected:{" "}
                {selectedFile.name}
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Notes
            </label>

            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) =>
                updateForm(
                  "notes",
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="submit"
            disabled={
              submitting ||
              jobs.length === 0
            }
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
                Submitting...
              </>
            ) : (
              <>
                <Send size={17} />
                Submit CV
              </>
            )}
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            My submissions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            You can see submission and
            analysis status, but private
            HR analysis results are not
            shown.
          </p>
        </div>

        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Submit your CV for an open job position."
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {submissions.map(
              (submission) => (
                <article
                  key={submission.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {
                          submission
                            .jobOpening
                            .title
                        }
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          submission
                            .resumeFileName
                        }
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStageClasses(
                        submission.stage,
                      )}`}
                    >
                      {humanize(
                        submission.stage,
                      )}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <InfoItem
                      label="Applied"
                      value={formatDate(
                        submission.appliedAt,
                      )}
                    />

                    <InfoItem
                      label="Location"
                      value={
                        submission
                          .jobOpening
                          .location ??
                        "Not specified"
                      }
                    />

                    <InfoItem
                      label="Experience"
                      value={`${submission.yearsOfExperience} years`}
                    />

                    <InfoItem
                      label="Analysis"
                      value={
                        submission
                          .cvAnalysis
                          ?.status ??
                        "PENDING"
                      }
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        submission
                          .cvAnalysis
                          ?.status ??
                          "PENDING",
                      )}`}
                    >
                      {humanize(
                        submission
                          .cvAnalysis
                          ?.status ??
                          "PENDING",
                      )}
                    </span>

                    {![
                      "HIRED",
                      "REJECTED",
                      "WITHDRAWN",
                    ].includes(
                      submission.stage,
                    ) ? (
                      <button
                        type="button"
                        disabled={
                          withdrawingId ===
                          submission.id
                        }
                        onClick={() =>
                          void handleWithdraw(
                            submission.id,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle
                          size={16}
                        />

                        {withdrawingId ===
                        submission.id
                          ? "Withdrawing..."
                          : "Withdraw"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function HrCvPortal({
  role,
}: {
  role:
    | "SUPER_ADMIN"
    | "HR_MANAGER";
}) {
  const [
    submissions,
    setSubmissions,
  ] =
    useState<HrCvSubmission[]>(
      [],
    );

  const [jobs, setJobs] =
    useState<CvPortalJob[]>([]);

  const [
    selectedSubmission,
    setSelectedSubmission,
  ] =
    useState<HrCvSubmission | null>(
      null,
    );

  const [
    selectedAnalysis,
    setSelectedAnalysis,
  ] =
    useState<CvAnalysis | null>(
      null,
    );

  const [
    selectedJobId,
    setSelectedJobId,
  ] =
    useState("");

  const [
    rankingStageFilter,
    setRankingStageFilter,
  ] =
    useState<CandidateStage | "">("");

  const [
    updatingStageId,
    setUpdatingStageId,
  ] =
    useState<string | null>(null);

  const [ranking, setRanking] =
    useState<JobCandidateRanking | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [
    processingId,
    setProcessingId,
  ] =
    useState<string | null>(null);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<string | null>(null);

  const [
    loadingReport,
    setLoadingReport,
  ] =
    useState(false);

  const [
    loadingRanking,
    setLoadingRanking,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadHrData(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const [
        submissionsResult,
        jobsResult,
      ] =
        await Promise.all([
          getAllCvSubmissions(),
          getCvPortalJobs(),
        ]);

      setSubmissions(
        submissionsResult,
      );

      setJobs(jobsResult);
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHrData();
  }, []);

  const completedCount =
    useMemo(
      () =>
        submissions.filter(
          (submission) =>
            submission.cvAnalysis
              ?.status ===
            "COMPLETED",
        ).length,
      [submissions],
    );

  const pendingCount =
    useMemo(
      () =>
        submissions.filter(
          (submission) =>
            submission.cvAnalysis
              ?.status ===
              "PENDING" ||
            submission.cvAnalysis
              ?.status ===
              "FAILED",
        ).length,
      [submissions],
    );

  async function handleAnalyze(
    submissionId: string,
    reanalyze: boolean,
  ): Promise<void> {
    try {
      setProcessingId(
        submissionId,
      );

      setError("");
      setSuccess("");

      const analysis =
        reanalyze
          ? await reanalyzeCvSubmission(
              submissionId,
            )
          : await analyzeCvSubmission(
              submissionId,
            );

      setSelectedAnalysis(
        analysis,
      );

      setSuccess(
        reanalyze
          ? "CV reanalyzed successfully."
          : "CV analyzed successfully.",
      );

      await loadHrData();
    } catch (analysisError) {
      setError(
        getErrorMessage(
          analysisError,
        ),
      );
    } finally {
      setProcessingId(
        null,
      );
    }
  }

  async function handleViewReport(
    submission: HrCvSubmission,
  ): Promise<void> {
    try {
      setSelectedSubmission(
        submission,
      );

      setLoadingReport(true);
      setError("");

      const analysis =
        await getCvAnalysisForHr(
          submission.id,
        );

      setSelectedAnalysis(
        analysis,
      );
    } catch (reportError) {
      setError(
        getErrorMessage(
          reportError,
        ),
      );

      setSelectedSubmission(
        null,
      );
    } finally {
      setLoadingReport(false);
    }
  }

  async function handleRanking(): Promise<void> {
    if (!selectedJobId) {
      setRanking(null);
      return;
    }

    try {
      setLoadingRanking(true);
      setError("");

      const result =
        await getJobCandidateRanking(
          selectedJobId,
        );

      setRanking(result);
    } catch (rankingError) {
      setError(
        getErrorMessage(
          rankingError,
        ),
      );
    } finally {
      setLoadingRanking(false);
    }
  }

  useEffect(() => {
    void handleRanking();
  }, [selectedJobId]);

  const filteredRankedCandidates =
    useMemo(() => {
      const candidates =
        ranking?.rankedCandidates ??
        [];

      if (!rankingStageFilter) {
        return candidates;
      }

      return candidates.filter(
        (item) =>
          item.stage ===
          rankingStageFilter,
      );
    }, [
      ranking,
      rankingStageFilter,
    ]);

  async function handleStageChange(
    candidateId: string,
    stage: CandidateStage,
  ): Promise<void> {
    try {
      setUpdatingStageId(
        candidateId,
      );
      setError("");
      setSuccess("");

      await updateCandidateStage(
        candidateId,
        stage,
      );

      setSuccess(
        `Candidate stage updated to ${humanize(stage)}.`,
      );

      setSubmissions(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              candidateId
                ? {
                    ...item,
                    stage,
                  }
                : item,
          ),
      );

      setRanking(
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            rankedCandidates:
              current.rankedCandidates.map(
                (item) =>
                  item.candidateId ===
                  candidateId
                    ? {
                        ...item,
                        stage,
                      }
                    : item,
              ),
          };
        },
      );
    } catch (stageError) {
      setError(
        getErrorMessage(
          stageError,
        ),
      );
    } finally {
      setUpdatingStageId(
        null,
      );
    }
  }

  async function handleDelete(
    submissionId: string,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        "Delete this CV submission permanently?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        submissionId,
      );

      setError("");
      setSuccess("");

      await deleteCvSubmission(
        submissionId,
      );

      setSuccess(
        "CV submission deleted successfully.",
      );

      await loadHrData();
    } catch (deleteError) {
      setError(
        getErrorMessage(
          deleteError,
        ),
      );
    } finally {
      setDeletingId(
        null,
      );
    }
  }

  if (loading) {
    return (
      <LoadingState text="Loading CV submissions..." />
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">
          CV Analysis Portal
        </h1>

        <p className="mt-2 text-slate-600">
          Review employee CV submissions,
          run Gemini analysis, compare
          candidates, and view salary
          recommendations.
        </p>
      </section>

      <MessageBanners
        error={error}
        success={success}
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={
            <FileText size={22} />
          }
          label="Total submissions"
          value={String(
            submissions.length,
          )}
        />

        <StatCard
          icon={
            <CheckCircle2
              size={22}
            />
          }
          label="Completed analyses"
          value={String(
            completedCount,
          )}
        />

        <StatCard
          icon={
            <Clock3 size={22} />
          }
          label="Pending review"
          value={String(
            pendingCount,
          )}
        />

        <StatCard
          icon={
            <Award size={22} />
          }
          label="Open jobs"
          value={String(
            jobs.length,
          )}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            CV submissions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Analyze pending CVs or open a
            complete AI report.
          </p>
        </div>

        {submissions.length === 0 ? (
          <EmptyState
            title="No CV submissions"
            description="Employee submissions will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Candidate",
                      "Job",
                      "Stage",
                      "Analysis",
                      "Score",
                      "Recommendation",
                      "Actions",
                    ].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {submissions.map(
                    (submission) => {
                      const status =
                        submission
                          .cvAnalysis
                          ?.status ??
                        "PENDING";

                      const score =
                        submission
                          .cvAnalysis
                          ?.finalMatchScore;

                      return (
                        <tr
                          key={
                            submission.id
                          }
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {
                                submission.firstName
                              }{" "}
                              {
                                submission.lastName
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                submission.email
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-800">
                              {
                                submission
                                  .jobOpening
                                  .title
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                submission
                                  .jobOpening
                                  .department
                                  ?.name ??
                                "No department"
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                submission.stage
                              }
                              disabled={
                                updatingStageId ===
                                submission.id
                              }
                              onChange={(
                                event,
                              ) =>
                                void handleStageChange(
                                  submission.id,
                                  event
                                    .target
                                    .value as CandidateStage,
                                )
                              }
                              className={`rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 disabled:opacity-50 ${getStageClasses(
                                submission.stage,
                              )}`}
                            >
                              {HIRING_STAGES.map(
                                (
                                  stage,
                                ) => (
                                  <option
                                    key={
                                      stage
                                    }
                                    value={
                                      stage
                                    }
                                  >
                                    {humanize(
                                      stage,
                                    )}
                                  </option>
                                ),
                              )}
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                status,
                              )}`}
                            >
                              {humanize(
                                status,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-900">
                            {score !==
                            null &&
                            score !==
                              undefined
                              ? `${formatScore(
                                  score,
                                )}%`
                              : "—"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getRecommendationClasses(
                                submission
                                  .cvAnalysis
                                  ?.recommendation ??
                                  null,
                              )}`}
                            >
                              {submission
                                .cvAnalysis
                                ?.recommendation
                                ? humanize(
                                    submission
                                      .cvAnalysis
                                      .recommendation,
                                  )
                                : "Not available"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              {status ===
                                "COMPLETED" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleViewReport(
                                        submission,
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <FileSearch
                                      size={
                                        14
                                      }
                                    />
                                    Report
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      processingId ===
                                      submission.id
                                    }
                                    onClick={() =>
                                      void handleAnalyze(
                                        submission.id,
                                        true,
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                                  >
                                    <RefreshCcw
                                      size={
                                        14
                                      }
                                    />
                                    Reanalyze
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled={
                                    processingId ===
                                      submission.id ||
                                    status ===
                                      "PROCESSING"
                                  }
                                  onClick={() =>
                                    void handleAnalyze(
                                      submission.id,
                                      false,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                >
                                  {processingId ===
                                  submission.id ? (
                                    <LoaderCircle
                                      size={
                                        14
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Sparkles
                                      size={
                                        14
                                      }
                                    />
                                  )}
                                  Analyze
                                </button>
                              )}

                              {role ===
                              "SUPER_ADMIN" ? (
                                <button
                                  type="button"
                                  disabled={
                                    deletingId ===
                                    submission.id
                                  }
                                  onClick={() =>
                                    void handleDelete(
                                      submission.id,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2
                                    size={14}
                                  />
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Candidate ranking
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Select a job to rank completed candidates by AI final match score.
            Use the stage dropdown to filter or update hiring status (Applied, Interview, Hired, Rejected, etc.).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Job opening
            </label>
            <select
              value={selectedJobId}
              onChange={(event) =>
                setSelectedJobId(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">
                Select a job opening
              </option>

              {jobs.map((job) => (
                <option
                  key={job.id}
                  value={job.id}
                >
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Hiring stage
            </label>
            <select
              value={rankingStageFilter}
              onChange={(event) =>
                setRankingStageFilter(
                  event.target.value as CandidateStage | "",
                )
              }
              disabled={!selectedJobId}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:opacity-60"
            >
              <option value="">
                All stages
              </option>
              {HIRING_STAGES.map((stage) => (
                <option
                  key={stage}
                  value={stage}
                >
                  {humanize(stage)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedJobId ? (
          <p className="text-sm text-slate-500">
            Choose a job opening to see ranked candidates.
          </p>
        ) : loadingRanking ? (
          <LoadingState text="Loading candidate ranking..." />
        ) : filteredRankedCandidates.length === 0 ? (
          <p className="text-sm text-slate-500">
            No ranked candidates
            {rankingStageFilter
              ? ` in ${humanize(rankingStageFilter)}`
              : ""}
            {" "}for this job yet. Analyze CVs first to generate match scores.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Rank",
                      "Candidate",
                      "Score",
                      "Recommendation",
                      "Hiring stage",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRankedCandidates.map((item) => (
                    <tr
                      key={item.candidateId}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        #{item.rank}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {item.candidateName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.email}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        {item.analysis?.finalMatchScore != null
                          ? `${formatScore(item.analysis.finalMatchScore)}%`
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getRecommendationClasses(
                            item.analysis?.recommendation ?? null,
                          )}`}
                        >
                          {item.analysis?.recommendation
                            ? humanize(item.analysis.recommendation)
                            : "Not available"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={item.stage}
                          disabled={
                            updatingStageId === item.candidateId
                          }
                          onChange={(event) =>
                            void handleStageChange(
                              item.candidateId,
                              event.target.value as CandidateStage,
                            )
                          }
                          className={`rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 disabled:opacity-50 ${getStageClasses(
                            item.stage,
                          )}`}
                        >
                          {HIRING_STAGES.map((stage) => (
                            <option
                              key={stage}
                              value={stage}
                            >
                              {humanize(stage)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {selectedSubmission ? (
        <AnalysisModal
          submission={
            selectedSubmission
          }
          analysis={
            selectedAnalysis
          }
          loading={
            loadingReport
          }
          onClose={() => {
            setSelectedSubmission(
              null,
            );

            setSelectedAnalysis(
              null,
            );
          }}
        />
      ) : null}
    </div>
  );
}

function AnalysisModal({
  submission,
  analysis,
  loading,
  onClose,
}: {
  submission: HrCvSubmission;
  analysis: CvAnalysis | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-6xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              AI CV Analysis
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {submission.firstName}{" "}
              {submission.lastName} —{" "}
              {
                submission.jobOpening
                  .title
              }
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
          >
            <XCircle size={20} />
          </button>
        </div>

        {loading ? (
          <LoadingState text="Loading analysis report..." />
        ) : analysis ? (
          <div className="space-y-6 p-6">
            <section className="grid gap-5 md:grid-cols-3">
              <ScoreCard
                label="Local score"
                value={
                  analysis.localMatchScore
                }
              />

              <ScoreCard
                label="Gemini score"
                value={
                  analysis.aiMatchScore
                }
              />

              <ScoreCard
                label="Final score"
                value={
                  analysis.finalMatchScore
                }
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Recommendation
                </h3>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${getRecommendationClasses(
                    analysis.recommendation,
                  )}`}
                >
                  {analysis.recommendation
                    ? humanize(
                        analysis.recommendation,
                      )
                    : "Not available"}
                </span>
              </div>

              <p className="mt-4 leading-7 text-slate-700">
                {analysis.summary ??
                  "No summary available."}
              </p>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <ArrayCard
                title="Matched skills"
                values={
                  analysis.matchedSkills ??
                  []
                }
                positive
              />

              <ArrayCard
                title="Missing skills"
                values={
                  analysis.missingSkills ??
                  []
                }
              />

              <ArrayCard
                title="Strengths"
                values={
                  analysis.strengths ??
                  []
                }
                positive
              />

              <ArrayCard
                title="Concerns"
                values={
                  analysis.concerns ??
                  []
                }
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Salary recommendation
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <InfoItem
                  label="Minimum"
                  value={formatMoney(
                    analysis
                      .recommendedSalaryMin,
                  )}
                />

                <InfoItem
                  label="Target"
                  value={formatMoney(
                    analysis
                      .recommendedSalaryTarget,
                  )}
                />

                <InfoItem
                  label="Maximum"
                  value={formatMoney(
                    analysis
                      .recommendedSalaryMax,
                  )}
                />
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                {analysis.salaryRecommendationReason ??
                  "No salary recommendation reason available."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Interview questions
              </h3>

              <ol className="mt-4 space-y-3">
                {(
                  analysis.interviewQuestions ??
                  []
                ).map(
                  (
                    question,
                    index,
                  ) => (
                    <li
                      key={`${question}-${index}`}
                      className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                    >
                      <span className="font-bold text-slate-900">
                        {index + 1}.
                      </span>

                      <span>
                        {question}
                      </span>
                    </li>
                  ),
                )}
              </ol>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              AI-generated recommendation.
              Final hiring and salary
              decisions must be reviewed by
              authorized HR staff.
            </section>
          </div>
        ) : (
          <EmptyState
            title="Analysis not available"
            description="No completed analysis was found."
          />
        )}
      </div>
    </div>
  );
}

function RankingTable({
  items,
}: {
  items: CandidateRankingItem[];
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No ranked candidates"
        description="Candidates will appear after their CV analysis is completed."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Rank",
                "Candidate",
                "Experience",
                "Score",
                "Recommendation",
                "Target salary",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {items.map((item) => (
              <tr
                key={item.candidateId}
              >
                <td className="px-5 py-4 text-lg font-bold text-slate-900">
                  #{item.rank}
                </td>

                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">
                    {
                      item.candidateName
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.email}
                  </p>
                </td>

                <td className="px-5 py-4 text-sm text-slate-700">
                  {
                    item.yearsOfExperience
                  }{" "}
                  years
                </td>

                <td className="px-5 py-4 text-sm font-bold text-slate-900">
                  {formatScore(
                    item.analysis
                      ?.finalMatchScore ??
                      null,
                  )}
                  %
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getRecommendationClasses(
                      item.analysis
                        ?.recommendation ??
                        null,
                    )}`}
                  >
                    {item.analysis
                      ?.recommendation
                      ? humanize(
                          item.analysis
                            .recommendation,
                        )
                      : "Not available"}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                  {formatMoney(
                    item.analysis
                      ?.recommendedSalaryTarget ??
                      null,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | number
    | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-bold text-slate-900">
        {formatScore(value)}%
      </p>
    </div>
  );
}

function ArrayCard({
  title,
  values,
  positive = false,
}: {
  title: string;
  values: string[];
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">
        {title}
      </h3>

      {values.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No information available.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {values.map(
            (
              value,
              index,
            ) => (
              <li
                key={`${value}-${index}`}
                className="flex gap-3 text-sm leading-6 text-slate-700"
              >
                {positive ? (
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-emerald-600"
                  />
                ) : (
                  <CircleAlert
                    size={18}
                    className="mt-1 shrink-0 text-amber-600"
                  />
                )}

                <span>{value}</span>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="w-fit rounded-xl bg-slate-100 p-3 text-slate-700">
        {icon}
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </article>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function MessageBanners({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  return (
    <>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}
    </>
  );
}

function LoadingState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="text-center">
        <LoaderCircle
          size={36}
          className="mx-auto animate-spin text-slate-700"
        />

        <p className="mt-4 text-sm text-slate-600">
          {text}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <BriefcaseBusiness
        size={36}
        className="mx-auto text-slate-400"
      />

      <h3 className="mt-4 font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function CvPortalPage() {
  const [user, setUser] =
    useState<StoredUser | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const storedUser =
      window.localStorage.getItem(
        "authUser",
      );

    if (!storedUser) {
      setError(
        "User information was not found. Please log in again.",
      );

      setLoading(false);
      return;
    }

    try {
      const parsedUser =
        JSON.parse(
          storedUser,
        ) as StoredUser;

      if (parsedUser.role === "EMPLOYEE") {
        window.location.replace("/dashboard/cv-portal");
        return;
      }

      setUser(parsedUser);
    } catch {
      setError(
        "Stored user information is invalid. Please log in again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <LoadingState text="Loading CV Portal..." />
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error ||
          "Unable to load user information."}
      </div>
    );
  }

  return (
    <HrCvPortal
      role={user.role as "SUPER_ADMIN" | "HR_MANAGER"}
    />
  );
}