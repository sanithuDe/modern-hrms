import {
  CandidateStage,
  JobOpeningStatus,
  Prisma,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import type {
  CreateCandidateInput,
  CreateJobOpeningInput,
  UpdateCandidateInput,
  UpdateCandidateStageInput,
  UpdateJobOpeningInput,
  UpdateJobStatusInput,
} from "./recruitment.schema.js";

const jobOpeningInclude = {
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

  createdBy: {
    select: {
      id: true,
      email: true,
      role: true,

      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNumber: true,
        },
      },
    },
  },

  _count: {
    select: {
      candidates: true,
    },
  },
} satisfies Prisma.JobOpeningInclude;

const candidateInclude = {
  jobOpening: {
    select: {
      id: true,
      title: true,
      status: true,
      employmentType: true,

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

      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNumber: true,
        },
      },
    },
  },
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

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function cleanOptionalId(
  value:
    | string
    | null
    | undefined,
): string | null {
  return cleanOptionalString(
    value,
  );
}

function parseOptionalDate(
  value:
    | string
    | null
    | undefined,
): Date | null {
  if (!value) {
    return null;
  }

  return new Date(value);
}

async function validateJobRelations(
  departmentId:
    | string
    | null,
  positionId:
    | string
    | null,
): Promise<void> {
  if (departmentId) {
    const department =
      await prisma.department.findUnique({
        where: {
          id: departmentId,
        },

        select: {
          id: true,
          isActive: true,
        },
      });

    if (!department) {
      throw new Error(
        "Department not found",
      );
    }

    if (!department.isActive) {
      throw new Error(
        "The selected department is inactive",
      );
    }
  }

  if (positionId) {
    const position =
      await prisma.position.findUnique({
        where: {
          id: positionId,
        },

        select: {
          id: true,
          isActive: true,
          departmentId: true,
        },
      });

    if (!position) {
      throw new Error(
        "Position not found",
      );
    }

    if (!position.isActive) {
      throw new Error(
        "The selected position is inactive",
      );
    }

    if (
      departmentId &&
      position.departmentId &&
      position.departmentId !==
        departmentId
    ) {
      throw new Error(
        "The selected position does not belong to the selected department",
      );
    }
  }
}

export async function createJobOpening(
  input: CreateJobOpeningInput,
  createdById: string,
) {
  const creator =
    await prisma.user.findUnique({
      where: {
        id: createdById,
      },

      select: {
        id: true,
      },
    });

  if (!creator) {
    throw new Error(
      "Job opening creator was not found",
    );
  }

  const departmentId =
    cleanOptionalId(
      input.departmentId,
    );

  const positionId =
    cleanOptionalId(
      input.positionId,
    );

  await validateJobRelations(
    departmentId,
    positionId,
  );

  if (
    input.salaryMin !==
      undefined &&
    input.salaryMin !== null &&
    input.salaryMax !==
      undefined &&
    input.salaryMax !== null &&
    input.salaryMax <
      input.salaryMin
  ) {
    throw new Error(
      "Maximum salary must be greater than or equal to minimum salary",
    );
  }

  return prisma.jobOpening.create({
    data: {
      title:
        input.title.trim(),

      description:
        input.description.trim(),

      employmentType:
        input.employmentType,

      status:
        JobOpeningStatus.DRAFT,

      numberOfVacancies:
        input.numberOfVacancies,

      minimumExperience:
        input.minimumExperience,

      requiredSkills:
        cleanOptionalString(
          input.requiredSkills,
        ),

      responsibilities:
        cleanOptionalString(
          input.responsibilities,
        ),

      requirements:
        cleanOptionalString(
          input.requirements,
        ),

      salaryMin:
        input.salaryMin ?? null,

      salaryMax:
        input.salaryMax ?? null,

      location:
        cleanOptionalString(
          input.location,
        ),

      applicationDeadline:
        parseOptionalDate(
          input.applicationDeadline,
        ),

      departmentId,
      positionId,
      createdById,
    },

    include:
      jobOpeningInclude,
  });
}

