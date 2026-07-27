import {
  UserRole,
  UserStatus,
} from "@prisma/client";

import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  getMyEmployeeProfile,
  updateEmployee,
  updateEmployeeStatus,
} from "./employee.service.js";

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    userId?: string;
    sub?: string;
  };
};

function getRequestUserId(
  request: Request,
): string | undefined {
  const authenticatedRequest =
    request as AuthenticatedRequest;

  return (
    authenticatedRequest.user?.id ??
    authenticatedRequest.user?.userId ??
    authenticatedRequest.user?.sub
  );
}

function getRequiredEmployeeId(
  request: Request,
): string | null {
  const id = request.params.id;

  if (
    typeof id !== "string" ||
    id.trim().length === 0
  ) {
    return null;
  }

  return id;
}

function isUserRole(
  value: unknown,
): value is UserRole {
  return (
    typeof value === "string" &&
    Object.values(UserRole).includes(
      value as UserRole,
    )
  );
}

function isUserStatus(
  value: unknown,
): value is UserStatus {
  return (
    typeof value === "string" &&
    Object.values(UserStatus).includes(
      value as UserStatus,
    )
  );
}

export async function createEmployeeController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const role = request.body.role;

    if (!isUserRole(role)) {
      response.status(400).json({
        success: false,
        message: "Invalid employee role",
      });

      return;
    }

    const employee = await createEmployee({
      email: request.body.email,
      password: request.body.password,
      role,
      employeeNumber:
        request.body.employeeNumber,
      firstName:
        request.body.firstName,
      lastName:
        request.body.lastName,
      phone:
        request.body.phone,
      hireDate:
        request.body.hireDate,
      departmentId:
        request.body.departmentId,
      positionId:
        request.body.positionId,
    });

    response.status(201).json({
      success: true,
      message:
        "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeesController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const employees =
      await getEmployees();

    response.status(200).json({
      success: true,
      message:
        "Employees retrieved successfully",
      data: employees,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeByIdController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequiredEmployeeId(request);

    if (!id) {
      response.status(400).json({
        success: false,
        message: "Employee ID is required",
      });

      return;
    }

    const employee =
      await getEmployeeById(id);

    response.status(200).json({
      success: true,
      message:
        "Employee retrieved successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentEmployeeController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId =
      getRequestUserId(request);

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const employee =
      await getMyEmployeeProfile(userId);

    response.status(200).json({
      success: true,
      message:
        "Current employee retrieved successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequiredEmployeeId(request);

    if (!id) {
      response.status(400).json({
        success: false,
        message: "Employee ID is required",
      });

      return;
    }

    const role = request.body.role;

    if (
      role !== undefined &&
      !isUserRole(role)
    ) {
      response.status(400).json({
        success: false,
        message: "Invalid employee role",
      });

      return;
    }

    const employee =
      await updateEmployee(id, {
        firstName:
          request.body.firstName,
        lastName:
          request.body.lastName,
        phone:
          request.body.phone,
        hireDate:
          request.body.hireDate,
        departmentId:
          request.body.departmentId,
        positionId:
          request.body.positionId,
        role,
      });

    response.status(200).json({
      success: true,
      message:
        "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeStatusController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequiredEmployeeId(request);

    const status =
      request.body.status;

    if (!id) {
      response.status(400).json({
        success: false,
        message: "Employee ID is required",
      });

      return;
    }

    if (!isUserStatus(status)) {
      response.status(400).json({
        success: false,
        message:
          "Status must be ACTIVE, SUSPENDED, or INACTIVE",
      });

      return;
    }

    const employee =
      await updateEmployeeStatus(id, {
        status,
      });

    response.status(200).json({
      success: true,
      message:
        "Employee status updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployeeController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequiredEmployeeId(request);

    if (!id) {
      response.status(400).json({
        success: false,
        message: "Employee ID is required",
      });

      return;
    }

    const result =
      await deleteEmployee(id);

    response.status(200).json({
      success: true,
      message:
        "Employee deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}