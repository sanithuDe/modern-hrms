import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import {
    checkInController,
    checkOutController,
    createManualAttendanceController,
    deleteAttendanceController,
    getAllAttendanceController,
    getMyAttendanceController,
    getMyTodayAttendanceController,
    updateAttendanceController,
} from "./attendance.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/check-in",
  checkInController,
);

router.post(
  "/check-out",
  checkOutController,
);

router.get(
  "/my/today",
  getMyTodayAttendanceController,
);

router.get(
  "/my",
  getMyAttendanceController,
);

router.get(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  getAllAttendanceController,
);

router.post(
  "/manual",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  createManualAttendanceController,
);

router.patch(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  updateAttendanceController,
);

router.delete(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "HR_MANAGER",
  ),
  deleteAttendanceController,
);

export default router;