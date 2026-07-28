import {
  Router,
} from "express";

import {
  authenticate,
} from "../../middleware/authenticate.js";

import {
  authorizeRoles,
} from "../../middleware/authorizeRoles.js";

import {
  validateRequest,
} from "../../middleware/validateRequest.js";

import {
  analyzeCvSubmissionController,
  createMyCvSubmissionController,
  deleteCvSubmissionController,
  getAllCvSubmissionsController,
  getAnalyzedCvSubmissionsController,
  getCvAnalysisForHrController,
  getCvPortalJobsController,
  getCvSubmissionForHrController,
  getJobCandidateRankingController,
  getMyCvSubmissionController,
  getMyCvSubmissionsController,
  getPendingCvSubmissionsController,
  reanalyzeCvSubmissionController,
  withdrawMyCvSubmissionController,
} from "./cv-portal.controller.js";

import {
  createMyCvSubmissionSchema,
  cvPortalIdSchema,
} from "./cv-portal.schema.js";

import {
  handleCvUpload,
} from "./cv-upload.middleware.js";

const cvPortalRouter =
  Router();

cvPortalRouter.use(
  authenticate,
);

cvPortalRouter.get(
  "/jobs",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
    "EMPLOYEE",
  ),
  getCvPortalJobsController,
);

cvPortalRouter.post(
  "/my",
  authorizeRoles(
    "EMPLOYEE",
  ),
  handleCvUpload,
  validateRequest(
    createMyCvSubmissionSchema,
  ),
  createMyCvSubmissionController,
);

cvPortalRouter.get(
  "/my",
  authorizeRoles(
    "EMPLOYEE",
  ),
  getMyCvSubmissionsController,
);

cvPortalRouter.get(
  "/my/:id",
  authorizeRoles(
    "EMPLOYEE",
  ),
  validateRequest(
    cvPortalIdSchema,
  ),
  getMyCvSubmissionController,
);

cvPortalRouter.delete(
  "/my/:id",
  authorizeRoles(
    "EMPLOYEE",
  ),
  validateRequest(
    cvPortalIdSchema,
  ),
  withdrawMyCvSubmissionController,
);

cvPortalRouter.get(
  "/submissions",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getAllCvSubmissionsController,
);

cvPortalRouter.get(
  "/submissions/analyzed",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getAnalyzedCvSubmissionsController,
);

cvPortalRouter.get(
  "/submissions/pending",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getPendingCvSubmissionsController,
);

cvPortalRouter.get(
  "/submissions/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    cvPortalIdSchema,
  ),
  getCvSubmissionForHrController,
);

cvPortalRouter.post(
  "/submissions/:id/analyze",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    cvPortalIdSchema,
  ),
  analyzeCvSubmissionController,
);

cvPortalRouter.post(
  "/submissions/:id/reanalyze",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    cvPortalIdSchema,
  ),
  reanalyzeCvSubmissionController,
);

cvPortalRouter.get(
  "/submissions/:id/analysis",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    cvPortalIdSchema,
  ),
  getCvAnalysisForHrController,
);

cvPortalRouter.get(
  "/jobs/:id/ranking",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    cvPortalIdSchema,
  ),
  getJobCandidateRankingController,
);

cvPortalRouter.delete(
  "/submissions/:id",
  authorizeRoles(
    "SUPER_ADMIN",
  ),
  validateRequest(
    cvPortalIdSchema,
  ),
  deleteCvSubmissionController,
);

export default cvPortalRouter;