import {
    UserRole,
} from "../../generated/prisma/client.js";

import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    addEmployeePerformanceComment,
    completePerformanceReview,
    createPerformanceReview,
    deletePerformanceReview,
    getPerformanceReviewById,
    getPerformanceReviews,
    updatePerformanceReview,
} from "./performance.service.js";

type AuthenticatedRequest =
  Request & {
    user?: {
      id?: string;
      userId?: string;
      sub?: string;
      role?:
        | UserRole
        | string;
    };
  };

function getRequestUser(
  request: Request,
): {
  userId: string;
  role: UserRole;
} {
  const authenticatedRequest =
    request as AuthenticatedRequest;

  const userId =
    authenticatedRequest.user
      ?.id ??
    authenticatedRequest.user
      ?.userId ??
    authenticatedRequest.user
      ?.sub;

  const role =
    authenticatedRequest.user
      ?.role;

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
    role:
      role as UserRole,
  };
}

function getPerformanceId(
  request: Request,
): string {
  const id =
    request.params["id"];

  if (
    typeof id !== "string" ||
    id.trim().length === 0
  ) {
    throw new Error(
      "Performance review ID is required",
    );
  }

  return id.trim();
}

export async function createPerformanceController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user =
      getRequestUser(
        request,
      );

    const review =
      await createPerformanceReview(
        request.body,
        user.userId,
      );

    response.status(201).json({
      success: true,
      message:
        "Performance review created successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPerformanceReviewsController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user =
      getRequestUser(
        request,
      );

    const reviews =
      await getPerformanceReviews(
        user,
      );

    response.status(200).json({
      success: true,
      message:
        "Performance reviews retrieved successfully",
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPerformanceReviewController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getPerformanceId(
        request,
      );

    const user =
      getRequestUser(
        request,
      );

    const review =
      await getPerformanceReviewById(
        id,
        user,
      );

    response.status(200).json({
      success: true,
      message:
        "Performance review retrieved successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePerformanceController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getPerformanceId(
        request,
      );

    const review =
      await updatePerformanceReview(
        id,
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Performance review updated successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

export async function completePerformanceController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getPerformanceId(
        request,
      );

    const review =
      await completePerformanceReview(
        id,
      );

    response.status(200).json({
      success: true,
      message:
        "Performance review completed successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

export async function addEmployeeCommentController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getPerformanceId(
        request,
      );

    const user =
      getRequestUser(
        request,
      );

    const review =
      await addEmployeePerformanceComment(
        id,
        request.body
          .employeeComments,
        user.userId,
      );

    response.status(200).json({
      success: true,
      message:
        "Employee comment added successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePerformanceController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getPerformanceId(
        request,
      );

    const result =
      await deletePerformanceReview(
        id,
      );

    response.status(200).json({
      success: true,
      message:
        "Performance review deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}