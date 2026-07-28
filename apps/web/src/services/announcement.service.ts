import { api } from "../lib/api";

export type AnnouncementStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

export type AnnouncementAudience =
  | "ALL"
  | "SUPER_ADMIN"
  | "HR_MANAGER"
  | "EMPLOYEE";

export interface AnnouncementCreator {
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

export interface Announcement {
  id: string;

  title: string;
  content: string;

  status: AnnouncementStatus;
  audience: AnnouncementAudience;

  isPinned: boolean;

  publishAt: string | null;
  expiresAt: string | null;

  createdById: string;
  createdBy: AnnouncementCreator;

  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  isPinned: boolean;
  publishAt?: string | null;
  expiresAt?: string | null;
}

export type UpdateAnnouncementInput =
  Partial<CreateAnnouncementInput>;

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getAnnouncements(): Promise<
  Announcement[]
> {
  const response =
    await api.get<
      ApiResponse<Announcement[]>
    >("/announcements");

  return response.data.data;
}

export async function getAnnouncementById(
  announcementId: string,
): Promise<Announcement> {
  const response =
    await api.get<
      ApiResponse<Announcement>
    >(
      `/announcements/${announcementId}`,
    );

  return response.data.data;
}

export async function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<Announcement> {
  const response =
    await api.post<
      ApiResponse<Announcement>
    >(
      "/announcements",
      input,
    );

  return response.data.data;
}

export async function updateAnnouncement(
  announcementId: string,
  input: UpdateAnnouncementInput,
): Promise<Announcement> {
  const response =
    await api.patch<
      ApiResponse<Announcement>
    >(
      `/announcements/${announcementId}`,
      input,
    );

  return response.data.data;
}

export async function publishAnnouncement(
  announcementId: string,
): Promise<Announcement> {
  const response =
    await api.patch<
      ApiResponse<Announcement>
    >(
      `/announcements/${announcementId}/publish`,
    );

  return response.data.data;
}

export async function archiveAnnouncement(
  announcementId: string,
): Promise<Announcement> {
  const response =
    await api.patch<
      ApiResponse<Announcement>
    >(
      `/announcements/${announcementId}/archive`,
    );

  return response.data.data;
}

export async function deleteAnnouncement(
  announcementId: string,
): Promise<{ id: string }> {
  const response =
    await api.delete<
      ApiResponse<{ id: string }>
    >(
      `/announcements/${announcementId}`,
    );

  return response.data.data;
}