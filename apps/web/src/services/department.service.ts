import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;

  _count: {
    employees: number;
    positions: number;
  };
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

function getAuthHeaders() {
  if (typeof window === "undefined") {
    return {};
  }

  const accessToken =
    localStorage.getItem("accessToken");

  if (!accessToken) {
    throw new Error(
      "Access token was not found. Please log in again.",
    );
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getDepartments(): Promise<
  Department[]
> {
  const response = await axios.get<
    ApiResponse<Department[]>
  >(`${API_URL}/departments`, {
    headers: getAuthHeaders(),
  });

  return response.data.data;
}

export async function createDepartment(
  input: CreateDepartmentInput,
): Promise<Department> {
  const response = await axios.post<
    ApiResponse<Department>
  >(`${API_URL}/departments`, input, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

  return response.data.data;
}

export async function updateDepartment(
  departmentId: string,
  input: UpdateDepartmentInput,
): Promise<Department> {
  const response = await axios.patch<
    ApiResponse<Department>
  >(
    `${API_URL}/departments/${departmentId}`,
    input,
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.data;
}

export async function deleteDepartment(
  departmentId: string,
): Promise<{ id: string }> {
  const response = await axios.delete<
    ApiResponse<{ id: string }>
  >(
    `${API_URL}/departments/${departmentId}`,
    {
      headers: getAuthHeaders(),
    },
  );

  return response.data.data;
}