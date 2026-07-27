import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import {
  createEmployeeController,
  deleteEmployeeController,
  getCurrentEmployeeController,
  getEmployeeByIdController,
  getEmployeesController,
  updateEmployeeController,
  updateEmployeeStatusController,
} from "./employee.controller.js";

const employeeRouter = Router();

employeeRouter.get(
  "/me",
  authenticate,
  getCurrentEmployeeController,
);

employeeRouter.get(
  "/",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getEmployeesController,
);

employeeRouter.post(
  "/",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  createEmployeeController,
);

employeeRouter.patch(
  "/:id/status",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  updateEmployeeStatusController,
);

employeeRouter.get(
  "/:id",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getEmployeeByIdController,
);

employeeRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  updateEmployeeController,
);

employeeRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  deleteEmployeeController,
);

export default employeeRouter;