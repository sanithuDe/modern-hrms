import { Router } from "express";


import { authenticate } from "../../../middleware/authenticate.js";
import { authorizeRoles } from "../../../middleware/authorizeRoles.js";

import {
  getAttendancePolicyController,
  updateAttendancePolicyController,
} from "./attendance-policy.controller.js";

const attendancePolicyRouter =
  Router();

attendancePolicyRouter.use(
  authenticate,
);

attendancePolicyRouter.get(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
    "EMPLOYEE",
  ),
  getAttendancePolicyController,
);

attendancePolicyRouter.patch(
  "/",
  authorizeRoles("SUPER_ADMIN"),
  updateAttendancePolicyController,
);

export default attendancePolicyRouter;