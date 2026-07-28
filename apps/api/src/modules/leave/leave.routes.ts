import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  cancelMyLeaveRequestController,
  createLeaveBalanceController,
  createLeaveRequestController,
  createLeaveTypeController,
  getLeaveBalancesController,
  getLeaveRequestsController,
  getLeaveTypesController,
  getMyLeaveBalancesController,
  getMyLeaveRequestsController,
  reviewLeaveRequestController,
  updateLeaveBalanceController,
  updateLeaveTypeController,
} from "./leave.controller.js";

import {
  createLeaveBalanceSchema,
  createLeaveRequestSchema,
  createLeaveTypeSchema,
  leaveIdSchema,
  reviewLeaveRequestSchema,
  updateLeaveBalanceSchema,
  updateLeaveTypeSchema,
} from "./leave.schema.js";

const leaveRouter = Router();

leaveRouter.use(authenticate);

leaveRouter.get(
  "/types",
  getLeaveTypesController,
);

leaveRouter.post(
  "/types",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(
    createLeaveTypeSchema,
  ),
  createLeaveTypeController,
);

leaveRouter.patch(
  "/types/:id",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(
    updateLeaveTypeSchema,
  ),
  updateLeaveTypeController,
);

leaveRouter.get(
  "/balances/my",
  getMyLeaveBalancesController,
);

leaveRouter.get(
  "/balances",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getLeaveBalancesController,
);

leaveRouter.post(
  "/balances",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(
    createLeaveBalanceSchema,
  ),
  createLeaveBalanceController,
);

leaveRouter.patch(
  "/balances/:id",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(
    updateLeaveBalanceSchema,
  ),
  updateLeaveBalanceController,
);

leaveRouter.get(
  "/requests/my",
  getMyLeaveRequestsController,
);

leaveRouter.post(
  "/requests",
  validateRequest(
    createLeaveRequestSchema,
  ),
  createLeaveRequestController,
);

leaveRouter.get(
  "/requests",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getLeaveRequestsController,
);

leaveRouter.patch(
  "/requests/:id/review",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    reviewLeaveRequestSchema,
  ),
  reviewLeaveRequestController,
);

leaveRouter.patch(
  "/requests/:id/cancel",
  validateRequest(leaveIdSchema),
  cancelMyLeaveRequestController,
);

export default leaveRouter;