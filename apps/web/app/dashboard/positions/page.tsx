"use client";

import axios from "axios";
import {
  BriefcaseBusiness,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  getDepartments,
  type Department,
} from "../../../src/services/department.service";

import {
  createPosition,
  deletePosition,
  getPositions,
  updatePosition,
  type Position,
} from "../../../src/services/position.service";

import { SelectField } from "../../../src/components/ui/SelectField";

interface StoredUser {
  email: string;
  role: string;
}

function getRequestErrorMessage(
  requestError: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError(requestError)) {
    const responseData =
      requestError.response?.data as
        | {
            message?: unknown;
            error?: unknown;
          }
        | undefined;

    if (typeof responseData?.message === "string") {
      return responseData.message;
    }

    if (typeof responseData?.error === "string") {
      return responseData.error;
    }
  }

  if (requestError instanceof Error) {
    return requestError.message;
  }

  return fallbackMessage;
}

export default function PositionsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [positions, setPositions] =
    useState<Position[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [departmentId, setDepartmentId] =
    useState("");

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    editingPosition,
    setEditingPosition,
  ] = useState<Position | null>(null);

  const [editTitle, setEditTitle] =
    useState("");

  const [
    editDescription,
    setEditDescription,
  ] = useState("");

  const [
    editDepartmentId,
    setEditDepartmentId,
  ] = useState("");

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [
    positionToDelete,
    setPositionToDelete,
  ] = useState<Position | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken");

    const storedUser =
      localStorage.getItem("authUser");

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser) as StoredUser;

      if (parsedUser.role !== "SUPER_ADMIN") {
        router.replace("/dashboard");
        return;
      }

      setUser(parsedUser);
      void loadPageData();
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");
      router.replace("/login");
    }
  }, [router]);

  async function loadPageData() {
    try {
      setIsLoading(true);
      setError("");

      const [
        positionData,
        departmentData,
      ] = await Promise.all([
        getPositions(),
        getDepartments(),
      ]);

      setPositions(positionData);
      setDepartments(departmentData);
    } catch (requestError: unknown) {
      console.error(requestError);

      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to load positions.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPositions = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return positions;
    }

    return positions.filter((position) => {
      const descriptionText =
        position.description
          ?.toLowerCase() ?? "";

      const departmentName =
        position.department?.name
          .toLowerCase() ?? "";

      return (
        position.title
          .toLowerCase()
          .includes(keyword) ||
        descriptionText.includes(keyword) ||
        departmentName.includes(keyword)
      );
    });
  }, [positions, search]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Position title is required.");
      return;
    }

    if (!departmentId) {
      setError(
        "Please select a department.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const position =
        await createPosition({
          title: title.trim(),
          description:
            description.trim() || undefined,
          departmentId,
        });

      setPositions((current) => [
        position,
        ...current,
      ]);

      setTitle("");
      setDescription("");
      setDepartmentId("");

      setSuccess(
        "Position created successfully.",
      );
    } catch (requestError: unknown) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to create position.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(
    position: Position,
  ) {
    setError("");
    setSuccess("");

    setEditingPosition(position);
    setEditTitle(position.title);
    setEditDescription(
      position.description ?? "",
    );
    setEditDepartmentId(
      position.departmentId ?? "",
    );
  }

  function closeEditModal() {
    if (isUpdating) {
      return;
    }

    setEditingPosition(null);
    setEditTitle("");
    setEditDescription("");
    setEditDepartmentId("");
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingPosition) {
      return;
    }

    if (!editTitle.trim()) {
      setError("Position title is required.");
      return;
    }

    if (!editDepartmentId) {
      setError(
        "Please select a department.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setIsUpdating(true);

    try {
      const updatedPosition =
        await updatePosition(
          editingPosition.id,
          {
            title: editTitle.trim(),
            description:
              editDescription.trim() ||
              undefined,
            departmentId:
              editDepartmentId,
          },
        );

      setPositions((current) =>
        current.map((position) =>
          position.id ===
          updatedPosition.id
            ? updatedPosition
            : position,
        ),
      );

      setEditingPosition(null);
      setEditTitle("");
      setEditDescription("");
      setEditDepartmentId("");

      setSuccess(
        "Position updated successfully.",
      );
    } catch (requestError: unknown) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to update position.",
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  function openDeleteModal(
    position: Position,
  ) {
    setError("");
    setSuccess("");
    setPositionToDelete(position);
  }

  function closeDeleteModal() {
    if (deletingId) {
      return;
    }

    setPositionToDelete(null);
  }

  async function handleDeleteConfirmed() {
    if (!positionToDelete) {
      return;
    }

    const positionId =
      positionToDelete.id;

    const positionTitle =
      positionToDelete.title;

    setError("");
    setSuccess("");
    setDeletingId(positionId);

    try {
      await deletePosition(positionId);

      setPositions((current) =>
        current.filter(
          (position) =>
            position.id !== positionId,
        ),
      );

      setPositionToDelete(null);

      setSuccess(
        `"${positionTitle}" was deleted successfully.`,
      );
    } catch (requestError: unknown) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to delete position.",
        ),
      );

      setPositionToDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Loading positions...
        </p>
      </main>
    );
  }

  return (
    <div className="space-y-6">
          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <TriangleAlert
                size={20}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="mt-8 grid gap-8 xl:grid-cols-[380px_1fr]">
            <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-3">
                  <BriefcaseBusiness
                    size={22}
                    className="text-slate-700"
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Add Position
                  </h2>

                  <p className="text-sm text-slate-500">
                    Create a new employee
                    position.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-6"
              >
                <div>
                  <label
                    htmlFor="positionTitle"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Position title
                  </label>

                  <input
                    id="positionTitle"
                    type="text"
                    required
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value,
                      )
                    }
                    placeholder="Software Developer"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="mt-5">
                  <SelectField
                    label="Department"
                    required
                    value={departmentId}
                    placeholder="Select a department"
                    options={departments.map(
                      (department) => ({
                        value: department.id,
                        label: department.name,
                      }),
                    )}
                    onChange={setDepartmentId}
                  />
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Describe this position"
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-black placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={18} />

                  {isSubmitting
                    ? "Creating..."
                    : "Create Position"}
                </button>
              </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
                <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3">
                  <Search
                    size={18}
                    className="text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search positions"
                    className="w-full bg-white text-sm text-black outline-none placeholder:text-slate-400"
                  />
                </div>

                <p className="text-sm text-slate-500">
                  {filteredPositions.length}{" "}
                  position(s)
                </p>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-slate-500">
                  Loading positions...
                </div>
              ) : filteredPositions.length ===
                0 ? (
                <div className="p-8 text-center text-slate-500">
                  No positions found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-4">
                          Position
                        </th>

                        <th className="px-6 py-4">
                          Department
                        </th>

                        <th className="px-6 py-4">
                          Description
                        </th>

                        <th className="px-6 py-4 text-center">
                          Employees
                        </th>

                        <th className="px-6 py-4">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {filteredPositions.map(
                        (position) => (
                          <tr
                            key={position.id}
                            className="text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            <td className="px-6 py-5">
                              <p className="font-medium text-slate-900">
                                {position.title}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              {position.department
                                ?.name ??
                                "Not assigned"}
                            </td>

                            <td className="px-6 py-5">
                              {position.description ??
                                "No description"}
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-2">
                                <Users
                                  size={17}
                                  className="text-slate-400"
                                />

                                <span className="font-semibold text-slate-900">
                                  {position._count
                                    ?.employees ?? 0}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      position,
                                    )
                                  }
                                  className="flex items-center gap-1 font-medium text-blue-700 transition hover:text-blue-800 hover:underline"
                                >
                                  <Pencil size={15} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    deletingId ===
                                    position.id
                                  }
                                  onClick={() =>
                                    openDeleteModal(
                                      position,
                                    )
                                  }
                                  className="flex items-center gap-1 font-medium text-red-600 transition hover:text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 size={15} />

                                  {deletingId ===
                                  position.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

      {editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Position
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the position details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={isUpdating}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close edit position modal"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="mt-6"
            >
              <div>
                <label
                  htmlFor="editPositionTitle"
                  className="mb-2 block text-sm font-medium text-slate-900"
                >
                  Position title
                </label>

                <input
                  id="editPositionTitle"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="mt-5">
                <SelectField
                  label="Department"
                  required
                  value={editDepartmentId}
                  placeholder="Select a department"
                  options={departments.map(
                    (department) => ({
                      value: department.id,
                      label: department.name,
                    }),
                  )}
                  onChange={setEditDepartmentId}
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="editDescription"
                  className="mb-2 block text-sm font-medium text-slate-900"
                >
                  Description
                </label>

                <textarea
                  id="editDescription"
                  rows={4}
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value,
                    )
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isUpdating}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdating
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {positionToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-red-50 via-white to-orange-50 p-7">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
                  <Trash2
                    size={27}
                    className="text-red-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={Boolean(deletingId)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close delete confirmation"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-900">
                Delete position?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                You are about to permanently delete{" "}
                <span className="font-semibold text-slate-900">
                  {positionToDelete.title}
                </span>
                .
              </p>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <TriangleAlert
                    size={20}
                    className="shrink-0 text-amber-600"
                  />

                  <p className="text-sm text-amber-800">
                    Positions with assigned employees
                    cannot be deleted.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {positionToDelete._count
                    ?.employees ?? 0}
                </p>

                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  Assigned employees
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingId)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep Position
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDeleteConfirmed()
                }
                disabled={Boolean(deletingId)}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={17} />

                {deletingId
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}