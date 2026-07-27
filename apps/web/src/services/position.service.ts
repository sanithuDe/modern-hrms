import { api } from "../lib/api";

export interface Position {
  id: string;
  title: string;
  description: string | null;

  departmentId: string | null;

  department: {
    id: string;
    name: string;
  } | null;

  _count: {
    employees: number;
  };

  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreatePositionInput {
  title: string;
  description?: string;
  departmentId: string | null;
}

export interface UpdatePositionInput {
  title?: string;
  description?: string;
  departmentId?: string | null;
}

export async function getPositions(): Promise<
  Position[]
> {
  const response =
    await api.get<
      ApiResponse<Position[]>
    >("/positions");

  return response.data.data;
}

export async function createPosition(
  input: CreatePositionInput,
): Promise<Position> {
  const response =
    await api.post<
      ApiResponse<Position>
    >(
      "/positions",
      input,
    );

  return response.data.data;
}

export async function updatePosition(
  positionId: string,
  input: UpdatePositionInput,
): Promise<Position> {
  const response =
    await api.patch<
      ApiResponse<Position>
    >(
      `/positions/${positionId}`,
      input,
    );

  return response.data.data;
}

export async function deletePosition(
  positionId: string,
): Promise<{ id: string }> {
  const response =
    await api.delete<
      ApiResponse<{ id: string }>
    >(
      `/positions/${positionId}`,
    );

  return response.data.data;
}