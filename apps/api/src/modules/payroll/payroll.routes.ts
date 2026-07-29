import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
    approvePayrollController,
    createSalaryProfileController,
    generatePayrollController,
    getMyPayrollsController,
    getPayrollsController,
    getSalaryProfilesController,
    markPayrollPaidController,
    updateSalaryProfileController,
} from "./payroll.controller.js";

import {
    createSalaryProfileSchema,
    generatePayrollSchema,
    payrollIdSchema,
    updateSalaryProfileSchema,
} from "./payroll.schema.js";

const payrollRouter = Router();

payrollRouter.use(authenticate);

/*
 * Employee route.
 * Keep this before parameter routes.
 */
payrollRouter.get(
  "/me",
  authorizeRoles("EMPLOYEE"),
  getMyPayrollsController,
);

payrollRouter.get(
  "/salary-profiles",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getSalaryProfilesController,
);

payrollRouter.post(
  "/salary-profiles",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(
    createSalaryProfileSchema,
  ),
  createSalaryProfileController,
);

payrollRouter.patch(
  "/salary-profiles/:employeeId",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(
    updateSalaryProfileSchema,
  ),
  updateSalaryProfileController,
);

payrollRouter.get(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getPayrollsController,
);

payrollRouter.post(
  "/generate",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    generatePayrollSchema,
  ),
  generatePayrollController,
);

payrollRouter.patch(
  "/:id/approve",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(payrollIdSchema),
  approvePayrollController,
);

payrollRouter.patch(
  "/:id/paid",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(payrollIdSchema),
  markPayrollPaidController,
);

export default payrollRouter;