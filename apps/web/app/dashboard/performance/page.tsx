"use client";

import {
    Award,
    CheckCircle2,
    ClipboardList,
    Plus,
    Trash2,
    TrendingUp,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    getEmployees,
} from "../../../src/services/employee.service";

import {
    completePerformanceReview,
    createPerformanceReview,
    deletePerformanceReview,
    getPerformanceReviews,
    type PerformancePeriod,
    type PerformanceReview,
} from "../../../src/services/performance.service";

interface StoredUser {
  email: string;
  role: string;
}

interface EmployeeOption {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
}

interface PerformanceForm {
  employeeId: string;
  title: string;
  reviewDate: string;
  period: PerformancePeriod;

  productivityScore: number;
  qualityScore: number;
  teamworkScore: number;
  attendanceScore: number;
  communicationScore: number;

  strengths: string;
  improvements: string;
  reviewerComments: string;
}

const initialForm: PerformanceForm = {
  employeeId: "",
  title: "",
  reviewDate: new Date()
    .toISOString()
    .slice(0, 10),

  period: "MONTHLY",

  productivityScore: 60,
  qualityScore: 60,
  teamworkScore: 60,
  attendanceScore: 60,
  communicationScore: 60,

  strengths: "",
  improvements: "",
  reviewerComments: "",
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

function getScoreLabel(
  score: number,
  hasReviews = true,
): string {
  if (!hasReviews) {
    return "No data";
  }

  const value = Number(score);

  if (value >= 75) {
    return "Good";
  }

  if (value >= 50) {
    return "Average";
  }

  if (value >= 25) {
    return "Low";
  }

  return "Bad";
}

const PERFORMANCE_RATING_OPTIONS = [
  { label: "Bad", value: 15 },
  { label: "Low", value: 35 },
  { label: "Average", value: 60 },
  { label: "Good", value: 85 },
] as const;

function getScoreToneClass(
  score: number,
): string {
  const label = getScoreLabel(score);

  switch (label) {
    case "Good":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Average":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Low":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-red-50 text-red-700 border-red-200";
  }
}

function nearestRatingScore(score: number): number {
  let best: number = PERFORMANCE_RATING_OPTIONS[0].value;
  let bestDistance = Math.abs(Number(score) - best);

  for (const option of PERFORMANCE_RATING_OPTIONS) {
    const distance = Math.abs(Number(score) - option.value);
    if (distance < bestDistance) {
      best = option.value;
      bestDistance = distance;
    }
  }

  return best;
}

function ScoreRatingSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        value={nearestRatingScore(value)}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        required
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
      >
        {PERFORMANCE_RATING_OPTIONS.map(
          (option) => (
            <option
              key={option.label}
              value={option.value}
            >
              {option.label}
            </option>
          ),
        )}
      </select>
    </div>
  );
}

