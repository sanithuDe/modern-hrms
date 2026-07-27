import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";

import authRouter from "./modules/auth/auth.routes.js";
import departmentRouter from "./modules/departments/department.routes.js";
import employeeRouter from "./modules/employees/employee.routes.js";
import payrollRouter from "./modules/payroll/payroll.routes.js";
import positionRouter from "./modules/positions/position.routes.js";

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ??
      "http://localhost:3000",
    credentials: true,
  }),
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(cookieParser());

app.get(
  "/api/health",
  (_request, response) => {
    response.status(200).json({
      success: true,
      message: "HR Platform API is running",
    });
  },
);

app.use("/api/auth", authRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/positions", positionRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/payroll", payrollRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;