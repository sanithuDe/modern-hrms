import { Router } from "express";

import {
    UserRole,
} from "../../generated/prisma/client.js";

import {
    authenticate,
} from "../../middleware/authenticate.js";

import {
    authorizeRoles,
} from "../../middleware/authorizeRoles.js";

import {
    assignShiftController,
    createShiftController,
    getMyAssignedShiftController,
    getShiftAssignmentsController,
    getShiftsController,
    updateShiftController,
} from "./shift.controller.js";

const shiftRouter = Router();

shiftRouter.use(authenticate);

/*
 * Every authenticated role can view
 * its own active shift assignment.
 */
shiftRouter.get(
  "/my",
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.EMPLOYEE,
  ),
  getMyAssignedShiftController,
);

/*
 * Only HR Manager can view employee
 * shift assignments.
 */
shiftRouter.get(
  "/assignments",
  authorizeRoles(
    UserRole.HR_MANAGER,
  ),
  getShiftAssignmentsController,
);

/*
 * Only HR Manager can assign shifts.
 */
shiftRouter.post(
  "/assignments",
  authorizeRoles(
    UserRole.HR_MANAGER,
  ),
  assignShiftController,
);

/*
 * Super Admin and HR Manager can
 * view configured shifts.
 */
shiftRouter.get(
  "/",
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HR_MANAGER,
  ),
  getShiftsController,
);

/*
 * Only Super Admin can create shifts.
 */
shiftRouter.post(
  "/",
  authorizeRoles(
    UserRole.SUPER_ADMIN,
  ),
  createShiftController,
);

/*
 * Only Super Admin can update shifts.
 */
shiftRouter.patch(
  "/:id",
  authorizeRoles(
    UserRole.SUPER_ADMIN,
  ),
  updateShiftController,
);

export default shiftRouter;