function formatPeriod(
  period: PerformancePeriod,
): string {
  return period
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

export default function PerformancePage() {
  const [user, setUser] =
    useState<StoredUser | null>(
      null,
    );

  const [reviews, setReviews] =
    useState<PerformanceReview[]>(
      [],
    );

  const [employees, setEmployees] =
    useState<EmployeeOption[]>(
      [],
    );

  const [form, setForm] =
    useState<PerformanceForm>(
      initialForm,
    );

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    reviewToDelete,
    setReviewToDelete,
  ] =
    useState<PerformanceReview | null>(
      null,
    );

  const [deleting, setDeleting] =
    useState(false);

  const canManage =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_MANAGER";

  async function loadData(
    role?: string,
  ): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const reviewData =
        await getPerformanceReviews();

      setReviews(reviewData);

      const activeRole =
        role ?? user?.role;

      const canLoadEmployees =
        activeRole === "SUPER_ADMIN" ||
        activeRole === "HR_MANAGER";

      if (canLoadEmployees) {
        const employeeData =
          await getEmployees();

        setEmployees(
          employeeData.map(
            (employee) => ({
              id: employee.id,
              employeeNumber:
                employee.employeeNumber,
              firstName:
                employee.firstName,
              lastName:
                employee.lastName,
            }),
          ),
        );
      }
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

      void loadData(
        parsedUser.role,
      );
    } catch {
      setError(
        "The stored user information is invalid. Please log in again.",
      );

      setLoading(false);
    }
  }, []);

  const completedCount =
    useMemo(
      () =>
        reviews.filter(
          (review) =>
            review.status ===
            "COMPLETED",
        ).length,
      [reviews],
    );

  const draftCount =
    reviews.length -
    completedCount;

  const averageScore =
    useMemo(() => {
      if (reviews.length === 0) {
        return 0;
      }

      const total =
        reviews.reduce(
          (sum, review) =>
            sum +
            Number(
              review.overallScore,
            ),
          0,
        );

      return Number(
        (
          total /
          reviews.length
        ).toFixed(1),
      );
    }, [reviews]);

  const categoryAverages =
    useMemo(() => {
      if (reviews.length === 0) {
        return [
          {
            label: "Productivity",
            value: 0,
          },
          {
            label: "Quality",
            value: 0,
          },
          {
            label: "Teamwork",
            value: 0,
          },
          {
            label: "Attendance",
            value: 0,
          },
          {
            label:
              "Communication",
            value: 0,
          },
        ];
      }

      function average(
        values: number[],
      ): number {
        const total =
          values.reduce(
            (sum, value) =>
              sum + value,
            0,
          );

        return Number(
          (
            total /
            values.length
          ).toFixed(1),
        );
      }

      return [
        {
          label: "Productivity",
          value: average(
            reviews.map(
              (review) =>
                review.productivityScore,
            ),
          ),
        },
        {
          label: "Quality",
          value: average(
            reviews.map(
              (review) =>
                review.qualityScore,
            ),
          ),
        },
        {
          label: "Teamwork",
          value: average(
            reviews.map(
              (review) =>
                review.teamworkScore,
            ),
          ),
        },
        {
          label: "Attendance",
          value: average(
            reviews.map(
              (review) =>
                review.attendanceScore,
            ),
          ),
        },
        {
          label:
            "Communication",
          value: average(
            reviews.map(
              (review) =>
                review.communicationScore,
            ),
          ),
        },
      ];
    }, [reviews]);

  function updateForm<
    Key extends keyof PerformanceForm,
  >(
    key: Key,
    value: PerformanceForm[Key],
  ): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function closeCreateForm(): void {
    if (saving) {
      return;
    }

    setShowForm(false);
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

      await createPerformanceReview({
        employeeId:
          form.employeeId,

        title:
          form.title.trim(),

        reviewDate:
          form.reviewDate,

        period:
          form.period,

        productivityScore:
          form.productivityScore,

        qualityScore:
          form.qualityScore,

        teamworkScore:
          form.teamworkScore,

        attendanceScore:
          form.attendanceScore,

        communicationScore:
          form.communicationScore,

        strengths:
          form.strengths.trim(),

        improvements:
          form.improvements.trim(),

        reviewerComments:
          form.reviewerComments.trim(),
      });

      setForm(initialForm);
      setShowForm(false);

      setSuccess(
        "Performance review created successfully.",
      );

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

  async function handleComplete(
    reviewId: string,
  ): Promise<void> {
    try {
      setError("");
      setSuccess("");

      await completePerformanceReview(
        reviewId,
      );

      setSuccess(
        "Performance review completed successfully.",
      );

      await loadData();
    } catch (completeError) {
      setError(
        getErrorMessage(
          completeError,
        ),
      );
    }
  }

  async function handleDelete(): Promise<void> {
    if (!reviewToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await deletePerformanceReview(
        reviewToDelete.id,
      );

      setReviewToDelete(null);

      setSuccess(
        "Performance review deleted successfully.",
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
            Loading performance
            records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Performance Management
          </h1>

          <p className="mt-2 text-slate-600">
            {canManage
              ? "Create and manage employee performance reviews."
              : "View your performance reviews and progress."}
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={18} />
            New Review
          </button>
        ) : null}
      </section>

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
            <ClipboardList
              size={22}
            />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Total Reviews
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {reviews.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-slate-100 p-3 text-slate-700">
            <Award size={22} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Average Score
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {getScoreLabel(averageScore, reviews.length > 0)}
            <span className="ml-2 text-base font-medium text-slate-500">
              {reviews.length > 0 ? `(${averageScore}%)` : ""}
            </span>
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <CheckCircle2
              size={22}
            />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {completedCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-fit rounded-xl bg-amber-50 p-3 text-amber-700">
            <TrendingUp
              size={22}
            />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Draft Reviews
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {draftCount}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Performance Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Average scores for each
          performance category.
        </p>

        <div className="mt-6 space-y-5">
          {categoryAverages.map(
            (category) => (
              <div key={category.label}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {category.label}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {getScoreLabel(category.value, reviews.length > 0)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{
                      width: `${Math.min(
                        category.value,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Performance Reviews
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ClipboardList
              size={42}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-medium text-slate-700">
              No performance reviews
              found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Performance records will
              appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Review
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Period
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Score
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  {canManage ? (
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {reviews.map(
                  (review) => {
                    const score =
                      Number(
                        review.overallScore,
                      );

                    return (
                      <tr
                        key={review.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-900">
                            {
                              review
                                .employee
                                .firstName
                            }{" "}
                            {
                              review
                                .employee
                                .lastName
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              review
                                .employee
                                .employeeNumber
                            }
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-800">
                            {review.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(
                              review.reviewDate,
                            ).toLocaleDateString()}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          {formatPeriod(
                            review.period,
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getScoreToneClass(score)}`}
                          >
                            {getScoreLabel(score)}
                          </span>
                          <p className="mt-1 text-xs text-slate-500">
                            Overall {score}%
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={
                              review.status ===
                              "COMPLETED"
                                ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                : "inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                            }
                          >
                            {review.status}
                          </span>
                        </td>

                        {canManage ? (
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              {review.status ===
                              "DRAFT" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleComplete(
                                      review.id,
                                    )
                                  }
                                  className="rounded-lg border border-emerald-200 p-2 text-emerald-700 transition hover:bg-emerald-50"
                                  title="Complete review"
                                >
                                  <CheckCircle2
                                    size={17}
                                  />
                                </button>
                              ) : null}

                              {review.status ===
                              "DRAFT" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setError("");
                                    setSuccess("");

                                    setReviewToDelete(
                                      review,
                                    );
                                  }}
                                  className="rounded-lg border border-red-200 p-2 text-red-700 transition hover:bg-red-50"
                                  title="Delete review"
                                >
                                  <Trash2
                                    size={17}
                                  />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Create Performance
                  Review
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter employee scores
                  from 0 to 100.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateForm
                }
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
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Employee
                  </label>

                  <select
                    value={
                      form.employeeId
                    }
                    onChange={(event) =>
                      updateForm(
                        "employeeId",
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={
                            employee.id
                          }
                          value={
                            employee.id
                          }
                        >
                          {
                            employee.employeeNumber
                          }{" "}
                          -{" "}
                          {
                            employee.firstName
                          }{" "}
                          {
                            employee.lastName
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Review title
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
                    placeholder="Monthly Performance Review"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Review date
                  </label>

                  <input
                    type="date"
                    value={
                      form.reviewDate
                    }
                    onChange={(event) =>
                      updateForm(
                        "reviewDate",
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Review period
                  </label>

                  <select
                    value={form.period}
                    onChange={(event) =>
                      updateForm(
                        "period",
                        event.target
                          .value as PerformancePeriod,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                  >
                    <option value="MONTHLY">
                      Monthly
                    </option>

                    <option value="QUARTERLY">
                      Quarterly
                    </option>

                    <option value="HALF_YEARLY">
                      Half Yearly
                    </option>

                    <option value="YEARLY">
                      Yearly
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Performance Scores
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose Bad, Low, Average, or Good for each area.
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <ScoreRatingSelect
                    label="Productivity"
                    value={form.productivityScore}
                    onChange={(value) =>
                      updateForm("productivityScore", value)
                    }
                  />

                  <ScoreRatingSelect
                    label="Work Quality"
                    value={form.qualityScore}
                    onChange={(value) =>
                      updateForm("qualityScore", value)
                    }
                  />

                  <ScoreRatingSelect
                    label="Teamwork"
                    value={form.teamworkScore}
                    onChange={(value) =>
                      updateForm("teamworkScore", value)
                    }
                  />

                  <ScoreRatingSelect
                    label="Attendance"
                    value={form.attendanceScore}
                    onChange={(value) =>
                      updateForm("attendanceScore", value)
                    }
                  />

                  <ScoreRatingSelect
                    label="Communication"
                    value={form.communicationScore}
                    onChange={(value) =>
                      updateForm("communicationScore", value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Strengths
                  </label>

                  <textarea
                    value={
                      form.strengths
                    }
                    onChange={(event) =>
                      updateForm(
                        "strengths",
                        event.target.value,
                      )
                    }
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    placeholder="Employee strengths"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Areas for improvement
                  </label>

                  <textarea
                    value={
                      form.improvements
                    }
                    onChange={(event) =>
                      updateForm(
                        "improvements",
                        event.target.value,
                      )
                    }
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    placeholder="Areas that need improvement"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Reviewer comments
                  </label>

                  <textarea
                    value={
                      form.reviewerComments
                    }
                    onChange={(event) =>
                      updateForm(
                        "reviewerComments",
                        event.target.value,
                      )
                    }
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                    placeholder="Additional reviewer comments"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={
                    closeCreateForm
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-w-36 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Creating..."
                    : "Create Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {reviewToDelete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Trash2 size={22} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Delete performance
                    review?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You are about to
                    delete{" "}
                    <span className="font-semibold text-slate-900">
                      {
                        reviewToDelete.title
                      }
                    </span>{" "}
                    for{" "}
                    <span className="font-semibold text-slate-900">
                      {
                        reviewToDelete
                          .employee
                          .firstName
                      }{" "}
                      {
                        reviewToDelete
                          .employee
                          .lastName
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
                  setReviewToDelete(
                    null,
                  )
                }
                disabled={deleting}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                    Delete Review
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