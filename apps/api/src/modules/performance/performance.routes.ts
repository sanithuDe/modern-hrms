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
    addEmployeeCommentController,
    completePerformanceController,
    createPerformanceController,
    deletePerformanceController,
    getPerformanceReviewController,
    getPerformanceReviewsController,
    updatePerformanceController,
} from "./performance.controller.js";

import {
    createPerformanceSchema,
    employeeCommentSchema,
    performanceIdSchema,
    updatePerformanceSchema,
} from "./performance.schema.js";

const performanceRouter =
  Router();

performanceRouter.use(
  authenticate,
);

performanceRouter.get(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
    "EMPLOYEE",
  ),
  getPerformanceReviewsController,
);

performanceRouter.post(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    createPerformanceSchema,
  ),
  createPerformanceController,
);

performanceRouter.patch(
  "/:id/complete",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    performanceIdSchema,
  ),
  completePerformanceController,
);

performanceRouter.patch(
  "/:id/employee-comment",
  authorizeRoles(
    "EMPLOYEE",
  ),
  validateRequest(
    employeeCommentSchema,
  ),
  addEmployeeCommentController,
);

performanceRouter.get(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
    "EMPLOYEE",
  ),
  validateRequest(
    performanceIdSchema,
  ),
  getPerformanceReviewController,
);

performanceRouter.patch(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    updatePerformanceSchema,
  ),
  updatePerformanceController,
);

performanceRouter.delete(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    performanceIdSchema,
  ),
  deletePerformanceController,
);

export default performanceRouter;