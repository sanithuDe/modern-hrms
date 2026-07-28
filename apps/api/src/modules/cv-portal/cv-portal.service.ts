import path from "node:path";

import {
    CandidateStage,
    CvAnalysisStatus,
    JobOpeningStatus,
    Prisma,
} from "../../generated/prisma/client.js";

import {
    prisma,
} from "../../lib/prisma.js";

import {
    deleteCvFile,
    extractCvText,
} from "./cv-extractor.service.js";

import type {
    CreateMyCvSubmissionInput,
} from "./cv-portal.schema.js";

const employeeSubmissionInclude = {
  jobOpening: {
    select: {
      id: true,
      title: true,
      description: true,
      employmentType: true,
      status: true,
      minimumExperience: true,
      requiredSkills: true,
      location: true,
      applicationDeadline: true,

      department: {
        select: {
          id: true,
          name: true,
        },
      },

      position: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },

  cvAnalysis: {
    select: {
      id: true,
      status: true,
      errorMessage: true,
      analyzedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.CandidateInclude;

const hrSubmissionInclude = {
  jobOpening: {
    select: {
      id: true,
      title: true,
      description: true,
      employmentType: true,
      status: true,
      minimumExperience: true,
      requiredSkills: true,
      responsibilities: true,
      requirements: true,
      salaryMin: true,
      salaryMax: true,
      location: true,
      applicationDeadline: true,

      department: {
        select: {
          id: true,
          name: true,
        },
      },

      position: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },

  submittedByEmployee: {
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,

      department: {
        select: {
          id: true,
          name: true,
        },
      },

      position: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },

  createdBy: {
    select: {
      id: true,
      email: true,
      role: true,
    },
  },

  cvAnalysis: true,
} satisfies Prisma.CandidateInclude;

function cleanOptionalString(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const trimmedValue =
    value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : null;
}

function createStoredResumeUrl(
  storedFileName: string,
): string {
  return path
    .join(
      "uploads",
      "cvs",
      storedFileName,
    )
    .replace(
      /\\/g,
      "/",
    );
}

function resolveStoredResumePath(
  resumeUrl:
    | string
    | null
    | undefined,
): string | null {
  if (!resumeUrl) {
    return null;
  }

  return path.resolve(
    process.cwd(),
    resumeUrl,
  );
}

async function getEmployeeForUser(
  userId: string,
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        status: true,

        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
    });

  if (!user) {
    throw new Error(
      "Authenticated user was not found",
    );
  }

  if (
    user.status !==
    "ACTIVE"
  ) {
    throw new Error(
      "Your user account is not active",
    );
  }

  if (!user.employee) {
    throw new Error(
      "Your user account is not connected to an employee profile",
    );
  }

  if (
    !user.employee.isActive
  ) {
    throw new Error(
      "Your employee profile is inactive",
    );
  }

  return {
    userId: user.id,
    userEmail: user.email,
    employee:
      user.employee,
  };
}

export async function getCvPortalJobs() {
  const now =
    new Date();

  return prisma.jobOpening.findMany({
    where: {
      status:
        JobOpeningStatus.OPEN,

      OR: [
        {
          applicationDeadline:
            null,
        },
        {
          applicationDeadline: {
            gte: now,
          },
        },
      ],
    },

    select: {
      id: true,
      title: true,
      description: true,
      employmentType: true,
      numberOfVacancies: true,
      minimumExperience: true,
      requiredSkills: true,
      responsibilities: true,
      requirements: true,
      location: true,
      applicationDeadline: true,
      createdAt: true,

      department: {
        select: {
          id: true,
          name: true,
        },
      },

      position: {
        select: {
          id: true,
          title: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createMyCvSubmission(
  userId: string,
  input: CreateMyCvSubmissionInput,
  file:
    | Express.Multer.File
    | undefined,
) {
  if (!file) {
    throw new Error(
      'CV file is required. Upload the file using the field name "cv"',
    );
  }

  let shouldDeleteUploadedFile =
    true;

  try {
    const {
      userId: creatorUserId,
      userEmail,
      employee,
    } =
      await getEmployeeForUser(
        userId,
      );

    const jobOpening =
      await prisma.jobOpening.findUnique({
        where: {
          id:
            input.jobOpeningId,
        },

        select: {
          id: true,
          status: true,
          applicationDeadline: true,
        },
      });

    if (!jobOpening) {
      throw new Error(
        "Job opening not found",
      );
    }

    if (
      jobOpening.status !==
      JobOpeningStatus.OPEN
    ) {
      throw new Error(
        "Applications are accepted only for open job positions",
      );
    }

    if (
      jobOpening.applicationDeadline &&
      jobOpening.applicationDeadline <
        new Date()
    ) {
      throw new Error(
        "The application deadline has passed",
      );
    }

    const existingSubmission =
      await prisma.candidate.findFirst({
        where: {
          jobOpeningId:
            input.jobOpeningId,

          submittedByEmployeeId:
            employee.id,

          isSelfSubmitted:
            true,

          stage: {
            not:
              CandidateStage.WITHDRAWN,
          },
        },

        select: {
          id: true,
        },
      });

    if (
      existingSubmission
    ) {
      throw new Error(
        "You already submitted a CV for this job opening",
      );
    }

    const extractionResult =
      await extractCvText({
        filePath:
          file.path,

        mimeType:
          file.mimetype,

        originalFileName:
          file.originalname,
      });

    const candidateEmail =
      employee.email ??
      userEmail;

    if (!candidateEmail) {
      throw new Error(
        "Your account does not have an email address",
      );
    }

    const storedResumeUrl =
      createStoredResumeUrl(
        file.filename,
      );

    const candidate =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          const createdCandidate =
            await transaction.candidate.create({
              data: {
                firstName:
                  employee.firstName.trim(),

                lastName:
                  employee.lastName.trim(),

                email:
                  candidateEmail
                    .trim()
                    .toLowerCase(),

                phone:
                  cleanOptionalString(
                    input.phone,
                  ) ??
                  employee.phone,

                currentJobTitle:
                  cleanOptionalString(
                    input.currentJobTitle,
                  ),

                currentCompany:
                  cleanOptionalString(
                    input.currentCompany,
                  ),

                yearsOfExperience:
                  input.yearsOfExperience,

                linkedInUrl:
                  cleanOptionalString(
                    input.linkedInUrl,
                  ),

                portfolioUrl:
                  cleanOptionalString(
                    input.portfolioUrl,
                  ),

                notes:
                  cleanOptionalString(
                    input.notes,
                  ),

                resumeFileName:
                  file.originalname,

                resumeUrl:
                  storedResumeUrl,

                resumeMimeType:
                  file.mimetype,

                resumeSizeBytes:
                  file.size,

                resumeUploadedAt:
                  new Date(),

                stage:
                  CandidateStage.APPLIED,

                appliedAt:
                  new Date(),

                isSelfSubmitted:
                  true,

                submittedByEmployeeId:
                  employee.id,

                jobOpeningId:
                  input.jobOpeningId,

                createdById:
                  creatorUserId,
              },
            });

          await transaction.cvAnalysis.create({
            data: {
              candidateId:
                createdCandidate.id,

              status:
                CvAnalysisStatus.PENDING,

              extractedText:
                extractionResult.text,

              extractedName:
                `${employee.firstName} ${employee.lastName}`,

              extractedEmail:
                candidateEmail
                  .trim()
                  .toLowerCase(),

              extractedPhone:
                cleanOptionalString(
                  input.phone,
                ) ??
                employee.phone,
            },
          });

          return transaction.candidate.findUniqueOrThrow({
            where: {
              id:
                createdCandidate.id,
            },

            include:
              employeeSubmissionInclude,
          });
        },
      );

    shouldDeleteUploadedFile =
      false;

    return candidate;
  } finally {
    if (
      shouldDeleteUploadedFile
    ) {
      await deleteCvFile(
        file.path,
      );
    }
  }
}

export async function getMyCvSubmissions(
  userId: string,
) {
  const {
    employee,
  } =
    await getEmployeeForUser(
      userId,
    );

  return prisma.candidate.findMany({
    where: {
      submittedByEmployeeId:
        employee.id,

      isSelfSubmitted:
        true,
    },

    include:
      employeeSubmissionInclude,

    orderBy: {
      appliedAt: "desc",
    },
  });
}

export async function getMyCvSubmissionById(
  userId: string,
  submissionId: string,
) {
  const {
    employee,
  } =
    await getEmployeeForUser(
      userId,
    );

  const submission =
    await prisma.candidate.findFirst({
      where: {
        id:
          submissionId,

        submittedByEmployeeId:
          employee.id,

        isSelfSubmitted:
          true,
      },

      include:
        employeeSubmissionInclude,
    });

  if (!submission) {
    throw new Error(
      "CV submission not found",
    );
  }

  return submission;
}

export async function withdrawMyCvSubmission(
  userId: string,
  submissionId: string,
) {
  const {
    employee,
  } =
    await getEmployeeForUser(
      userId,
    );

  const existingSubmission =
    await prisma.candidate.findFirst({
      where: {
        id:
          submissionId,

        submittedByEmployeeId:
          employee.id,

        isSelfSubmitted:
          true,
      },

      select: {
        id: true,
        stage: true,
      },
    });

  if (
    !existingSubmission
  ) {
    throw new Error(
      "CV submission not found",
    );
  }

  if (
    existingSubmission.stage ===
      CandidateStage.HIRED
  ) {
    throw new Error(
      "A hired application cannot be withdrawn",
    );
  }

  if (
    existingSubmission.stage ===
      CandidateStage.REJECTED
  ) {
    throw new Error(
      "A rejected application cannot be withdrawn",
    );
  }

  if (
    existingSubmission.stage ===
      CandidateStage.WITHDRAWN
  ) {
    throw new Error(
      "This application is already withdrawn",
    );
  }

  return prisma.candidate.update({
    where: {
      id:
        existingSubmission.id,
    },

    data: {
      stage:
        CandidateStage.WITHDRAWN,
    },

    include:
      employeeSubmissionInclude,
  });
}

export async function getAllCvSubmissions() {
  return prisma.candidate.findMany({
    where: {
      isSelfSubmitted:
        true,
    },

    include:
      hrSubmissionInclude,

    orderBy: [
      {
        appliedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function getCvSubmissionForHr(
  submissionId: string,
) {
  const submission =
    await prisma.candidate.findFirst({
      where: {
        id:
          submissionId,

        isSelfSubmitted:
          true,
      },

      include:
        hrSubmissionInclude,
    });

  if (!submission) {
    throw new Error(
      "CV submission not found",
    );
  }

  return submission;
}

export async function permanentlyDeleteCvSubmission(
  submissionId: string,
) {
  const existingSubmission =
    await prisma.candidate.findUnique({
      where: {
        id:
          submissionId,
      },

      select: {
        id: true,
        stage: true,
        resumeUrl: true,
      },
    });

  if (!existingSubmission) {
    throw new Error(
      "CV submission not found",
    );
  }

  if (
    existingSubmission.stage ===
      CandidateStage.HIRED
  ) {
    throw new Error(
      "A hired candidate cannot be deleted",
    );
  }

  await prisma.candidate.delete({
    where: {
      id:
        existingSubmission.id,
    },
  });

  await deleteCvFile(
    resolveStoredResumePath(
      existingSubmission.resumeUrl,
    ),
  );

  return {
    id:
      existingSubmission.id,
  };
}