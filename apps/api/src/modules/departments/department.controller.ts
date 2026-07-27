import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    createDepartment,
    deleteDepartment,
    getDepartmentById,
    getDepartments,
    updateDepartment,
} from "./department.service.js";

function getDepartmentId(
  request: Request,
): string {
  const id = request.params["id"];

  if (
    typeof id !== "string" ||
    id.trim().length === 0
  ) {
    throw new Error(
      "Department ID is required",
    );
  }

  return id;
}

export async function createDepartmentController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const department =
      await createDepartment(request.body);

    response.status(201).json({
      success: true,
      message:
        "Department created successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentsController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const departments =
      await getDepartments();

    response.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = getDepartmentId(request);

    const department =
      await getDepartmentById(id);

    response.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartmentController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = getDepartmentId(request);

    const department =
      await updateDepartment(
        id,
        request.body,
      );

    response.status(200).json({
      success: true,
      message:
        "Department updated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDepartmentController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = getDepartmentId(request);

    const result =
      await deleteDepartment(id);

    response.status(200).json({
      success: true,
      message:
        "Department deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}