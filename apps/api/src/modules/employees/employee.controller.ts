import type {
  NextFunction,
  Response,
} from "express";

import {
  UserRole,
  UserStatus,
} from "../../generated/prisma/client.js";

import type {
  AuthenticatedRequest,
} from "../../middleware/authenticate.js";

import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  getMyEmployeeProfile,
  updateEmployee,
  updateEmployeeStatus,
} from "./employee.service.js";

function getRequiredEmployeeId(
  request: AuthenticatedRequest,
): string | null {
  const id = request.params.id;

  if (
    typeof id !== "string" ||
    id.trim().length === 0
  ) {
    return null;
  }

  return id.trim();
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
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authenticatedUser =
      request.user;

    if (!authenticatedUser) {
      response.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const role =
      request.body.role;

    if (!isUserRole(role)) {
      response.status(400).json({
        success: false,
        message: "Invalid employee role",
      });

      return;
    }

    /*
     * Nobody can create another
     * Super Admin from this endpoint.
     */
    if (
      role === UserRole.SUPER_ADMIN
    ) {
      response.status(403).json({
        success: false,
        message:
          "Super Admin accounts cannot be created from the employee section",
      });

      return;
    }

    /*
     * HR Manager can only create
     * normal Employee accounts.
     */
    if (
      authenticatedUser.role ===
        UserRole.HR_MANAGER &&
      role !== UserRole.EMPLOYEE
    ) {
      response.status(403).json({
        success: false,
        message:
          "HR Managers can only create Employee accounts",
      });

      return;
    }

    const employee =
      await createEmployee({
        email:
          request.body.email,
        password:
          request.body.password,
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
        departmentName:
          request.body.departmentName,
        positionTitle:
          request.body.positionTitle,
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
  _request: AuthenticatedRequest,
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
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequiredEmployeeId(request);

    if (!id) {
      response.status(400).json({
        success: false,
        message:
          "Employee ID is required",
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
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId =
      request.user?.id;

    if (!userId) {
      response.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const employee =
      await getMyEmployeeProfile(
        userId,
      );

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
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authenticatedUser =
      request.user;

    if (!authenticatedUser) {
      response.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const id =
      getRequiredEmployeeId(request);

    if (!id) {
      response.status(400).json({
        success: false,
        message:
          "Employee ID is required",
      });

      return;
    }

    const role =
      request.body.role;

    if (
      role !== undefined &&
      !isUserRole(role)
    ) {
      response.status(400).json({
        success: false,
        message:
          "Invalid employee role",
      });

      return;
    }

    /*
     * Nobody can promote an employee
     * to Super Admin here.
     */
    if (
      role === UserRole.SUPER_ADMIN
    ) {
      response.status(403).json({
        success: false,
        message:
          "An employee cannot be promoted to Super Admin",
      });

      return;
    }

    /*
     * HR Manager cannot change roles.
     */
    if (
      authenticatedUser.role ===
        UserRole.HR_MANAGER &&
      role !== undefined
    ) {
      response.status(403).json({
        success: false,
        message:
          "HR Managers cannot change employee roles",
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
        departmentName:
          request.body.departmentName,
        positionTitle:
          request.body.positionTitle,
        role,
        requesterRole:
          authenticatedUser.role,
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
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authenticatedUser =
      request.user;

    if (!authenticatedUser) {
      response.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const id =
      getRequiredEmployeeId(request);

    if (!id) {
      response.status(400).json({
        success: false,
        message:
          "Employee ID is required",
      });

      return;
    }

    const status =
      request.body.status;

    if (!isUserStatus(status)) {
      response.status(400).json({
        success: false,
        message:
          "Status must be ACTIVE, SUSPENDED, or INACTIVE",
      });

      return;
    }

    const employee =
      await updateEmployeeStatus(
        id,
        {
          status,
          requesterRole:
            authenticatedUser.role,
        },
      );

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
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id =
      getRequiredEmployeeId(request);

    if (!id) {
      response.status(400).json({
        success: false,
        message:
          "Employee ID is required",
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