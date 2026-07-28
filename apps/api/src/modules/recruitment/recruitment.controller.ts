import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../../middleware/authenticate.js";

import {
  createCandidate,
  createJobOpening,
  deleteCandidate,
  deleteJobOpening,
  getCandidateById,
  getCandidates,
  getJobOpeningById,
  getJobOpenings,
  updateCandidate,
  updateCandidateStage,
  updateJobOpening,
  updateJobOpeningStatus,
} from "./recruitment.service.js";

function getRequestUserId(
  request: Request,
): string {
  const authenticatedRequest =
    request as AuthenticatedRequest;

  const userId =
    authenticatedRequest.user?.id;

  if (!userId) {
    throw new Error(
      "Authentication required",
    );
  }

  return userId;
}

function getRequestId(
  request: Request,
): string {
  const id =
    request.params["id"];

  if (
    typeof id !== "string" ||
    id.trim().length === 0
  ) {
    throw new Error(
      "ID is required",
    );
  }

  return id.trim();
}

export async function createJobOpeningController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const createdById =
      getRequestUserId(request);

    const jobOpening =
      await createJobOpening(
        request.body,
        createdById,
      );

    response.status(201).json({
      success: true,
      message:
        "Job opening created successfully",
      data: jobOpening,
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobOpeningsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const jobOpenings =
      await getJobOpenings();

    response.status(200).json({
      success: true,
      message:
        "Job openings retrieved successfully",
      data: jobOpenings,
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobOpeningController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequestId(request);

    const jobOpening =
      await getJobOpeningById(
        id,
      );

    response.status(200).json({
      success: true,
      message:
        "Job opening retrieved successfully",
      data: jobOpening,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJobOpeningController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequestId(request);

    const jobOpening =
      await updateJobOpening(
        id,
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Job opening updated successfully",
      data: jobOpening,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJobOpeningStatusController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequestId(request);

    const jobOpening =
      await updateJobOpeningStatus(
        id,
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Job opening status updated successfully",
      data: jobOpening,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteJobOpeningController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequestId(request);

    const result =
      await deleteJobOpening(id);

    response.status(200).json({
      success: true,
      message:
        "Job opening deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCandidateController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const createdById =
      getRequestUserId(request);

    const candidate =
      await createCandidate(
        request.body,
        createdById,
      );

    response.status(201).json({
      success: true,
      message:
        "Candidate created successfully",
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCandidatesController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const candidates =
      await getCandidates();

    response.status(200).json({
      success: true,
      message:
        "Candidates retrieved successfully",
      data: candidates,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCandidateController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequestId(request);

    const candidate =
      await getCandidateById(id);

    response.status(200).json({
      success: true,
      message:
        "Candidate retrieved successfully",
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCandidateController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequestId(request);

    const candidate =
      await updateCandidate(
        id,
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Candidate updated successfully",
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCandidateStageController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequestId(request);

    const candidate =
      await updateCandidateStage(
        id,
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Candidate stage updated successfully",
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCandidateController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequestId(request);

    const result =
      await deleteCandidate(id);

    response.status(200).json({
      success: true,
      message:
        "Candidate deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}