import cors from "cors";

import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import morgan from "morgan";

import announcementRouter from "./modules/announcements/announcement.routes.js";
import attendancePolicyRouter from "./modules/attendance/attendance-policy/attendance-policy.routes.js";
import attendanceRouter from "./modules/attendance/attendance.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import cvPortalRouter from "./modules/cv-portal/cv-portal.routes.js";
import departmentRouter from "./modules/departments/department.routes.js";
import employeeRouter from "./modules/employees/employee.routes.js";
import leaveRouter from "./modules/leave/leave.routes.js";
import payrollRouter from "./modules/payroll/payroll.routes.js";
import performanceRouter from "./modules/performance/performance.routes.js";
import positionRouter from "./modules/positions/position.routes.js";
import recruitmentRouter from "./modules/recruitment/recruitment.routes.js";
import shiftRouter from "./modules/shifts/shift.routes.js";

const app = express();

/*
 * Global middleware
 */
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.use(morgan("dev"));

/*
 * Health check
 */
app.get(
  "/api/health",
  (
    _request: Request,
    response: Response,
  ): void => {
    response.status(200).json({
      success: true,
      message: "API is running",
    });
  },
);

/*
 * Authentication
 */
app.use(
  "/api/auth",
  authRouter,
);

/*
 * Employees
 */
app.use(
  "/api/employees",
  employeeRouter,
);

/*
 * Departments
 */
app.use(
  "/api/departments",
  departmentRouter,
);

/*
 * Positions
 */
app.use(
  "/api/positions",
  positionRouter,
);

/*
 * Leave
 */
app.use(
  "/api/leave",
  leaveRouter,
);

/*
 * Payroll
 */
app.use(
  "/api/payroll",
  payrollRouter,
);

/*
 * Attendance
 */
app.use(
  "/api/attendance",
  attendanceRouter,
);

/*
 * Attendance policy
 */
app.use(
  "/api/attendance-policy",
  attendancePolicyRouter,
);

/*
 * Shifts
 */
app.use(
  "/api/shifts",
  shiftRouter,
);

/*
 * Announcements
 */
app.use(
  "/api/announcements",
  announcementRouter,
);

/*
 * Performance
 */
app.use(
  "/api/performance",
  performanceRouter,
);

/*
 * Recruitment
 *
 * GET    /api/recruitment/jobs
 * POST   /api/recruitment/jobs
 * GET    /api/recruitment/jobs/:id
 * PATCH  /api/recruitment/jobs/:id
 *
 * GET    /api/recruitment/candidates
 * POST   /api/recruitment/candidates
 * GET    /api/recruitment/candidates/:id
 * PATCH  /api/recruitment/candidates/:id
 */
app.use(
  "/api/recruitment",
  recruitmentRouter,
);

/*
 * CV Portal
 */
app.use(
  "/api/cv-portal",
  cvPortalRouter,
);

/*
 * 404 handler
 *
 * Keep this after every route.
 */
app.use(
  (
    request: Request,
    response: Response,
  ): void => {
    response.status(404).json({
      success: false,
      message: `Route not found: ${request.method} ${request.originalUrl}`,
    });
  },
);

/*
 * Global error handler
 */
app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ): void => {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    response.status(500).json({
      success: false,
      message,
    });
  },
);

export default app;