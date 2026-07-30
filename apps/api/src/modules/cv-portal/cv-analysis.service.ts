import {
    CvAnalysisStatus,
    HiringRecommendation,
    Prisma,
} from "../../generated/prisma/client.js";

import {
    geminiModel,
} from "../../config/gemini.js";

import {
    prisma,
} from "../../lib/prisma.js";

import {
    analyzeCandidateWithGemini,
} from "./cv-ai.service.js";

import {
    calculateLocalCandidateMatch,
} from "./cv-matcher.service.js";

import {
    getCompanyPeerCompensation,
} from "../../lib/peer-compensation.js";

const fullAnalysisInclude = {
  candidate: {
    include: {
      jobOpening: {
        include: {
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
    },
  },
} satisfies Prisma.CvAnalysisInclude;

const rankingCandidateInclude = {
  submittedByEmployee: {
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      email: true,

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

  jobOpening: {
    select: {
      id: true,
      title: true,
      employmentType: true,
      status: true,
      salaryMin: true,
      salaryMax: true,
    },
  },

  cvAnalysis: {
    select: {
      id: true,
      status: true,

      localMatchScore: true,
      aiMatchScore: true,
      finalMatchScore: true,

      recommendation: true,

      summary: true,

      matchedSkills: true,
      missingSkills: true,
      strengths: true,
      concerns: true,

      recommendedSalaryMin: true,
      recommendedSalaryTarget: true,
      recommendedSalaryMax: true,

      salaryRecommendationReason: true,

      modelUsed: true,
      analyzedAt: true,
    },
  },
} satisfies Prisma.CandidateInclude;

function numberFromDecimal(
  value:
    | Prisma.Decimal
    | number
    | string
    | null
    | undefined,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsedValue =
    Number(value);

  return Number.isFinite(
    parsedValue,
  )
    ? parsedValue
    : null;
}

function roundToTwoDecimals(
  value: number,
): number {
  return (
    Math.round(
      value * 100,
    ) / 100
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    Math.max(
      value,
      minimum,
    ),
    maximum,
  );
}

function calculateFinalMatchScore(
  localMatchScore: number,
  aiMatchScore: number,
): number {
  const localWeight =
    0.4;

  const aiWeight =
    0.6;

  return roundToTwoDecimals(
    clamp(
      localMatchScore *
        localWeight +
        aiMatchScore *
          aiWeight,
      0,
      100,
    ),
  );
}

function getRecommendationFromScore(
  score: number,
): HiringRecommendation {
  if (score >= 85) {
    return HiringRecommendation.HIGHLY_RECOMMENDED;
  }

  if (score >= 70) {
    return HiringRecommendation.RECOMMENDED;
  }

  if (score >= 55) {
    return HiringRecommendation.CONSIDER;
  }

  return HiringRecommendation.NOT_RECOMMENDED;
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim().length >
      0
  ) {
    return error.message
      .trim()
      .slice(
        0,
        5000,
      );
  }

  return "CV analysis failed because of an unknown error";
}

async function getCandidateForAnalysis(
  submissionId: string,
) {
  const candidate =
    await prisma.candidate.findFirst({
      where: {
        id:
          submissionId,

        isSelfSubmitted:
          true,
      },

      include: {
        jobOpening: {
          select: {
            id: true,
            title: true,
            description: true,

            status: true,

            minimumExperience: true,

            requiredSkills: true,
            requirements: true,
            responsibilities: true,

            salaryMin: true,
            salaryMax: true,

            departmentId: true,
            positionId: true,
          },
        },

        submittedByEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },

        cvAnalysis: true,
      },
    });

  if (!candidate) {
    throw new Error(
      "CV submission not found",
    );
  }

  const cvAnalysis =
    candidate.cvAnalysis;

  if (!cvAnalysis) {
    throw new Error(
      "The CV analysis record was not created for this submission",
    );
  }

  if (
    !candidate.resumeUrl ||
    !candidate.resumeFileName
  ) {
    throw new Error(
      "The candidate does not have an uploaded CV",
    );
  }

  const extractedText =
    cvAnalysis.extractedText?.trim();

  if (
    !extractedText ||
    extractedText.length <
      30
  ) {
    throw new Error(
      "The uploaded CV does not contain enough readable text",
    );
  }

  return {
    candidate: {
      ...candidate,
      cvAnalysis,
    },

    extractedText,
  };
}

async function markAnalysisAsProcessing(
  candidateId: string,
): Promise<void> {
  await prisma.cvAnalysis.update({
    where: {
      candidateId,
    },

    data: {
      status:
        CvAnalysisStatus.PROCESSING,

      errorMessage:
        null,
    },
  });
}

async function markAnalysisAsFailed(
  candidateId: string,
  error: unknown,
): Promise<void> {
  try {
    await prisma.cvAnalysis.update({
      where: {
        candidateId,
      },

      data: {
        status:
          CvAnalysisStatus.FAILED,

        errorMessage:
          getErrorMessage(
            error,
          ),
      },
    });
  } catch (
    databaseError
  ) {
    console.error(
      "Unable to mark CV analysis as failed:",
      databaseError,
    );
  }
}

export async function analyzeCvSubmission(
  submissionId: string,
  allowReanalysis = false,
) {
  const {
    candidate,
    extractedText,
  } =
    await getCandidateForAnalysis(
      submissionId,
    );

  if (
    candidate.cvAnalysis
      .status ===
      CvAnalysisStatus.PROCESSING
  ) {
    throw new Error(
      "This CV analysis is already processing",
    );
  }

  if (
    candidate.cvAnalysis
      .status ===
      CvAnalysisStatus.COMPLETED &&
    !allowReanalysis
  ) {
    throw new Error(
      "This CV has already been analyzed. Use the reanalyze endpoint to run it again.",
    );
  }

  await markAnalysisAsProcessing(
    candidate.id,
  );

  try {
    const candidateExperience =
      numberFromDecimal(
        candidate
          .yearsOfExperience,
      ) ?? 0;

    const salaryMinimum =
      numberFromDecimal(
        candidate.jobOpening
          .salaryMin,
      );

    const salaryMaximum =
      numberFromDecimal(
        candidate.jobOpening
          .salaryMax,
      );

    const localAnalysis =
      calculateLocalCandidateMatch({
        candidate: {
          currentJobTitle:
            candidate.currentJobTitle,

          yearsOfExperience:
            candidateExperience,

          skills:
            candidate.skills,

          education:
            candidate.education,

          extractedText,
        },

        jobOpening: {
          title:
            candidate.jobOpening
              .title,

          description:
            candidate.jobOpening
              .description,

          minimumExperience:
            candidate.jobOpening
              .minimumExperience,

          requiredSkills:
            candidate.jobOpening
              .requiredSkills,

          requirements:
            candidate.jobOpening
              .requirements,

          responsibilities:
            candidate.jobOpening
              .responsibilities,

          salaryMin:
            salaryMinimum,

          salaryMax:
            salaryMaximum,
        },
      });

    const companyPeers =
      await getCompanyPeerCompensation({
        positionId:
          candidate.jobOpening
            .positionId,

        departmentId:
          candidate.jobOpening
            .departmentId,
      });

    const aiAnalysis =
      await analyzeCandidateWithGemini({
        candidate: {
          firstName:
            candidate.firstName,

          lastName:
            candidate.lastName,

          currentJobTitle:
            candidate.currentJobTitle,

          currentCompany:
            candidate.currentCompany,

          yearsOfExperience:
            candidateExperience,

          skills:
            candidate.skills,

          education:
            candidate.education,

          extractedText,
        },

        jobOpening: {
          title:
            candidate.jobOpening
              .title,

          description:
            candidate.jobOpening
              .description,

          minimumExperience:
            candidate.jobOpening
              .minimumExperience,

          requiredSkills:
            candidate.jobOpening
              .requiredSkills,

          requirements:
            candidate.jobOpening
              .requirements,

          responsibilities:
            candidate.jobOpening
              .responsibilities,

          salaryMin:
            salaryMinimum,

          salaryMax:
            salaryMaximum,
        },

        localAnalysis,
        companyPeers,
      });

    const finalMatchScore =
      calculateFinalMatchScore(
        localAnalysis.localMatchScore,
        aiAnalysis.aiMatchScore,
      );

    const recommendation =
      getRecommendationFromScore(
        finalMatchScore,
      );

    const combinedMatchedSkills =
      Array.from(
        new Set([
          ...localAnalysis.matchedSkills,
          ...aiAnalysis.matchedSkills,
        ]),
      );

    const combinedMissingSkills =
      Array.from(
        new Set([
          ...localAnalysis.missingSkills,
          ...aiAnalysis.missingSkills,
        ]),
      );

    const completedAnalysis =
      await prisma.cvAnalysis.update({
        where: {
          candidateId:
            candidate.id,
        },

        data: {
          status:
            CvAnalysisStatus.COMPLETED,

          localMatchScore:
            localAnalysis.localMatchScore,

          aiMatchScore:
            aiAnalysis.aiMatchScore,

          finalMatchScore,

          skillsScore:
            localAnalysis.skillsScore,

          experienceScore:
            localAnalysis.experienceScore,

          jobTitleScore:
            localAnalysis.jobTitleScore,

          educationScore:
            localAnalysis.educationScore,

          completenessScore:
            localAnalysis.completenessScore,

          summary:
            aiAnalysis.summary,

          matchedSkills:
            combinedMatchedSkills,

          missingSkills:
            combinedMissingSkills,

          strengths:
            aiAnalysis.strengths,

          concerns:
            aiAnalysis.concerns,

          interviewQuestions:
            aiAnalysis.interviewQuestions,

          recommendation,

          recommendedSalaryMin:
            aiAnalysis.recommendedSalaryMin,

          recommendedSalaryTarget:
            aiAnalysis.recommendedSalaryTarget,

          recommendedSalaryMax:
            aiAnalysis.recommendedSalaryMax,

          salaryRecommendationReason:
            aiAnalysis.salaryRecommendationReason,

          modelUsed:
            geminiModel,

          errorMessage:
            null,

          analyzedAt:
            new Date(),
        },

        include:
          fullAnalysisInclude,
      });

    return completedAnalysis;
  } catch (
    error
  ) {
    await markAnalysisAsFailed(
      candidate.id,
      error,
    );

    throw error;
  }
}

export async function getCvAnalysisForHr(
  submissionId: string,
) {
  const analysis =
    await prisma.cvAnalysis.findFirst({
      where: {
        candidateId:
          submissionId,

        candidate: {
          isSelfSubmitted:
            true,
        },
      },

      include:
        fullAnalysisInclude,
    });

  if (!analysis) {
    throw new Error(
      "CV analysis not found",
    );
  }

  return analysis;
}

export async function getJobCandidateRanking(
  jobOpeningId: string,
) {
  const jobOpening =
    await prisma.jobOpening.findUnique({
      where: {
        id:
          jobOpeningId,
      },

      select: {
        id: true,
        title: true,
        status: true,
        numberOfVacancies: true,

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
    });

  if (!jobOpening) {
    throw new Error(
      "Job opening not found",
    );
  }

  const candidates =
    await prisma.candidate.findMany({
      where: {
        jobOpeningId,

        isSelfSubmitted:
          true,

        cvAnalysis: {
          is: {
            status:
              CvAnalysisStatus.COMPLETED,

            finalMatchScore: {
              not:
                null,
            },
          },
        },
      },

      include:
        rankingCandidateInclude,

      orderBy: {
        cvAnalysis: {
          finalMatchScore:
            "desc",
        },
      },
    });

  const rankedCandidates =
    candidates.map(
      (
        candidate,
        index,
      ) => ({
        rank:
          index + 1,

        candidateId:
          candidate.id,

        candidateName:
          `${candidate.firstName} ${candidate.lastName}`,

        email:
          candidate.email,

        phone:
          candidate.phone,

        currentJobTitle:
          candidate.currentJobTitle,

        currentCompany:
          candidate.currentCompany,

        yearsOfExperience:
          Number(
            candidate
              .yearsOfExperience,
          ),

        stage:
          candidate.stage,

        appliedAt:
          candidate.appliedAt,

        submittedByEmployee:
          candidate.submittedByEmployee,

        jobOpening:
          candidate.jobOpening,

        analysis:
          candidate.cvAnalysis,
      }),
    );

  return {
    jobOpening,

    totalCandidates:
      rankedCandidates.length,

    rankedCandidates,
  };
}

export async function getAnalyzedCvSubmissions() {
  return prisma.candidate.findMany({
    where: {
      isSelfSubmitted:
        true,

      cvAnalysis: {
        is: {
          status:
            CvAnalysisStatus.COMPLETED,
        },
      },
    },

    include:
      rankingCandidateInclude,

    orderBy: [
      {
        cvAnalysis: {
          finalMatchScore:
            "desc",
        },
      },

      {
        appliedAt:
          "desc",
      },
    ],
  });
}

export async function getPendingCvSubmissions() {
  return prisma.candidate.findMany({
    where: {
      isSelfSubmitted:
        true,

      cvAnalysis: {
        is: {
          status: {
            in: [
              CvAnalysisStatus.PENDING,
              CvAnalysisStatus.FAILED,
            ],
          },
        },
      },
    },

    include:
      rankingCandidateInclude,

    orderBy: {
      appliedAt:
        "asc",
    },
  });
}