export async function getJobOpenings() {
  return prisma.jobOpening.findMany({
    include:
      jobOpeningInclude,

    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function getJobOpeningById(
  id: string,
) {
  const jobOpening =
    await prisma.jobOpening.findUnique({
      where: {
        id,
      },

      include: {
        ...jobOpeningInclude,

        candidates: {
          include:
            candidateInclude,

          orderBy: {
            appliedAt: "desc",
          },
        },
      },
    });

  if (!jobOpening) {
    throw new Error(
      "Job opening not found",
    );
  }

  return jobOpening;
}

export async function updateJobOpening(
  id: string,
  input: UpdateJobOpeningInput,
) {
  const existing =
    await prisma.jobOpening.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
        departmentId: true,
        positionId: true,
        salaryMin: true,
        salaryMax: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Job opening not found",
    );
  }

  if (
    existing.status ===
      JobOpeningStatus.CANCELLED
  ) {
    throw new Error(
      "A cancelled job opening cannot be edited",
    );
  }

  const departmentId =
    input.departmentId !==
    undefined
      ? cleanOptionalId(
          input.departmentId,
        )
      : existing.departmentId;

  const positionId =
    input.positionId !==
    undefined
      ? cleanOptionalId(
          input.positionId,
        )
      : existing.positionId;

  await validateJobRelations(
    departmentId,
    positionId,
  );

  const salaryMin =
    input.salaryMin !==
    undefined
      ? input.salaryMin
      : existing.salaryMin
        ? Number(
            existing.salaryMin,
          )
        : null;

  const salaryMax =
    input.salaryMax !==
    undefined
      ? input.salaryMax
      : existing.salaryMax
        ? Number(
            existing.salaryMax,
          )
        : null;

  if (
    salaryMin !== null &&
    salaryMax !== null &&
    salaryMax < salaryMin
  ) {
    throw new Error(
      "Maximum salary must be greater than or equal to minimum salary",
    );
  }

  return prisma.jobOpening.update({
    where: {
      id,
    },

    data: {
      ...(input.title !==
        undefined && {
        title:
          input.title.trim(),
      }),

      ...(input.description !==
        undefined && {
        description:
          input.description.trim(),
      }),

      ...(input.employmentType !==
        undefined && {
        employmentType:
          input.employmentType,
      }),

      ...(input.numberOfVacancies !==
        undefined && {
        numberOfVacancies:
          input.numberOfVacancies,
      }),

      ...(input.minimumExperience !==
        undefined && {
        minimumExperience:
          input.minimumExperience,
      }),

      ...(input.requiredSkills !==
        undefined && {
        requiredSkills:
          cleanOptionalString(
            input.requiredSkills,
          ),
      }),

      ...(input.responsibilities !==
        undefined && {
        responsibilities:
          cleanOptionalString(
            input.responsibilities,
          ),
      }),

      ...(input.requirements !==
        undefined && {
        requirements:
          cleanOptionalString(
            input.requirements,
          ),
      }),

      ...(input.salaryMin !==
        undefined && {
        salaryMin:
          input.salaryMin,
      }),

      ...(input.salaryMax !==
        undefined && {
        salaryMax:
          input.salaryMax,
      }),

      ...(input.location !==
        undefined && {
        location:
          cleanOptionalString(
            input.location,
          ),
      }),

      ...(input.applicationDeadline !==
        undefined && {
        applicationDeadline:
          parseOptionalDate(
            input.applicationDeadline,
          ),
      }),

      ...(input.departmentId !==
        undefined && {
        departmentId,
      }),

      ...(input.positionId !==
        undefined && {
        positionId,
      }),
    },

    include:
      jobOpeningInclude,
  });
}

export async function updateJobOpeningStatus(
  id: string,
  input: UpdateJobStatusInput,
) {
  const existing =
    await prisma.jobOpening.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
        applicationDeadline: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Job opening not found",
    );
  }

  if (
    existing.status ===
      input.status
  ) {
    throw new Error(
      `Job opening is already ${input.status.toLowerCase()}`,
    );
  }

  if (
    existing.status ===
      JobOpeningStatus.CANCELLED
  ) {
    throw new Error(
      "A cancelled job opening cannot be reopened",
    );
  }

  return prisma.jobOpening.update({
    where: {
      id,
    },

    data: {
      status:
        input.status,
    },

    include:
      jobOpeningInclude,
  });
}

