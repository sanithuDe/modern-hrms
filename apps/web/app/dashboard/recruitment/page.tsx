"use client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Edit3,
  Mail,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  createCandidate,
  createJobOpening,
  deleteCandidate,
  deleteJobOpening,
  getCandidates,
  getJobOpenings,
  getRecruitmentDepartments,
  getRecruitmentPositions,
  updateCandidate,
  updateCandidateStage,
  updateJobOpening,
  updateJobOpeningStatus,
  type Candidate,
  type CandidateStage,
  type CreateCandidateInput,
  type CreateJobOpeningInput,
  type EmploymentType,
  type JobOpening,
  type JobOpeningStatus,
  type RecruitmentDepartment,
  type RecruitmentPosition,
} from "../../../src/services/recruitment.service";
import { sanitizePhoneDigits } from "../../../src/lib/phone";

interface StoredUser {
  email: string;
  role: string;
}

type RecruitmentTab =
  | "JOBS"
  | "CANDIDATES";

interface JobForm {
  title: string;
  description: string;
  employmentType: EmploymentType;
  numberOfVacancies: string;
  minimumExperience: string;
  requiredSkills: string;
  responsibilities: string;
  requirements: string;
  salaryMin: string;
  salaryMax: string;
  location: string;
  applicationDeadline: string;
  departmentId: string;
  positionId: string;
}

interface CandidateForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentJobTitle: string;
  currentCompany: string;
  yearsOfExperience: string;
  skills: string;
  education: string;
  address: string;
  resumeFileName: string;
  resumeUrl: string;
  linkedInUrl: string;
  portfolioUrl: string;
  notes: string;
  appliedAt: string;
  jobOpeningId: string;
}

type DeleteTarget =
  | {
      type: "JOB";
      item: JobOpening;
    }
  | {
      type: "CANDIDATE";
      item: Candidate;
    }
  | null;

const initialJobForm: JobForm = {
  title: "",
  description: "",
  employmentType: "FULL_TIME",
  numberOfVacancies: "1",
  minimumExperience: "0",
  requiredSkills: "",
  responsibilities: "",
  requirements: "",
  salaryMin: "",
  salaryMax: "",
  location: "",
  applicationDeadline: "",
  departmentId: "",
  positionId: "",
};

const initialCandidateForm: CandidateForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  currentJobTitle: "",
  currentCompany: "",
  yearsOfExperience: "0",
  skills: "",
  education: "",
  address: "",
  resumeFileName: "",
  resumeUrl: "",
  linkedInUrl: "",
  portfolioUrl: "",
  notes: "",
  appliedAt: "",
  jobOpeningId: "",
};

const jobStatuses: JobOpeningStatus[] = [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "CANCELLED",
];

const candidateStages: CandidateStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFERED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

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

function formatLabel(
  value: string,
): string {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase(),
    )
    .join(" ");
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not set";
  }

  return new Date(
    value,
  ).toLocaleDateString();
}

