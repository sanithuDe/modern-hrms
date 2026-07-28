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
  createCandidateController,
  createJobOpeningController,
  deleteCandidateController,
  deleteJobOpeningController,
  getCandidateController,
  getCandidatesController,
  getJobOpeningController,
  getJobOpeningsController,
  updateCandidateController,
  updateCandidateStageController,
  updateJobOpeningController,
  updateJobOpeningStatusController,
} from "./recruitment.controller.js";

import {
  createCandidateSchema,
  createJobOpeningSchema,
  recruitmentIdSchema,
  updateCandidateSchema,
  updateCandidateStageSchema,
  updateJobOpeningSchema,
  updateJobStatusSchema,
} from "./recruitment.schema.js";

const recruitmentRouter =
  Router();

recruitmentRouter.use(
  authenticate,
);

recruitmentRouter.use(
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
);

recruitmentRouter.get(
  "/jobs",
  getJobOpeningsController,
);

recruitmentRouter.post(
  "/jobs",
  validateRequest(
    createJobOpeningSchema,
  ),
  createJobOpeningController,
);

recruitmentRouter.get(
  "/jobs/:id",
  validateRequest(
    recruitmentIdSchema,
  ),
  getJobOpeningController,
);

recruitmentRouter.patch(
  "/jobs/:id",
  validateRequest(
    updateJobOpeningSchema,
  ),
  updateJobOpeningController,
);

recruitmentRouter.patch(
  "/jobs/:id/status",
  validateRequest(
    updateJobStatusSchema,
  ),
  updateJobOpeningStatusController,
);

recruitmentRouter.delete(
  "/jobs/:id",
  validateRequest(
    recruitmentIdSchema,
  ),
  deleteJobOpeningController,
);

recruitmentRouter.get(
  "/candidates",
  getCandidatesController,
);

recruitmentRouter.post(
  "/candidates",
  validateRequest(
    createCandidateSchema,
  ),
  createCandidateController,
);

recruitmentRouter.get(
  "/candidates/:id",
  validateRequest(
    recruitmentIdSchema,
  ),
  getCandidateController,
);

recruitmentRouter.patch(
  "/candidates/:id",
  validateRequest(
    updateCandidateSchema,
  ),
  updateCandidateController,
);

recruitmentRouter.patch(
  "/candidates/:id/stage",
  validateRequest(
    updateCandidateStageSchema,
  ),
  updateCandidateStageController,
);

recruitmentRouter.delete(
  "/candidates/:id",
  validateRequest(
    recruitmentIdSchema,
  ),
  deleteCandidateController,
);

export default recruitmentRouter;