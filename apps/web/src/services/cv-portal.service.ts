import { api } from "../lib/api";

export type CvAnalysisStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type CandidateStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFERED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export type HiringRecommendation =
  | "HIGHLY_RECOMMENDED"
  | "RECOMMENDED"
  | "CONSIDER"
  | "NOT_RECOMMENDED";

export interface CvPortalJob {
  id: string;
  title: string;
  description: string;
  employmentType: string;
  numberOfVacancies: number;
  minimumExperience: number;
  requiredSkills: string | null;
  responsibilities: string | null;
  requirements: string | null;
  location: string | null;
  applicationDeadline: string | null;
  createdAt: string;

  department: {
    id: string;
    name: string;
  } | null;

  position: {
    id: string;
    title: string;
  } | null;
}

export interface EmployeeCvAnalysisSummary {
  id: string;
  status: CvAnalysisStatus;
  errorMessage: string | null;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCvSubmission {
  id: string;

  firstName: string;
  lastName: string;

  email: string;
  phone: string | null;

  currentJobTitle: string | null;
  currentCompany: string | null;

  yearsOfExperience: string | number;

  resumeFileName: string | null;
  resumeUrl: string | null;
  resumeMimeType: string | null;
  resumeSizeBytes: number | null;
  resumeUploadedAt: string | null;

  linkedInUrl: string | null;
  portfolioUrl: string | null;

  stage: CandidateStage;

  notes: string | null;

  appliedAt: string;

  isSelfSubmitted: boolean;

  jobOpening: {
    id: string;
    title: string;
    description: string;
    employmentType: string;
    status: string;
    minimumExperience: number;
    requiredSkills: string | null;
    location: string | null;
    applicationDeadline: string | null;

    department: {
      id: string;
      name: string;
    } | null;

    position: {
      id: string;
      title: string;
    } | null;
  };

  cvAnalysis: EmployeeCvAnalysisSummary | null;

  createdAt: string;
  updatedAt: string;
}

export interface CvAnalysis {
  id: string;
  candidateId: string;

  status: CvAnalysisStatus;

  extractedText: string | null;

  extractedName: string | null;
  extractedEmail: string | null;
  extractedPhone: string | null;
  extractedJobTitle: string | null;
  extractedEducation: string | null;
  extractedExperience: string | null;
  extractedSkills: string[] | null;

  localMatchScore: string | number | null;
  aiMatchScore: string | number | null;
  finalMatchScore: string | number | null;

  skillsScore: string | number | null;
  experienceScore: string | number | null;
  jobTitleScore: string | number | null;
  educationScore: string | number | null;
  completenessScore: string | number | null;

  summary: string | null;

  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  strengths: string[] | null;
  concerns: string[] | null;
  interviewQuestions: string[] | null;

  recommendation: HiringRecommendation | null;

  recommendedSalaryMin: string | number | null;
  recommendedSalaryTarget: string | number | null;
  recommendedSalaryMax: string | number | null;

  salaryRecommendationReason: string | null;

  modelUsed: string | null;
  errorMessage: string | null;
  analyzedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface HrCvSubmission {
  id: string;

  firstName: string;
  lastName: string;

  email: string;
  phone: string | null;

  currentJobTitle: string | null;
  currentCompany: string | null;

  yearsOfExperience: string | number;

  skills: string | null;
  education: string | null;

  resumeFileName: string | null;
  resumeUrl: string | null;

  stage: CandidateStage;

  appliedAt: string;
  isSelfSubmitted: boolean;

  jobOpening: {
    id: string;
    title: string;
    description: string;
    employmentType: string;
    status: string;
    minimumExperience: number;
    requiredSkills: string | null;
    responsibilities: string | null;
    requirements: string | null;
    salaryMin: string | number | null;
    salaryMax: string | number | null;
    location: string | null;
    applicationDeadline: string | null;

    department: {
      id: string;
      name: string;
    } | null;

    position: {
      id: string;
      title: string;
    } | null;
  };

  submittedByEmployee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;

    department: {
      id: string;
      name: string;
    } | null;

    position: {
      id: string;
      title: string;
    } | null;
  } | null;

  createdBy: {
    id: string;
    email: string;
    role: string;
  };

  cvAnalysis: CvAnalysis | null;

  createdAt: string;
  updatedAt: string;
}

export interface CandidateRankingItem {
  rank: number;
  candidateId: string;
  candidateName: string;
  email: string;
  phone: string | null;
  currentJobTitle: string | null;
  currentCompany: string | null;
  yearsOfExperience: number;
  stage: CandidateStage;
  appliedAt: string;

  submittedByEmployee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;

    department: {
      id: string;
      name: string;
    } | null;

    position: {
      id: string;
      title: string;
    } | null;
  } | null;

  jobOpening: {
    id: string;
    title: string;
    employmentType: string;
    status: string;
    salaryMin: string | number | null;
    salaryMax: string | number | null;
  };

  analysis: CvAnalysis | null;
}