export async function deleteJobOpening(
  id: string,
) {
  const existing =
    await prisma.jobOpening.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,

        _count: {
          select: {
            candidates: true,
          },
        },
      },
    });

  if (!existing) {
    throw new Error(
      "Job opening not found",
    );
  }

  if (
    existing._count.candidates >
    0
  ) {
    throw new Error(
      "Remove the candidates before deleting this job opening",
    );
  }

  if (
    existing.status ===
      JobOpeningStatus.OPEN
  ) {
    throw new Error(
      "Close or cancel the job opening before deleting it",
    );
  }

  await prisma.jobOpening.delete({
    where: {
      id,
    },
  });

  return {
    id: existing.id,
  };
}

export async function createCandidate(
  input: CreateCandidateInput,
  createdById: string,
) {
  const creator =
    await prisma.user.findUnique({
      where: {
        id: createdById,
      },

      select: {
        id: true,
      },
    });

  if (!creator) {
    throw new Error(
      "Candidate creator was not found",
    );
  }

  const jobOpening =
    await prisma.jobOpening.findUnique({
      where: {
        id: input.jobOpeningId,
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (!jobOpening) {
    throw new Error(
      "Job opening not found",
    );
  }

  if (
    jobOpening.status ===
      JobOpeningStatus.CANCELLED ||
    jobOpening.status ===
      JobOpeningStatus.CLOSED
  ) {
    throw new Error(
      "Candidates cannot be added to a closed or cancelled job opening",
    );
  }

  const normalizedEmail =
    input.email
      .trim()
      .toLowerCase();

  const duplicate =
    await prisma.candidate.findFirst({
      where: {
        jobOpeningId:
          input.jobOpeningId,

        email: {
          equals:
            normalizedEmail,

          mode:
            "insensitive",
        },
      },

      select: {
        id: true,
      },
    });

  if (duplicate) {
    throw new Error(
      "This candidate already exists for the selected job opening",
    );
  }

  return prisma.candidate.create({
    data: {
      firstName:
        input.firstName.trim(),

      lastName:
        input.lastName.trim(),

      email:
        normalizedEmail,

      phone:
        cleanOptionalString(
          input.phone,
        ),

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

      skills:
        cleanOptionalString(
          input.skills,
        ),

      education:
        cleanOptionalString(
          input.education,
        ),

      address:
        cleanOptionalString(
          input.address,
        ),

      resumeFileName:
        cleanOptionalString(
          input.resumeFileName,
        ),

      resumeUrl:
        cleanOptionalString(
          input.resumeUrl,
        ),

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

      appliedAt:
        parseOptionalDate(
          input.appliedAt,
        ) ?? new Date(),

      stage:
        CandidateStage.APPLIED,

      jobOpeningId:
        input.jobOpeningId,

      createdById,
    },

    include:
      candidateInclude,
  });
}

export async function getCandidates() {
  return prisma.candidate.findMany({
    include:
      candidateInclude,

    orderBy: {
      appliedAt: "desc",
    },
  });
}

export async function getCandidateById(
  id: string,
) {
  const candidate =
    await prisma.candidate.findUnique({
      where: {
        id,
      },

      include:
        candidateInclude,
    });

  if (!candidate) {
    throw new Error(
      "Candidate not found",
    );
  }

  return candidate;
}

export async function updateCandidate(
  id: string,
  input: UpdateCandidateInput,
) {
  const existing =
    await prisma.candidate.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        email: true,
        jobOpeningId: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Candidate not found",
    );
  }

  const jobOpeningId =
    input.jobOpeningId ??
    existing.jobOpeningId;

  const email =
    input.email !== undefined
      ? input.email
          .trim()
          .toLowerCase()
      : existing.email;

  if (
    input.jobOpeningId !==
    undefined
  ) {
    const jobOpening =
      await prisma.jobOpening.findUnique({
        where: {
          id: jobOpeningId,
        },

        select: {
          id: true,
          status: true,
        },
      });

    if (!jobOpening) {
      throw new Error(
        "Job opening not found",
      );
    }

    if (
      jobOpening.status ===
        JobOpeningStatus.CLOSED ||
      jobOpening.status ===
        JobOpeningStatus.CANCELLED
    ) {
      throw new Error(
        "Candidate cannot be moved to a closed or cancelled job opening",
      );
    }
  }

  if (
    input.email !== undefined ||
    input.jobOpeningId !==
      undefined
  ) {
    const duplicate =
      await prisma.candidate.findFirst({
        where: {
          id: {
            not: id,
          },

          jobOpeningId,

          email: {
            equals: email,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
        },
      });

    if (duplicate) {
      throw new Error(
        "This candidate already exists for the selected job opening",
      );
    }
  }

  return prisma.candidate.update({
    where: {
      id,
    },

    data: {
      ...(input.firstName !==
        undefined && {
        firstName:
          input.firstName.trim(),
      }),

      ...(input.lastName !==
        undefined && {
        lastName:
          input.lastName.trim(),
      }),

      ...(input.email !==
        undefined && {
        email,
      }),

      ...(input.phone !==
        undefined && {
        phone:
          cleanOptionalString(
            input.phone,
          ),
      }),

      ...(input.currentJobTitle !==
        undefined && {
        currentJobTitle:
          cleanOptionalString(
            input.currentJobTitle,
          ),
      }),

      ...(input.currentCompany !==
        undefined && {
        currentCompany:
          cleanOptionalString(
            input.currentCompany,
          ),
      }),

      ...(input.yearsOfExperience !==
        undefined && {
        yearsOfExperience:
          input.yearsOfExperience,
      }),

      ...(input.skills !==
        undefined && {
        skills:
          cleanOptionalString(
            input.skills,
          ),
      }),

      ...(input.education !==
        undefined && {
        education:
          cleanOptionalString(
            input.education,
          ),
      }),

      ...(input.address !==
        undefined && {
        address:
          cleanOptionalString(
            input.address,
          ),
      }),

      ...(input.resumeFileName !==
        undefined && {
        resumeFileName:
          cleanOptionalString(
            input.resumeFileName,
          ),
      }),

      ...(input.resumeUrl !==
        undefined && {
        resumeUrl:
          cleanOptionalString(
            input.resumeUrl,
          ),
      }),

      ...(input.linkedInUrl !==
        undefined && {
        linkedInUrl:
          cleanOptionalString(
            input.linkedInUrl,
          ),
      }),

      ...(input.portfolioUrl !==
        undefined && {
        portfolioUrl:
          cleanOptionalString(
            input.portfolioUrl,
          ),
      }),

      ...(input.notes !==
        undefined && {
        notes:
          cleanOptionalString(
            input.notes,
          ),
      }),

      ...(input.appliedAt !==
        undefined && {
        appliedAt:
          parseOptionalDate(
            input.appliedAt,
          ) ?? new Date(),
      }),

      ...(input.jobOpeningId !==
        undefined && {
        jobOpeningId,
      }),
    },

    include:
      candidateInclude,
  });
}

export async function updateCandidateStage(
  id: string,
  input: UpdateCandidateStageInput,
) {
  const existing =
    await prisma.candidate.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        stage: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Candidate not found",
    );
  }

  if (
    existing.stage ===
    input.stage
  ) {
    throw new Error(
      `Candidate is already in the ${input.stage.toLowerCase()} stage`,
    );
  }

  return prisma.candidate.update({
    where: {
      id,
    },

    data: {
      stage:
        input.stage,
    },

    include:
      candidateInclude,
  });
}

export async function deleteCandidate(
  id: string,
) {
  const existing =
    await prisma.candidate.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        stage: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Candidate not found",
    );
  }

  if (
    existing.stage ===
      CandidateStage.HIRED
  ) {
    throw new Error(
      "A hired candidate cannot be deleted",
    );
  }

  await prisma.candidate.delete({
    where: {
      id,
    },
  });

  return {
    id: existing.id,
  };
}