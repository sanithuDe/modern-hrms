import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createPositionController,
  deletePositionController,
  getPositionController,
  getPositionsController,
  updatePositionController,
} from "./position.controller.js";

import {
  createPositionSchema,
  positionIdSchema,
  updatePositionSchema,
} from "./position.schema.js";

const positionRouter = Router();

positionRouter.use(authenticate);

positionRouter.get(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getPositionsController,
);

positionRouter.get(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(positionIdSchema),
  getPositionController,
);

positionRouter.post(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    createPositionSchema,
  ),
  createPositionController,
);

positionRouter.patch(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  validateRequest(
    updatePositionSchema,
  ),
  updatePositionController,
);

positionRouter.delete(
  "/:id",
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(positionIdSchema),
  deletePositionController,
);

export default positionRouter;