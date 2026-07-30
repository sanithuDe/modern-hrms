import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  resetPasswordController,
} from "./auth.controller.js";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./auth.schema.js";

const authRouter = Router();

authRouter.post(
  "/login",
  validateRequest(loginSchema),
  loginController,
);

authRouter.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  forgotPasswordController,
);

authRouter.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  resetPasswordController,
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
  "/admin-test",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  (_request, response) => {
    response.status(200).json({
      success: true,
      message: "Super Admin authorization is working",
    });
  },
);

export default authRouter;