export interface JobCandidateRanking {
  jobOpening: {
    id: string;
    title: string;
    status: string;
    numberOfVacancies: number;

    department: {
      id: string;
      name: string;
    } | null;

    position: {
      id: string;
      title: string;
    } | null;
  };

  totalCandidates: number;

  rankedCandidates: CandidateRankingItem[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateMyCvSubmissionInput {
  jobOpeningId: string;
  yearsOfExperience: number;
  currentJobTitle?: string;
  currentCompany?: string;
  phone?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  notes?: string;
  cv: File;
}

export async function getCvPortalJobs(): Promise<CvPortalJob[]> {
  const response =
    await api.get<ApiResponse<CvPortalJob[]>>(
      "/cv-portal/jobs",
    );

  return response.data.data;
}

export async function createMyCvSubmission(
  input: CreateMyCvSubmissionInput,
): Promise<EmployeeCvSubmission> {
  const formData =
    new FormData();

  formData.append(
    "jobOpeningId",
    input.jobOpeningId,
  );

  formData.append(
    "yearsOfExperience",
    String(input.yearsOfExperience),
  );

  formData.append(
    "cv",
    input.cv,
  );

  if (input.currentJobTitle) {
    formData.append(
      "currentJobTitle",
      input.currentJobTitle,
    );
  }

  if (input.currentCompany) {
    formData.append(
      "currentCompany",
      input.currentCompany,
    );
  }

  if (input.phone) {
    formData.append(
      "phone",
      input.phone,
    );
  }

  if (input.linkedInUrl) {
    formData.append(
      "linkedInUrl",
      input.linkedInUrl,
    );
  }

  if (input.portfolioUrl) {
    formData.append(
      "portfolioUrl",
      input.portfolioUrl,
    );
  }

  if (input.notes) {
    formData.append(
      "notes",
      input.notes,
    );
  }

  const response =
    await api.post<ApiResponse<EmployeeCvSubmission>>(
      "/cv-portal/my",
      formData,
    );

  return response.data.data;
}

export async function getMyCvSubmissions(): Promise<
  EmployeeCvSubmission[]
> {
  const response =
    await api.get<ApiResponse<EmployeeCvSubmission[]>>(
      "/cv-portal/my",
    );

  return response.data.data;
}

export async function getMyCvSubmissionById(
  id: string,
): Promise<EmployeeCvSubmission> {
  const response =
    await api.get<ApiResponse<EmployeeCvSubmission>>(
      `/cv-portal/my/${id}`,
    );

  return response.data.data;
}

export async function withdrawMyCvSubmission(
  id: string,
): Promise<EmployeeCvSubmission> {
  const response =
    await api.delete<ApiResponse<EmployeeCvSubmission>>(
      `/cv-portal/my/${id}`,
    );

  return response.data.data;
}

export async function getAllCvSubmissions(): Promise<
  HrCvSubmission[]
> {
  const response =
    await api.get<ApiResponse<HrCvSubmission[]>>(
      "/cv-portal/submissions",
    );

  return response.data.data;
}

export async function getCvSubmissionForHr(
  id: string,
): Promise<HrCvSubmission> {
  const response =
    await api.get<ApiResponse<HrCvSubmission>>(
      `/cv-portal/submissions/${id}`,
    );

  return response.data.data;
}

export async function analyzeCvSubmission(
  id: string,
): Promise<CvAnalysis> {
  const response =
    await api.post<ApiResponse<CvAnalysis>>(
      `/cv-portal/submissions/${id}/analyze`,
    );

  return response.data.data;
}

export async function reanalyzeCvSubmission(
  id: string,
): Promise<CvAnalysis> {
  const response =
    await api.post<ApiResponse<CvAnalysis>>(
      `/cv-portal/submissions/${id}/reanalyze`,
    );

  return response.data.data;
}

export async function getCvAnalysisForHr(
  id: string,
): Promise<CvAnalysis> {
  const response =
    await api.get<ApiResponse<CvAnalysis>>(
      `/cv-portal/submissions/${id}/analysis`,
    );

  return response.data.data;
}

export async function getAnalyzedCvSubmissions(): Promise<
  HrCvSubmission[]
> {
  const response =
    await api.get<ApiResponse<HrCvSubmission[]>>(
      "/cv-portal/submissions/analyzed",
    );

  return response.data.data;
}

export async function getPendingCvSubmissions(): Promise<
  HrCvSubmission[]
> {
  const response =
    await api.get<ApiResponse<HrCvSubmission[]>>(
      "/cv-portal/submissions/pending",
    );

  return response.data.data;
}

export async function getJobCandidateRanking(
  jobOpeningId: string,
): Promise<JobCandidateRanking> {
  const response =
    await api.get<ApiResponse<JobCandidateRanking>>(
      `/cv-portal/jobs/${jobOpeningId}/ranking`,
    );

  return response.data.data;
}

export async function deleteCvSubmission(
  id: string,
): Promise<{ id: string }> {
  const response =
    await api.delete<ApiResponse<{ id: string }>>(
      `/cv-portal/submissions/${id}`,
    );

  return response.data.data;
}