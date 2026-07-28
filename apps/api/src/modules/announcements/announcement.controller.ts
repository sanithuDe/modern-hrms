import {
  UserRole,
} from "../../generated/prisma/client.js";

import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  archiveAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  getAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
} from "./announcement.service.js";

type AnnouncementRequest =
  Request & {
    user?: {
      id?: string;
      userId?: string;
      sub?: string;
      role?: UserRole | string;
    };
  };

function getRequestUser(
  request: Request,
): {
  userId: string;
  role: UserRole;
} {
  const authenticatedRequest =
    request as AnnouncementRequest;

  const userId =
    authenticatedRequest.user?.id ??
    authenticatedRequest.user?.userId ??
    authenticatedRequest.user?.sub;

  const role =
    authenticatedRequest.user?.role;

  if (!userId) {
    throw new Error(
      "Authentication required",
    );
  }

  if (
    typeof role !== "string" ||
    !Object.values(
      UserRole,
    ).includes(
      role as UserRole,
    )
  ) {
    throw new Error(
      "Authenticated user role was not found",
    );
  }

  return {
    userId,
    role: role as UserRole,
  };
}

function getAnnouncementId(
  request: Request,
): string {
  const id =
    request.params["id"];

  if (
    typeof id !== "string" ||
    id.trim().length === 0
  ) {
    throw new Error(
      "Announcement ID is required",
    );
  }

  return id.trim();
}

export async function createAnnouncementController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user =
      getRequestUser(request);

    const announcement =
      await createAnnouncement(
        request.body,
        user.userId,
      );

    response.status(201).json({
      success: true,
      message:
        "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnnouncementsController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user =
      getRequestUser(request);

    const announcements =
      await getAnnouncements(user);

    response.status(200).json({
      success: true,
      message:
        "Announcements retrieved successfully",
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnnouncementController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getAnnouncementId(
        request,
      );

    const user =
      getRequestUser(request);

    const announcement =
      await getAnnouncementById(
        id,
        user,
      );

    response.status(200).json({
      success: true,
      message:
        "Announcement retrieved successfully",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAnnouncementController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getAnnouncementId(
        request,
      );

    const announcement =
      await updateAnnouncement(
        id,
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Announcement updated successfully",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
}

export async function publishAnnouncementController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getAnnouncementId(
        request,
      );

    const announcement =
      await publishAnnouncement(id);

    response.status(200).json({
      success: true,
      message:
        "Announcement published successfully",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveAnnouncementController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getAnnouncementId(
        request,
      );

    const announcement =
      await archiveAnnouncement(id);

    response.status(200).json({
      success: true,
      message:
        "Announcement archived successfully",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAnnouncementController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getAnnouncementId(
        request,
      );

    const result =
      await deleteAnnouncement(id);

    response.status(200).json({
      success: true,
      message:
        "Announcement deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}