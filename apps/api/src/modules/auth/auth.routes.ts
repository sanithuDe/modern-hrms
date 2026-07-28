import {
  Router,
} from "express";

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
  validateRequest,
} from "../../middleware/validateRequest.js";

import {
  loginController,
  logoutController,
  meController,
} from "./auth.controller.js";

import {
  loginSchema,
} from "./auth.schema.js";

const authRouter =
  Router();

authRouter.post(
  "/login",
  validateRequest(
    loginSchema,
  ),
  loginController,
);

authRouter.get(
  "/me",
  authenticate,
  meController,
);

authRouter.post(
  "/logout",
  authenticate,
  logoutController,
);

authRouter.get(
  "/super-admin-test",
  authenticate,
  authorizeRoles(
    UserRole.SUPER_ADMIN,
  ),
  (
    _request,
    response,
  ) => {
    response.status(200).json({
      success: true,
      message:
        "Super Admin authorization is working",
    });
  },
);

authRouter.get(
  "/hr-manager-test",
  authenticate,
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.HR_MANAGER,
  ),
  (
    _request,
    response,
  ) => {
    response.status(200).json({
      success: true,
      message:
        "HR Manager authorization is working",
    });
  },
);

export default authRouter;