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
  getAttendanceSettingsController,
  resetAttendanceSettingsController,
  updateAttendanceSettingsController,
} from "./settings.controller.js";

import {
  updateAttendanceSettingsSchema,
} from "./settings.schema.js";

const settingsRouter =
  Router();

settingsRouter.use(
  authenticate,
);

settingsRouter.use(
  authorizeRoles(
    "SUPER_ADMIN",
  ),
);

settingsRouter.get(
  "/attendance",
  getAttendanceSettingsController,
);

settingsRouter.patch(
  "/attendance",
  validateRequest(
    updateAttendanceSettingsSchema,
  ),
  updateAttendanceSettingsController,
);

settingsRouter.post(
  "/attendance/reset",
  resetAttendanceSettingsController,
);

export default settingsRouter;