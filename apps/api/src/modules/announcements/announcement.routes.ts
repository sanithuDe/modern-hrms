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
    archiveAnnouncementController,
    createAnnouncementController,
    deleteAnnouncementController,
    getAnnouncementController,
    getAnnouncementsController,
    publishAnnouncementController,
    updateAnnouncementController,
} from "./announcement.controller.js";

import {
    announcementIdSchema,
    createAnnouncementSchema,
    updateAnnouncementSchema,
} from "./announcement.schema.js";

const announcementRouter =
  Router();

announcementRouter.use(
  authenticate,
);

announcementRouter.get(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
    "EMPLOYEE",
  ),
  getAnnouncementsController,
);

announcementRouter.post(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    createAnnouncementSchema,
  ),
  createAnnouncementController,
);

announcementRouter.patch(
  "/:id/publish",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    announcementIdSchema,
  ),
  publishAnnouncementController,
);

announcementRouter.patch(
  "/:id/archive",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    announcementIdSchema,
  ),
  archiveAnnouncementController,
);

announcementRouter.get(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
    "EMPLOYEE",
  ),
  validateRequest(
    announcementIdSchema,
  ),
  getAnnouncementController,
);

announcementRouter.patch(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    updateAnnouncementSchema,
  ),
  updateAnnouncementController,
);

announcementRouter.delete(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    announcementIdSchema,
  ),
  deleteAnnouncementController,
);

export default announcementRouter;