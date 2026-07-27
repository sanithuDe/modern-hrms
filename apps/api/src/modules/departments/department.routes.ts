import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createDepartmentController,
  deleteDepartmentController,
  getDepartmentController,
  getDepartmentsController,
  updateDepartmentController,
} from "./department.controller.js";

import {
  createDepartmentSchema,
  departmentIdSchema,
  updateDepartmentSchema,
} from "./department.schema.js";

const departmentRouter = Router();

departmentRouter.use(authenticate);

departmentRouter.get(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getDepartmentsController,
);

departmentRouter.get(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(departmentIdSchema),
  getDepartmentController,
);

departmentRouter.post(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(createDepartmentSchema),
  createDepartmentController,
);

departmentRouter.patch(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(updateDepartmentSchema),
  updateDepartmentController,
);

departmentRouter.delete(
  "/:id",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(departmentIdSchema),
  deleteDepartmentController,
);

export default departmentRouter;