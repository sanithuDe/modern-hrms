import cors from "cors";
import express from "express";
import morgan from "morgan";

import {
    errorHandler,
} from "./middleware/errorHandler.js";

import {
    notFoundHandler,
} from "./middleware/notFoundHandler.js";

import announcementRoutes from "./modules/announcements/announcement.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import departmentRoutes from "./modules/departments/department.routes.js";
import employeeRoutes from "./modules/employees/employee.routes.js";
import leaveRoutes from "./modules/leave/leave.routes.js";
import payrollRoutes from "./modules/payroll/payroll.routes.js";
import performanceRoutes from "./modules/performance/performance.routes.js";
import positionRoutes from "./modules/positions/position.routes.js";
import recruitmentRoutes from "./modules/recruitment/recruitment.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";

const app = express();

app.use(
  cors({
    origin: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: false,
  }),
);

app.use(
  express.json(),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(
  morgan("dev"),
);

app.get(
  "/api/health",
  (_request, response) => {
    response.status(200).json({
      success: true,

      message:
        "HR Platform API is running",
    });
  },
);

app.use(
  "/api/auth",
  authRoutes,
);

app.use(
  "/api/departments",
  departmentRoutes,
);

app.use(
  "/api/positions",
  positionRoutes,
);

app.use(
  "/api/employees",
  employeeRoutes,
);

app.use(
  "/api/leave",
  leaveRoutes,
);

app.use(
  "/api/payroll",
  payrollRoutes,
);

app.use(
  "/api/attendance",
  attendanceRoutes,
);

app.use(
  "/api/performance",
  performanceRoutes,
);

app.use(
  "/api/announcements",
  announcementRoutes,
);

app.use(
  "/api/recruitment",
  recruitmentRoutes,
);

app.use(
  "/api/settings",
  settingsRoutes,
);

app.use(
  notFoundHandler,
);

app.use(
  errorHandler,
);

export default app;