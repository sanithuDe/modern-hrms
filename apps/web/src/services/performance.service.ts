import { api } from "../lib/api";

export type PerformancePeriod =
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "YEARLY";

export type PerformanceStatus =
  | "DRAFT"
  | "COMPLETED";

export interface PerformanceEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;

  department: {
    id: string;
    name: string;
  } | null;

  position: {
    id: string;
    title: string;
  } | null;
}

export interface PerformanceCreator {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  createdById: string | null;

  title: string;
  reviewDate: string;
  period: PerformancePeriod;
  status: PerformanceStatus;

  productivityScore: number;
  qualityScore: number;
  teamworkScore: number;
  attendanceScore: number;
  communicationScore: number;

  overallScore: string | number;

  strengths: string | null;
  improvements: string | null;
  reviewerComments: string | null;
  employeeComments: string | null;

  employee: PerformanceEmployee;
  createdBy: PerformanceCreator | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreatePerformanceInput {
  employeeId: string;
  title: string;
  reviewDate: string;
  period: PerformancePeriod;

  productivityScore: number;
  qualityScore: number;
  teamworkScore: number;
  attendanceScore: number;
  communicationScore: number;

  strengths?: string;
  improvements?: string;
  reviewerComments?: string;
}

export type UpdatePerformanceInput =
  Partial<CreatePerformanceInput>;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getPerformanceReviews(): Promise<
  PerformanceReview[]
> {
  const response =
    await api.get<
      ApiResponse<PerformanceReview[]>
    >("/performance");

  return response.data.data;
}

export async function getPerformanceReviewById(
  reviewId: string,
): Promise<PerformanceReview> {
  const response =
    await api.get<
      ApiResponse<PerformanceReview>
    >(
      `/performance/${reviewId}`,
    );

  return response.data.data;
}

export async function createPerformanceReview(
  input: CreatePerformanceInput,
): Promise<PerformanceReview> {
  const response =
    await api.post<
      ApiResponse<PerformanceReview>
    >(
      "/performance",
      input,
    );

  return response.data.data;
}

export async function updatePerformanceReview(
  reviewId: string,
  input: UpdatePerformanceInput,
): Promise<PerformanceReview> {
  const response =
    await api.patch<
      ApiResponse<PerformanceReview>
    >(
      `/performance/${reviewId}`,
      input,
    );

  return response.data.data;
}

export async function completePerformanceReview(
  reviewId: string,
): Promise<PerformanceReview> {
  const response =
    await api.patch<
      ApiResponse<PerformanceReview>
    >(
      `/performance/${reviewId}/complete`,
    );

  return response.data.data;
}

export async function addEmployeePerformanceComment(
  reviewId: string,
  employeeComments: string,
): Promise<PerformanceReview> {
  const response =
    await api.patch<
      ApiResponse<PerformanceReview>
    >(
      `/performance/${reviewId}/employee-comment`,
      {
        employeeComments,
      },
    );

  return response.data.data;
}

export async function deletePerformanceReview(
  reviewId: string,
): Promise<{ id: string }> {
  const response =
    await api.delete<
      ApiResponse<{ id: string }>
    >(
      `/performance/${reviewId}`,
    );

  return response.data.data;
}