function formatMoney(
  value: string | number | null,
): string {
  if (
    value === null ||
    value === ""
  ) {
    return "Not set";
  }

  const amount =
    Number(value);

  if (Number.isNaN(amount)) {
    return "Not set";
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

function toDateTimeLocal(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  const offset =
    date.getTimezoneOffset();

  return new Date(
    date.getTime() -
      offset * 60 * 1000,
  )
    .toISOString()
    .slice(0, 16);
}

function jobStatusClass(
  status: JobOpeningStatus,
): string {
  switch (status) {
    case "OPEN":
      return "bg-emerald-50 text-emerald-700";

    case "CLOSED":
      return "bg-blue-50 text-blue-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

function candidateStageClass(
  stage: CandidateStage,
): string {
  switch (stage) {
    case "HIRED":
      return "bg-emerald-50 text-emerald-700";

    case "REJECTED":
    case "WITHDRAWN":
      return "bg-red-50 text-red-700";

    case "INTERVIEW":
    case "OFFERED":
      return "bg-blue-50 text-blue-700";

    case "SCREENING":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

export default function RecruitmentPage() {
  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [activeTab, setActiveTab] =
    useState<RecruitmentTab>("JOBS");

  const [jobOpenings, setJobOpenings] =
    useState<JobOpening[]>([]);

  const [candidates, setCandidates] =
    useState<Candidate[]>([]);

  const [departments, setDepartments] =
    useState<RecruitmentDepartment[]>([]);

  const [positions, setPositions] =
    useState<RecruitmentPosition[]>([]);

  const [jobForm, setJobForm] =
    useState<JobForm>(initialJobForm);

  const [candidateForm, setCandidateForm] =
    useState<CandidateForm>(
      initialCandidateForm,
    );

  const [
    editingJob,
    setEditingJob,
  ] = useState<JobOpening | null>(null);

  const [
    editingCandidate,
    setEditingCandidate,
  ] = useState<Candidate | null>(null);

  const [showJobForm, setShowJobForm] =
    useState(false);

  const [
    showCandidateForm,
    setShowCandidateForm,
  ] = useState(false);

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<DeleteTarget>(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const canManage =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_MANAGER";

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const results =
        await Promise.allSettled([
          getJobOpenings(),
          getCandidates(),
          getRecruitmentDepartments(),
          getRecruitmentPositions(),
        ]);

      if (
        results[0].status ===
        "fulfilled"
      ) {
        setJobOpenings(
          results[0].value,
        );
      } else {
        setJobOpenings([]);
      }

      if (
        results[1].status ===
        "fulfilled"
      ) {
        setCandidates(
          results[1].value,
        );
      } else {
        setCandidates([]);
      }

      if (
        results[2].status ===
        "fulfilled"
      ) {
        setDepartments(
          results[2].value,
        );
      } else {
        setDepartments([]);
      }

      if (
        results[3].status ===
        "fulfilled"
      ) {
        setPositions(
          results[3].value,
        );
      } else {
        setPositions([]);
      }

      const failedResult =
        results.find(
          (result) =>
            result.status ===
            "rejected",
        );

      if (
        failedResult?.status ===
        "rejected"
      ) {
        setError(
          getErrorMessage(
            failedResult.reason,
          ),
        );
      }
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

      setUser(parsedUser);

      if (
        parsedUser.role !==
          "SUPER_ADMIN" &&
        parsedUser.role !==
          "HR_MANAGER"
      ) {
        setError(
          "You do not have permission to access recruitment.",
        );

        setLoading(false);
        return;
      }

      void loadData();
    } catch {
      setError(
        "Stored user information is invalid. Please log in again.",
      );

      setLoading(false);
    }
  }, []);

  const openJobCount =
    useMemo(
      () =>
        jobOpenings.filter(
          (job) =>
            job.status === "OPEN",
        ).length,
      [jobOpenings],
    );

  const interviewCount =
    useMemo(
      () =>
        candidates.filter(
          (candidate) =>
            candidate.stage ===
            "INTERVIEW",
        ).length,
      [candidates],
    );

  const hiredCount =
    useMemo(
      () =>
        candidates.filter(
          (candidate) =>
            candidate.stage ===
            "HIRED",
        ).length,
      [candidates],
    );

  const filteredJobs =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return jobOpenings;
      }

      return jobOpenings.filter(
        (job) =>
          job.title
            .toLowerCase()
            .includes(term) ||
          job.department?.name
            .toLowerCase()
            .includes(term) ||
          job.position?.title
            .toLowerCase()
            .includes(term) ||
          job.location
            ?.toLowerCase()
            .includes(term),
      );
    }, [jobOpenings, search]);

  const filteredCandidates =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return candidates;
      }

      return candidates.filter(
        (candidate) =>
          `${candidate.firstName} ${candidate.lastName}`
            .toLowerCase()
            .includes(term) ||
          candidate.email
            .toLowerCase()
            .includes(term) ||
          candidate.jobOpening.title
            .toLowerCase()
            .includes(term),
      );
    }, [candidates, search]);

  const filteredPositions =
    useMemo(() => {
      if (!jobForm.departmentId) {
        return positions;
      }

      return positions.filter(
        (position) =>
          !position.departmentId ||
          position.departmentId ===
            jobForm.departmentId,
      );
    }, [
      jobForm.departmentId,
      positions,
    ]);

  function openCreateJobForm(): void {
    setEditingJob(null);
    setJobForm(initialJobForm);
    setError("");
    setSuccess("");
    setShowJobForm(true);
  }

  function openEditJobForm(
    job: JobOpening,
  ): void {
    setEditingJob(job);

    setJobForm({
      title: job.title,
      description: job.description,
      employmentType:
        job.employmentType,
      numberOfVacancies:
        String(
          job.numberOfVacancies,
        ),
      minimumExperience:
        String(
          job.minimumExperience,
        ),
      requiredSkills:
        job.requiredSkills ?? "",
      responsibilities:
        job.responsibilities ?? "",
      requirements:
        job.requirements ?? "",
      salaryMin:
        job.salaryMin !== null
          ? String(job.salaryMin)
          : "",
      salaryMax:
        job.salaryMax !== null
          ? String(job.salaryMax)
          : "",
      location:
        job.location ?? "",
      applicationDeadline:
        toDateTimeLocal(
          job.applicationDeadline,
        ),
      departmentId:
        job.departmentId ?? "",
      positionId:
        job.positionId ?? "",
    });

    setError("");
    setSuccess("");
    setShowJobForm(true);
  }

  function closeJobForm(): void {
    setShowJobForm(false);
    setEditingJob(null);
    setJobForm(initialJobForm);
  }

  function openCreateCandidateForm(): void {
    setEditingCandidate(null);

    setCandidateForm({
      ...initialCandidateForm,
      jobOpeningId:
        jobOpenings.find(
          (job) =>
            job.status === "OPEN" ||
            job.status === "DRAFT",
        )?.id ?? "",
    });

    setError("");
    setSuccess("");
    setShowCandidateForm(true);
  }

  function openEditCandidateForm(
    candidate: Candidate,
  ): void {
    setEditingCandidate(candidate);

    setCandidateForm({
      firstName:
        candidate.firstName,
      lastName:
        candidate.lastName,
      email:
        candidate.email,
      phone:
        candidate.phone ?? "",
      currentJobTitle:
        candidate.currentJobTitle ??
        "",
      currentCompany:
        candidate.currentCompany ??
        "",
      yearsOfExperience:
        String(
          candidate.yearsOfExperience,
        ),
      skills:
        candidate.skills ?? "",
      education:
        candidate.education ?? "",
      address:
        candidate.address ?? "",
      resumeFileName:
        candidate.resumeFileName ??
        "",
      resumeUrl:
        candidate.resumeUrl ?? "",
      linkedInUrl:
        candidate.linkedInUrl ?? "",
      portfolioUrl:
        candidate.portfolioUrl ??
        "",
      notes:
        candidate.notes ?? "",
      appliedAt:
        toDateTimeLocal(
          candidate.appliedAt,
        ),
      jobOpeningId:
        candidate.jobOpeningId,
    });

    setError("");
    setSuccess("");
    setShowCandidateForm(true);
  }

  function closeCandidateForm(): void {
    setShowCandidateForm(false);
    setEditingCandidate(null);
    setCandidateForm(
      initialCandidateForm,
    );
  }

  async function handleJobSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const input: CreateJobOpeningInput = {
        title:
          jobForm.title.trim(),

        description:
          jobForm.description.trim(),

        employmentType:
          jobForm.employmentType,

        numberOfVacancies:
          Number(
            jobForm.numberOfVacancies,
          ),

        minimumExperience:
          Number(
            jobForm.minimumExperience,
          ),

        requiredSkills:
          jobForm.requiredSkills.trim() ||
          null,

        responsibilities:
          jobForm.responsibilities.trim() ||
          null,

        requirements:
          jobForm.requirements.trim() ||
          null,

        salaryMin:
          jobForm.salaryMin
            ? Number(
                jobForm.salaryMin,
              )
            : null,

        salaryMax:
          jobForm.salaryMax
            ? Number(
                jobForm.salaryMax,
              )
            : null,

        location:
          jobForm.location.trim() ||
          null,

        applicationDeadline:
          jobForm.applicationDeadline
            ? new Date(
                jobForm.applicationDeadline,
              ).toISOString()
            : null,

        departmentId:
          jobForm.departmentId ||
          null,

        positionId:
          jobForm.positionId ||
          null,
      };

      if (editingJob) {
        await updateJobOpening(
          editingJob.id,
          input,
        );

        setSuccess(
          "Job opening updated successfully.",
        );
      } else {
        await createJobOpening(
          input,
        );

        setSuccess(
          "Job opening created successfully.",
        );
      }

      closeJobForm();
      await loadData();
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCandidateSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const input: CreateCandidateInput = {
        firstName:
          candidateForm.firstName.trim(),

        lastName:
          candidateForm.lastName.trim(),

        email:
          candidateForm.email.trim(),

        phone:
          candidateForm.phone.trim() ||
          null,

        currentJobTitle:
          candidateForm.currentJobTitle.trim() ||
          null,

        currentCompany:
          candidateForm.currentCompany.trim() ||
          null,

        yearsOfExperience:
          Number(
            candidateForm.yearsOfExperience,
          ),

        skills:
          candidateForm.skills.trim() ||
          null,

        education:
          candidateForm.education.trim() ||
          null,

        address:
          candidateForm.address.trim() ||
          null,

        resumeFileName:
          candidateForm.resumeFileName.trim() ||
          null,

        resumeUrl:
          candidateForm.resumeUrl.trim() ||
          null,

        linkedInUrl:
          candidateForm.linkedInUrl.trim() ||
          null,

        portfolioUrl:
          candidateForm.portfolioUrl.trim() ||
          null,

        notes:
          candidateForm.notes.trim() ||
          null,

        appliedAt:
          candidateForm.appliedAt
            ? new Date(
                candidateForm.appliedAt,
              ).toISOString()
            : null,

        jobOpeningId:
          candidateForm.jobOpeningId,
      };

      if (editingCandidate) {
        await updateCandidate(
          editingCandidate.id,
          input,
        );

        setSuccess(
          "Candidate updated successfully.",
        );
      } else {
        await createCandidate(
          input,
        );

        setSuccess(
          "Candidate created successfully.",
        );
      }

      closeCandidateForm();
      await loadData();
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleJobStatus(
    jobId: string,
    status: JobOpeningStatus,
  ): Promise<void> {
    try {
      setActionId(jobId);
      setError("");
      setSuccess("");

      await updateJobOpeningStatus(
        jobId,
        status,
      );

      setSuccess(
        "Job status updated successfully.",
      );

      await loadData();
    } catch (statusError) {
      setError(
        getErrorMessage(
          statusError,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleCandidateStage(
    candidateId: string,
    stage: CandidateStage,
  ): Promise<void> {
    try {
      setActionId(candidateId);
      setError("");
      setSuccess("");

      await updateCandidateStage(
        candidateId,
        stage,
      );

      setSuccess(
        "Candidate stage updated successfully.",
      );

      await loadData();
    } catch (stageError) {
      setError(
        getErrorMessage(
          stageError,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      if (
        deleteTarget.type ===
        "JOB"
      ) {
        await deleteJobOpening(
          deleteTarget.item.id,
        );

        setSuccess(
          "Job opening deleted successfully.",
        );
      } else {
        await deleteCandidate(
          deleteTarget.item.id,
        );

        setSuccess(
          "Candidate deleted successfully.",
        );
      }

      setDeleteTarget(null);
      await loadData();
    } catch (deleteError) {
      setError(
        getErrorMessage(
          deleteError,
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-600">
            Loading recruitment...
          </p>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        You do not have permission to
        access recruitment.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={
              openCreateCandidateForm
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Users size={18} />
            Add Candidate
          </button>

          <button
            type="button"
            onClick={
              openCreateJobForm
            }
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={18} />
            New Job
          </button>
      </section>

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

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={
            <BriefcaseBusiness
              size={22}
            />
          }
          label="Total Jobs"
          value={jobOpenings.length}
        />

        <StatCard
          icon={
            <Building2 size={22} />
          }
          label="Open Jobs"
          value={openJobCount}
        />

        <StatCard
          icon={<Users size={22} />}
          label="Candidates"
          value={candidates.length}
        />

        <StatCard
          icon={
            <UserCheck size={22} />
          }
          label="Hired"
          value={hiredCount}
          description={`${interviewCount} interviewing`}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveTab("JOBS")
              }
              className={
                activeTab === "JOBS"
                  ? "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              }
            >
              Job Openings
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "CANDIDATES",
                )
              }
              className={
                activeTab ===
                "CANDIDATES"
                  ? "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              }
            >
              Candidates
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {activeTab === "JOBS" ? (
          <div className="grid gap-5 p-5 xl:grid-cols-2">
            {filteredJobs.length ===
            0 ? (
              <EmptyState message="No job openings found." />
            ) : (
              filteredJobs.map(
                (job) => (
                  <article
                    key={job.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${jobStatusClass(
                            job.status,
                          )}`}
                        >
                          {formatLabel(
                            job.status,
                          )}
                        </span>

                        <h2 className="mt-4 text-xl font-semibold text-slate-900">
                          {job.title}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatLabel(
                            job.employmentType,
                          )}
                        </p>
                      </div>

                      <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                        {
                          job._count
                            .candidates
                        }{" "}
                        candidates
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {job.description}
                    </p>

                    <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <Building2
                          size={16}
                        />
                        {job.department
                          ?.name ??
                          "No department"}
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin
                          size={16}
                        />
                        {job.location ??
                          "No location"}
                      </p>

                      <p>
                        Vacancies:{" "}
                        <strong>
                          {
                            job.numberOfVacancies
                          }
                        </strong>
                      </p>

                      <p>
                        Experience:{" "}
                        <strong>
                          {
                            job.minimumExperience
                          }{" "}
                          years
                        </strong>
                      </p>

                      <p>
                        Min salary:{" "}
                        <strong>
                          {formatMoney(
                            job.salaryMin,
                          )}
                        </strong>
                      </p>

                      <p>
                        Max salary:{" "}
                        <strong>
                          {formatMoney(
                            job.salaryMax,
                          )}
                        </strong>
                      </p>

                      <p className="flex items-center gap-2 sm:col-span-2">
                        <CalendarDays
                          size={16}
                        />
                        Deadline:{" "}
                        {formatDate(
                          job.applicationDeadline,
                        )}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                      <select
                        value={job.status}
                        disabled={
                          actionId ===
                          job.id
                        }
                        onChange={(event) =>
                          void handleJobStatus(
                            job.id,
                            event.target
                              .value as JobOpeningStatus,
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        {jobStatuses.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {formatLabel(
                                status,
                              )}
                            </option>
                          ),
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          openEditJobForm(
                            job,
                          )
                        }
                        disabled={
                          job.status ===
                          "CANCELLED"
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: "JOB",
                            item: job,
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        <Trash2
                          size={16}
                        />
                        Delete
                      </button>
                    </div>
                  </article>
                ),
              )
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredCandidates.length ===
            0 ? (
              <div className="p-5">
                <EmptyState message="No candidates found." />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeading text="Candidate" />
                    <TableHeading text="Job" />
                    <TableHeading text="Experience" />
                    <TableHeading text="Stage" />
                    <TableHeading text="Applied" />
                    <TableHeading text="Actions" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map(
                    (candidate) => (
                      <tr
                        key={
                          candidate.id
                        }
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {
                              candidate.firstName
                            }{" "}
                            {
                              candidate.lastName
                            }
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Mail
                              size={13}
                            />
                            {
                              candidate.email
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {
                            candidate
                              .jobOpening
                              .title
                          }
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {
                            candidate.yearsOfExperience
                          }{" "}
                          years
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={
                              candidate.stage
                            }
                            disabled={
                              actionId ===
                              candidate.id
                            }
                            onChange={(
                              event,
                            ) =>
                              void handleCandidateStage(
                                candidate.id,
                                event
                                  .target
                                  .value as CandidateStage,
                              )
                            }
                            className={`rounded-lg px-3 py-2 text-sm font-semibold ${candidateStageClass(
                              candidate.stage,
                            )}`}
                          >
                            {candidateStages.map(
                              (stage) => (
                                <option
                                  key={
                                    stage
                                  }
                                  value={
                                    stage
                                  }
                                >
                                  {formatLabel(
                                    stage,
                                  )}
                                </option>
                              ),
                            )}
                          </select>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            candidate.appliedAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditCandidateForm(
                                  candidate,
                                )
                              }
                              className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                            >
                              <Edit3
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget(
                                  {
                                    type: "CANDIDATE",
                                    item: candidate,
                                  },
                                )
                              }
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {showJobForm ? (
        <Modal
          title={
            editingJob
              ? "Edit Job Opening"
              : "Create Job Opening"
          }
          onClose={closeJobForm}
        >
          <form
            onSubmit={
              handleJobSubmit
            }
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                label="Job title"
                value={jobForm.title}
                required
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      title: value,
                    }),
                  )
                }
              />

              <FormSelect
                label="Employment type"
                value={
                  jobForm.employmentType
                }
                options={[
                  "FULL_TIME",
                  "PART_TIME",
                  "CONTRACT",
                  "INTERNSHIP",
                  "TEMPORARY",
                ]}
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      employmentType:
                        value as EmploymentType,
                    }),
                  )
                }
              />

              <FormInput
                label="Vacancies"
                type="number"
                value={
                  jobForm.numberOfVacancies
                }
                required
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      numberOfVacancies:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Minimum experience"
                type="number"
                value={
                  jobForm.minimumExperience
                }
                required
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      minimumExperience:
                        value,
                    }),
                  )
                }
              />

              <FormSelect
                label="Department"
                value={
                  jobForm.departmentId
                }
                options={departments.map(
                  (department) => ({
                    value:
                      department.id,
                    label:
                      department.name,
                  }),
                )}
                emptyLabel="No department"
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      departmentId:
                        value,
                      positionId: "",
                    }),
                  )
                }
              />

              <FormSelect
                label="Position"
                value={
                  jobForm.positionId
                }
                options={filteredPositions.map(
                  (position) => ({
                    value:
                      position.id,
                    label:
                      position.title,
                  }),
                )}
                emptyLabel="No position"
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      positionId:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Location"
                value={
                  jobForm.location
                }
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      location:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Deadline"
                type="datetime-local"
                value={
                  jobForm.applicationDeadline
                }
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      applicationDeadline:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Minimum salary"
                type="number"
                value={
                  jobForm.salaryMin
                }
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      salaryMin:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Maximum salary"
                type="number"
                value={
                  jobForm.salaryMax
                }
                onChange={(value) =>
                  setJobForm(
                    (current) => ({
                      ...current,
                      salaryMax:
                        value,
                    }),
                  )
                }
              />
            </div>

            <FormTextarea
              label="Description"
              value={
                jobForm.description
              }
              required
              onChange={(value) =>
                setJobForm(
                  (current) => ({
                    ...current,
                    description:
                      value,
                  }),
                )
              }
            />

            <FormTextarea
              label="Required skills"
              value={
                jobForm.requiredSkills
              }
              onChange={(value) =>
                setJobForm(
                  (current) => ({
                    ...current,
                    requiredSkills:
                      value,
                  }),
                )
              }
            />

            <FormTextarea
              label="Responsibilities"
              value={
                jobForm.responsibilities
              }
              onChange={(value) =>
                setJobForm(
                  (current) => ({
                    ...current,
                    responsibilities:
                      value,
                  }),
                )
              }
            />

            <FormTextarea
              label="Requirements"
              value={
                jobForm.requirements
              }
              onChange={(value) =>
                setJobForm(
                  (current) => ({
                    ...current,
                    requirements:
                      value,
                  }),
                )
              }
            />

            <FormActions
              saving={saving}
              onCancel={
                closeJobForm
              }
              submitLabel={
                editingJob
                  ? "Save Changes"
                  : "Create Job"
              }
            />
          </form>
        </Modal>
      ) : null}

      {showCandidateForm ? (
        <Modal
          title={
            editingCandidate
              ? "Edit Candidate"
              : "Add Candidate"
          }
          onClose={
            closeCandidateForm
          }
        >
          <form
            onSubmit={
              handleCandidateSubmit
            }
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                label="First name"
                value={
                  candidateForm.firstName
                }
                required
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      firstName:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Last name"
                value={
                  candidateForm.lastName
                }
                required
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      lastName:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Email"
                type="email"
                value={
                  candidateForm.email
                }
                required
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      email: value,
                    }),
                  )
                }
              />

              <FormInput
                label="Phone"
                type="tel"
                value={
                  candidateForm.phone
                }
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      phone: sanitizePhoneDigits(value),
                    }),
                  )
                }
              />

              <FormSelect
                label="Job opening"
                value={
                  candidateForm.jobOpeningId
                }
                options={jobOpenings
                  .filter(
                    (job) =>
                      job.status ===
                        "OPEN" ||
                      job.status ===
                        "DRAFT" ||
                      job.id ===
                        editingCandidate
                          ?.jobOpeningId,
                  )
                  .map((job) => ({
                    value: job.id,
                    label: job.title,
                  }))}
                emptyLabel="Select job"
                required
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      jobOpeningId:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Experience in years"
                type="number"
                value={
                  candidateForm.yearsOfExperience
                }
                required
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      yearsOfExperience:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Current job title"
                value={
                  candidateForm.currentJobTitle
                }
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      currentJobTitle:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Current company"
                value={
                  candidateForm.currentCompany
                }
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      currentCompany:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Applied date"
                type="datetime-local"
                value={
                  candidateForm.appliedAt
                }
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      appliedAt:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Resume file name"
                value={
                  candidateForm.resumeFileName
                }
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      resumeFileName:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Resume URL"
                type="url"
                value={
                  candidateForm.resumeUrl
                }
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      resumeUrl:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="LinkedIn URL"
                type="url"
                value={
                  candidateForm.linkedInUrl
                }
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      linkedInUrl:
                        value,
                    }),
                  )
                }
              />

              <FormInput
                label="Portfolio URL"
                type="url"
                value={
                  candidateForm.portfolioUrl
                }
                onChange={(value) =>
                  setCandidateForm(
                    (current) => ({
                      ...current,
                      portfolioUrl:
                        value,
                    }),
                  )
                }
              />
            </div>

            <FormTextarea
              label="Skills"
              value={
                candidateForm.skills
              }
              onChange={(value) =>
                setCandidateForm(
                  (current) => ({
                    ...current,
                    skills:
                      value,
                  }),
                )
              }
            />

            <FormTextarea
              label="Education"
              value={
                candidateForm.education
              }
              onChange={(value) =>
                setCandidateForm(
                  (current) => ({
                    ...current,
                    education:
                      value,
                  }),
                )
              }
            />

            <FormTextarea
              label="Address"
              value={
                candidateForm.address
              }
              onChange={(value) =>
                setCandidateForm(
                  (current) => ({
                    ...current,
                    address:
                      value,
                  }),
                )
              }
            />

            <FormTextarea
              label="Notes"
              value={
                candidateForm.notes
              }
              onChange={(value) =>
                setCandidateForm(
                  (current) => ({
                    ...current,
                    notes:
                      value,
                  }),
                )
              }
            />

            <FormActions
              saving={saving}
              onCancel={
                closeCandidateForm
              }
              submitLabel={
                editingCandidate
                  ? "Save Changes"
                  : "Add Candidate"
              }
            />
          </form>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Trash2 size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Delete{" "}
                    {deleteTarget.type ===
                    "JOB"
                      ? "job opening"
                      : "candidate"}
                    ?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You are about to
                    delete{" "}
                    <strong>
                      {deleteTarget.type ===
                      "JOB"
                        ? deleteTarget.item
                            .title
                        : `${deleteTarget.item.firstName} ${deleteTarget.item.lastName}`}
                    </strong>
                    .
                  </p>

                  <p className="mt-2 text-sm font-medium text-red-600">
                    This action cannot be
                    undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteTarget(
                    null,
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  void handleDelete()
                }
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description?: string;
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

      {description ? (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      ) : null}
    </article>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function TableHeading({
  text,
}: {
  text: string;
}) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {text}
    </th>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        inputMode={
          type === "tel" ? "numeric" : undefined
        }
        pattern={
          type === "tel" ? "[0-9]*" : undefined
        }
        maxLength={
          type === "tel" ? 15 : undefined
        }
        min={
          type === "number"
            ? "0"
            : undefined
        }
        step={
          type === "number"
            ? "0.01"
            : undefined
        }
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
      />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        required={required}
        rows={4}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  options,
  onChange,
  emptyLabel,
  required = false,
}: {
  label: string;
  value: string;
  options:
    | string[]
    | Array<{
        value: string;
        label: string;
      }>;
  onChange: (value: string) => void;
  emptyLabel?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
      >
        {emptyLabel ? (
          <option value="">
            {emptyLabel}
          </option>
        ) : null}

        {options.map((option) => {
          if (
            typeof option ===
            "string"
          ) {
            return (
              <option
                key={option}
                value={option}
              >
                {formatLabel(option)}
              </option>
            );
          }

          return (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function FormActions({
  saving,
  onCancel,
  submitLabel,
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
      <button
        type="button"
        disabled={saving}
        onClick={onCancel}
        className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : submitLabel}
      </button>
    </div>
  );
}