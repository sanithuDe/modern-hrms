import type {
    NextFunction,
    Request,
    Response,
} from "express";

import type {
    AuthenticatedRequest,
} from "../../middleware/authenticate.js";

import {
    analyzeCvSubmission,
    getAnalyzedCvSubmissions,
    getCvAnalysisForHr,
    getJobCandidateRanking,
    getPendingCvSubmissions,
} from "./cv-analysis.service.js";

import {
    createMyCvSubmission,
    getAllCvSubmissions,
    getCvPortalJobs,
    getCvSubmissionForHr,
    getMyCvSubmissionById,
    getMyCvSubmissions,
    permanentlyDeleteCvSubmission,
    withdrawMyCvSubmission,
} from "./cv-portal.service.js";

function getAuthenticatedUserId(
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

export async function getCvPortalJobsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const jobs =
      await getCvPortalJobs();

    response.status(200).json({
      success: true,
      message:
        "Open job positions retrieved successfully",
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
}

export async function createMyCvSubmissionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId =
      getAuthenticatedUserId(
        request,
      );

    const submission =
      await createMyCvSubmission(
        userId,
        request.body,
        request.file,
      );

    response.status(201).json({
      success: true,
      message:
        "CV submitted successfully",
      data:
        submission,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyCvSubmissionsController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId =
      getAuthenticatedUserId(
        request,
      );

    const submissions =
      await getMyCvSubmissions(
        userId,
      );

    response.status(200).json({
      success: true,
      message:
        "Your CV submissions were retrieved successfully",
      data:
        submissions,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyCvSubmissionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId =
      getAuthenticatedUserId(
        request,
      );

    const submissionId =
      getRequestId(
        request,
      );

    const submission =
      await getMyCvSubmissionById(
        userId,
        submissionId,
      );

    response.status(200).json({
      success: true,
      message:
        "CV submission retrieved successfully",
      data:
        submission,
    });
  } catch (error) {
    next(error);
  }
}

export async function withdrawMyCvSubmissionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId =
      getAuthenticatedUserId(
        request,
      );

    const submissionId =
      getRequestId(
        request,
      );

    const submission =
      await withdrawMyCvSubmission(
        userId,
        submissionId,
      );

    response.status(200).json({
      success: true,
      message:
        "CV submission withdrawn successfully",
      data:
        submission,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllCvSubmissionsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submissions =
      await getAllCvSubmissions();

    response.status(200).json({
      success: true,
      message:
        "CV submissions retrieved successfully",
      data:
        submissions,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCvSubmissionForHrController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submissionId =
      getRequestId(
        request,
      );

    const submission =
      await getCvSubmissionForHr(
        submissionId,
      );

    response.status(200).json({
      success: true,
      message:
        "CV submission retrieved successfully",
      data:
        submission,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCvSubmissionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submissionId =
      getRequestId(
        request,
      );

    const result =
      await permanentlyDeleteCvSubmission(
        submissionId,
      );

    response.status(200).json({
      success: true,
      message:
        "CV submission deleted successfully",
      data:
        result,
    });
  } catch (error) {
    next(error);
  }
}

export async function analyzeCvSubmissionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submissionId =
      getRequestId(
        request,
      );

    const analysis =
      await analyzeCvSubmission(
        submissionId,
        false,
      );

    response.status(200).json({
      success: true,
      message:
        "CV analyzed successfully",
      data:
        analysis,
    });
  } catch (error) {
    next(error);
  }
}

export async function reanalyzeCvSubmissionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submissionId =
      getRequestId(
        request,
      );

    const analysis =
      await analyzeCvSubmission(
        submissionId,
        true,
      );

    response.status(200).json({
      success: true,
      message:
        "CV reanalyzed successfully",
      data:
        analysis,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCvAnalysisForHrController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submissionId =
      getRequestId(
        request,
      );

    const analysis =
      await getCvAnalysisForHr(
        submissionId,
      );

    response.status(200).json({
      success: true,
      message:
        "CV analysis retrieved successfully",
      data:
        analysis,
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobCandidateRankingController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const jobOpeningId =
      getRequestId(
        request,
      );

    const ranking =
      await getJobCandidateRanking(
        jobOpeningId,
      );

    response.status(200).json({
      success: true,
      message:
        "Candidate ranking retrieved successfully",
      data:
        ranking,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnalyzedCvSubmissionsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submissions =
      await getAnalyzedCvSubmissions();

    response.status(200).json({
      success: true,
      message:
        "Analyzed CV submissions retrieved successfully",
      data:
        submissions,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPendingCvSubmissionsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submissions =
      await getPendingCvSubmissions();

    response.status(200).json({
      success: true,
      message:
        "Pending CV submissions retrieved successfully",
      data:
        submissions,
    });
  } catch (error) {
    next(error);
  }
}