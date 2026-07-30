"use client";

import {
    Archive,
    Bell,
    CalendarDays,
    Edit3,
    Megaphone,
    Pin,
    Plus,
    Send,
    Trash2,
    Users,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    archiveAnnouncement,
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncements,
    publishAnnouncement,
    updateAnnouncement,
    type Announcement,
    type AnnouncementAudience,
} from "@/src/services/announcement.service";

interface StoredUser {
  email: string;
  role: string;
}

interface AnnouncementForm {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  isPinned: boolean;
  publishAt: string;
  expiresAt: string;
}

const initialForm: AnnouncementForm = {
  title: "",
  content: "",
  audience: "ALL",
  isPinned: false,
  publishAt: "",
  expiresAt: "",
};

function getErrorMessage(
  error: unknown,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const responseError =
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

    const message =
      responseError.response?.data
        ?.message;

    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function formatAudience(
  audience: AnnouncementAudience,
): string {
  if (audience === "ALL") {
    return "Everyone";
  }

  return audience
    .split("_")
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase(),
    )
    .join(" ");
}

function formatDate(
  date: string | null,
): string {
  if (!date) {
    return "Not set";
  }

  return new Date(
    date,
  ).toLocaleString();
}

export default function AnnouncementsPage() {
  const [user, setUser] =
    useState<StoredUser | null>(
      null,
    );

  const [
    announcements,
    setAnnouncements,
  ] = useState<Announcement[]>([]);

  const [form, setForm] =
    useState<AnnouncementForm>(
      initialForm,
    );

  const [
    editingAnnouncement,
    setEditingAnnouncement,
  ] =
    useState<Announcement | null>(
      null,
    );

  const [
    announcementToDelete,
    setAnnouncementToDelete,
  ] =
    useState<Announcement | null>(
      null,
    );

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const canManage =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_MANAGER";

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const data =
        await getAnnouncements();

      setAnnouncements(data);
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedUser =
      window.localStorage.getItem(
        "authUser",
      );

    if (!storedUser) {
      setError(
        "User information was not found. Please log in again.",
      );

      setLoading(false);
      return;
    }

    try {
      const parsedUser =
        JSON.parse(
          storedUser,
        ) as StoredUser;

      setUser(parsedUser);
      void loadData();
    } catch {
      setError(
        "The stored user information is invalid. Please log in again.",
      );

      setLoading(false);
    }
  }, []);

  const publishedCount =
    useMemo(
      () =>
        announcements.filter(
          (announcement) =>
            announcement.status ===
            "PUBLISHED",
        ).length,
      [announcements],
    );

  const draftCount =
    useMemo(
      () =>
        announcements.filter(
          (announcement) =>
            announcement.status ===
            "DRAFT",
        ).length,
      [announcements],
    );

  const pinnedCount =
    useMemo(
      () =>
        announcements.filter(
          (announcement) =>
            announcement.isPinned,
        ).length,
      [announcements],
    );

  function updateForm<
    Key extends keyof AnnouncementForm,
  >(
    key: Key,
    value: AnnouncementForm[Key],
  ): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreateForm(): void {
    setEditingAnnouncement(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    announcement: Announcement,
  ): void {
    setEditingAnnouncement(
      announcement,
    );

    setForm({
      title:
        announcement.title,

      content:
        announcement.content,

      audience:
        announcement.audience,

      isPinned:
        announcement.isPinned,

      publishAt:
        announcement.publishAt
          ? new Date(
              announcement.publishAt,
            )
              .toISOString()
              .slice(0, 16)
          : "",

      expiresAt:
        announcement.expiresAt
          ? new Date(
              announcement.expiresAt,
            )
              .toISOString()
              .slice(0, 16)
          : "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm(): void {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingAnnouncement(null);
    setForm(initialForm);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const input = {
        title:
          form.title.trim(),

        content:
          form.content.trim(),

        audience:
          form.audience,

        isPinned:
          form.isPinned,

        publishAt:
          form.publishAt
            ? new Date(
                form.publishAt,
              ).toISOString()
            : null,

        expiresAt:
          form.expiresAt
            ? new Date(
                form.expiresAt,
              ).toISOString()
            : null,
      };

      if (editingAnnouncement) {
        await updateAnnouncement(
          editingAnnouncement.id,
          input,
        );

        setSuccess(
          "Announcement updated successfully.",
        );
      } else {
        await createAnnouncement(
          input,
        );

        setSuccess(
          "Announcement created successfully.",
        );
      }

      closeForm();
      await loadData();
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(
    announcementId: string,
  ): Promise<void> {
    try {
      setActionId(
        announcementId,
      );

      setError("");
      setSuccess("");

      await publishAnnouncement(
        announcementId,
      );

      setSuccess(
        "Announcement published successfully.",
      );

      await loadData();
    } catch (publishError) {
      setError(
        getErrorMessage(
          publishError,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleArchive(
    announcementId: string,
  ): Promise<void> {
    try {
      setActionId(
        announcementId,
      );

      setError("");
      setSuccess("");

      await archiveAnnouncement(
        announcementId,
      );

      setSuccess(
        "Announcement archived successfully.",
      );

      await loadData();
    } catch (archiveError) {
      setError(
        getErrorMessage(
          archiveError,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!announcementToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await deleteAnnouncement(
        announcementToDelete.id,
      );

      setAnnouncementToDelete(
        null,
      );

      setSuccess(
        "Announcement deleted successfully.",
      );

      await loadData();
    } catch (deleteError) {
      setError(
        getErrorMessage(
          deleteError,
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-600">
            Loading announcements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {canManage ? (
        <section className="flex justify-end">
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={18} />
            New Announcement
          </button>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-slate-100 p-3 text-slate-700">
            <Bell size={22} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Total Announcements
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {announcements.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <Send size={22} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Published
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {publishedCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-amber-50 p-3 text-amber-700">
            <Edit3 size={22} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Drafts
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {draftCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-blue-50 p-3 text-blue-700">
            <Pin size={22} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Pinned
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {pinnedCount}
          </p>
        </article>
      </section>

      {announcements.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Megaphone
            size={46}
            className="mx-auto text-slate-300"
          />

          <p className="mt-4 font-medium text-slate-700">
            No announcements found
          </p>

          <p className="mt-1 text-sm text-slate-500">
            New announcements will
            appear here.
          </p>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-2">
          {announcements.map(
            (announcement) => (
              <article
                key={announcement.id}
                className={
                  announcement.isPinned
                    ? "relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-6 shadow-sm"
                    : "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                }
              >
                {announcement.isPinned ? (
                  <div className="absolute right-5 top-5 rounded-full bg-blue-50 p-2 text-blue-700">
                    <Pin size={17} />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pr-12">
                  <span
                    className={
                      announcement.status ===
                      "PUBLISHED"
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                        : announcement.status ===
                            "ARCHIVED"
                          ? "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                          : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                    }
                  >
                    {announcement.status}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <Users size={13} />
                    {formatAudience(
                      announcement.audience,
                    )}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-semibold text-slate-900">
                  {announcement.title}
                </h2>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {announcement.content}
                </p>

                <div className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="flex gap-2">
                    <CalendarDays
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <div>
                      <p className="font-medium text-slate-700">
                        Publish date
                      </p>

                      <p className="mt-1 text-xs">
                        {formatDate(
                          announcement.publishAt,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <CalendarDays
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <div>
                      <p className="font-medium text-slate-700">
                        Expiry date
                      </p>

                      <p className="mt-1 text-xs">
                        {formatDate(
                          announcement.expiresAt,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">
                    Created by{" "}
                    <span className="font-medium text-slate-700">
                      {announcement
                        .createdBy
                        .employee
                        ? `${announcement.createdBy.employee.firstName} ${announcement.createdBy.employee.lastName}`
                        : announcement
                            .createdBy
                            .email}
                    </span>
                  </p>
                </div>

                {canManage ? (
                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    {announcement.status !==
                    "ARCHIVED" ? (
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            announcement,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>
                    ) : null}

                    {announcement.status ===
                    "DRAFT" ? (
                      <button
                        type="button"
                        disabled={
                          actionId ===
                          announcement.id
                        }
                        onClick={() =>
                          void handlePublish(
                            announcement.id,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <Send size={16} />
                        Publish
                      </button>
                    ) : null}

                    {announcement.status ===
                    "PUBLISHED" ? (
                      <button
                        type="button"
                        disabled={
                          actionId ===
                          announcement.id
                        }
                        onClick={() =>
                          void handleArchive(
                            announcement.id,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                      >
                        <Archive
                          size={16}
                        />
                        Archive
                      </button>
                    ) : null}

                    {announcement.status !==
                    "PUBLISHED" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setSuccess("");

                          setAnnouncementToDelete(
                            announcement,
                          );
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        <Trash2
                          size={16}
                        />
                        Delete
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ),
          )}
        </section>
      )}

      {showForm && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingAnnouncement
                    ? "Edit Announcement"
                    : "Create Announcement"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add company news,
                  notices, or important
                  updates.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Announcement title
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      "title",
                      event.target.value,
                    )
                  }
                  required
                  placeholder="Important company update"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Content
                </label>

                <textarea
                  value={form.content}
                  onChange={(event) =>
                    updateForm(
                      "content",
                      event.target.value,
                    )
                  }
                  required
                  rows={7}
                  placeholder="Write the announcement content..."
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Audience
                  </label>

                  <select
                    value={
                      form.audience
                    }
                    onChange={(event) =>
                      updateForm(
                        "audience",
                        event.target
                          .value as AnnouncementAudience,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                  >
                    <option value="ALL">
                      Everyone
                    </option>

                    <option value="SUPER_ADMIN">
                      Super Admins
                    </option>

                    <option value="HR_MANAGER">
                      HR Managers
                    </option>

                    <option value="EMPLOYEE">
                      Employees
                    </option>
                  </select>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      form.isPinned
                    }
                    onChange={(event) =>
                      updateForm(
                        "isPinned",
                        event.target
                          .checked,
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-medium text-slate-700">
                      Pin announcement
                    </span>

                    <span className="block text-xs text-slate-500">
                      Show it before other announcements
                    </span>
                  </span>
                </label>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Publish date
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.publishAt
                    }
                    onChange={(event) =>
                      updateForm(
                        "publishAt",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Expiry date
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.expiresAt
                    }
                    onChange={(event) =>
                      updateForm(
                        "expiresAt",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-w-40 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingAnnouncement
                      ? "Save Changes"
                      : "Create Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {announcementToDelete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Trash2 size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Delete announcement?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You are about to
                    delete{" "}
                    <span className="font-semibold text-slate-900">
                      {
                        announcementToDelete.title
                      }
                    </span>
                    .
                  </p>

                  <p className="mt-2 text-sm font-medium text-red-600">
                    This action cannot be
                    undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setAnnouncementToDelete(
                    null,
                  )
                }
                disabled={deleting}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2
                      size={17}
                    />
                    Delete Announcement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}