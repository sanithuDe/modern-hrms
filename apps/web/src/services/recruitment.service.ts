import { api } from "../lib/api";

export type JobOpeningStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED"
  | "CANCELLED";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "TEMPORARY";

export type CandidateStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFERED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export interface RecruitmentDepartment {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface RecruitmentPosition {
  id: string;
  title: string;
  description?: string | null;
  isActive?: boolean;
  departmentId?: string | null;

  department?: {
    id: string;
    name: string;
  } | null;
}

export interface RecruitmentCreator {
  id: string;
  email: string;
  role: string;

  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  } | null;
}

export interface JobOpening {
  id: string;

  title: string;
  description: string;

  employmentType: EmploymentType;
  status: JobOpeningStatus;

  numberOfVacancies: number;
  minimumExperience: number;

  requiredSkills: string | null;
  responsibilities: string | null;
  requirements: string | null;

  salaryMin: string | number | null;
  salaryMax: string | number | null;

  location: string | null;
  applicationDeadline: string | null;

  departmentId: string | null;
  department: {
    id: string;
    name: string;
  } | null;

  positionId: string | null;
  position: {
    id: string;
    title: string;
  } | null;

  createdById: string;
  createdBy: RecruitmentCreator;

  _count: {
    candidates: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
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
  address: string | null;

  resumeFileName: string | null;
  resumeUrl: string | null;

  linkedInUrl: string | null;
  portfolioUrl: string | null;

  stage: CandidateStage;
  notes: string | null;

  appliedAt: string;

  jobOpeningId: string;

  jobOpening: {
    id: string;
    title: string;
    status: JobOpeningStatus;
    employmentType: EmploymentType;

    department: {
      id: string;
      name: string;
    } | null;

    position: {
      id: string;
      title: string;
    } | null;
  };

  createdById: string;
  createdBy: RecruitmentCreator;

  createdAt: string;
  updatedAt: string;
}

export interface CreateJobOpeningInput {
  title: string;
  description: string;

  employmentType: EmploymentType;

  numberOfVacancies: number;
  minimumExperience: number;

  requiredSkills?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;

  salaryMin?: number | null;
  salaryMax?: number | null;

  location?: string | null;
  applicationDeadline?: string | null;

  departmentId?: string | null;
  positionId?: string | null;
}

export type UpdateJobOpeningInput =
  Partial<CreateJobOpeningInput>;

export interface CreateCandidateInput {
  firstName: string;
  lastName: string;

  email: string;
  phone?: string | null;

  currentJobTitle?: string | null;
  currentCompany?: string | null;

  yearsOfExperience: number;

  skills?: string | null;
  education?: string | null;
  address?: string | null;

  resumeFileName?: string | null;
  resumeUrl?: string | null;

  linkedInUrl?: string | null;
  portfolioUrl?: string | null;

  notes?: string | null;
  appliedAt?: string | null;

  jobOpeningId: string;
}

export type UpdateCandidateInput =
  Partial<CreateCandidateInput>;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getJobOpenings(): Promise<
  JobOpening[]
> {
  const response =
    await api.get<
      ApiResponse<JobOpening[]>
    >("/recruitment/jobs");

  return response.data.data;
}

export async function getJobOpeningById(
  jobOpeningId: string,
): Promise<JobOpening> {
  const response =
    await api.get<
      ApiResponse<JobOpening>
    >(
      `/recruitment/jobs/${jobOpeningId}`,
    );

  return response.data.data;
}

export async function createJobOpening(
  input: CreateJobOpeningInput,
): Promise<JobOpening> {
  const response =
    await api.post<
      ApiResponse<JobOpening>
    >(
      "/recruitment/jobs",
      input,
    );

  return response.data.data;
}

export async function updateJobOpening(
  jobOpeningId: string,
  input: UpdateJobOpeningInput,
): Promise<JobOpening> {
  const response =
    await api.patch<
      ApiResponse<JobOpening>
    >(
      `/recruitment/jobs/${jobOpeningId}`,
      input,
    );

  return response.data.data;
}

export async function updateJobOpeningStatus(
  jobOpeningId: string,
  status: JobOpeningStatus,
): Promise<JobOpening> {
  const response =
    await api.patch<
      ApiResponse<JobOpening>
    >(
      `/recruitment/jobs/${jobOpeningId}/status`,
      {
        status,
      },
    );

  return response.data.data;
}

export async function deleteJobOpening(
  jobOpeningId: string,
): Promise<{ id: string }> {
  const response =
    await api.delete<
      ApiResponse<{ id: string }>
    >(
      `/recruitment/jobs/${jobOpeningId}`,
    );

  return response.data.data;
}

export async function getCandidates(): Promise<
  Candidate[]
> {
  const response =
    await api.get<
      ApiResponse<Candidate[]>
    >("/recruitment/candidates");

  return response.data.data;
}

export async function getCandidateById(
  candidateId: string,
): Promise<Candidate> {
  const response =
    await api.get<
      ApiResponse<Candidate>
    >(
      `/recruitment/candidates/${candidateId}`,
    );

  return response.data.data;
}

export async function createCandidate(
  input: CreateCandidateInput,
): Promise<Candidate> {
  const response =
    await api.post<
      ApiResponse<Candidate>
    >(
      "/recruitment/candidates",
      input,
    );

  return response.data.data;
}

export async function updateCandidate(
  candidateId: string,
  input: UpdateCandidateInput,
): Promise<Candidate> {
  const response =
    await api.patch<
      ApiResponse<Candidate>
    >(
      `/recruitment/candidates/${candidateId}`,
      input,
    );

  return response.data.data;
}

export async function updateCandidateStage(
  candidateId: string,
  stage: CandidateStage,
): Promise<Candidate> {
  const response =
    await api.patch<
      ApiResponse<Candidate>
    >(
      `/recruitment/candidates/${candidateId}/stage`,
      {
        stage,
      },
    );

  return response.data.data;
}

export async function deleteCandidate(
  candidateId: string,
): Promise<{ id: string }> {
  const response =
    await api.delete<
      ApiResponse<{ id: string }>
    >(
      `/recruitment/candidates/${candidateId}`,
    );

  return response.data.data;
}

export async function getRecruitmentDepartments(): Promise<
  RecruitmentDepartment[]
> {
  const response =
    await api.get<
      ApiResponse<RecruitmentDepartment[]>
    >("/departments");

  return response.data.data;
}

export async function getRecruitmentPositions(): Promise<
  RecruitmentPosition[]
> {
  const response =
    await api.get<
      ApiResponse<RecruitmentPosition[]>
    >("/positions");

  return response.data.data;
}