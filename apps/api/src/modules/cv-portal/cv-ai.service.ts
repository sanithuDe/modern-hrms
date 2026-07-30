import {
    gemini,
    geminiModel,
} from "../../config/gemini.js";

import {
    type CompanyPeerCompensationContext,
} from "../../lib/peer-compensation.js";

import {
    sanitizeNarrativeList,
    sanitizeNarrativeText,
} from "../../lib/output-sanitizer.js";

import { z } from "zod";

export interface GeminiCandidateAnalysisInput {
  candidate: {
    firstName: string;
    lastName: string;

    currentJobTitle:
      | string
      | null;

    currentCompany:
      | string
      | null;

    yearsOfExperience: number;

    skills:
      | string
      | null;

    education:
      | string
      | null;

    extractedText: string;
  };

  jobOpening: {
    title: string;
    description: string;

    minimumExperience: number;

    requiredSkills:
      | string
      | null;

    requirements:
      | string
      | null;

    responsibilities:
      | string
      | null;

    salaryMin:
      | number
      | null;

    salaryMax:
      | number
      | null;
  };

  localAnalysis: {
    localMatchScore: number;

    skillsScore: number;
    experienceScore: number;
    jobTitleScore: number;
    educationScore: number;
    completenessScore: number;

    matchedSkills: string[];
    missingSkills: string[];

    recommendedSalaryMin:
      | number
      | null;

    recommendedSalaryTarget:
      | number
      | null;

    recommendedSalaryMax:
      | number
      | null;

    salaryCalculationReason:
      | string
      | null;
  };

  /** Anonymized company peers used for max-salary recommendation. */
  companyPeers: CompanyPeerCompensationContext;
}

const hiringRecommendationSchema =
  z.enum([
    "HIGHLY_RECOMMENDED",
    "RECOMMENDED",
    "CONSIDER",
    "NOT_RECOMMENDED",
  ]);

const geminiAnalysisSchema =
  z.object({
    aiMatchScore: z
      .number()
      .min(0)
      .max(100),

    summary: z
      .string()
      .trim()
      .min(20)
      .max(5000),

    matchedSkills: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(150),
      )
      .max(100),

    missingSkills: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(150),
      )
      .max(100),

    strengths: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(1000),
      )
      .min(1)
      .max(20),

    concerns: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(1000),
      )
      .max(20),

    interviewQuestions: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(1000),
      )
      .min(3)
      .max(15),

    recommendation:
      hiringRecommendationSchema,

    recommendedSalaryMin: z
      .number()
      .nonnegative()
      .nullable(),

    recommendedSalaryTarget: z
      .number()
      .nonnegative()
      .nullable(),

    recommendedSalaryMax: z
      .number()
      .nonnegative()
      .nullable(),

    salaryRecommendationReason: z
      .string()
      .trim()
      .max(3000)
      .nullable(),
  });

export type GeminiCandidateAnalysisResult =
  z.infer<
    typeof geminiAnalysisSchema
  >;

const responseSchema = {
  type: "object",

  properties: {
    aiMatchScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description:
        "Overall AI candidate-to-job match score from 0 to 100.",
    },

    summary: {
      type: "string",
      description:
        "Professional HR summary based only on the supplied CV and job information.",
    },

    matchedSkills: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Skills clearly supported by the CV that match the job.",
    },

    missingSkills: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Required job skills not clearly supported by the CV.",
    },

    strengths: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Evidence-based candidate strengths.",
    },

    concerns: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Evidence-based concerns or areas requiring interview verification.",
    },

    interviewQuestions: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Three to fifteen job-relevant interview questions.",
    },

    recommendation: {
      type: "string",
      enum: [
        "HIGHLY_RECOMMENDED",
        "RECOMMENDED",
        "CONSIDER",
        "NOT_RECOMMENDED",
      ],
    },

    recommendedSalaryMin: {
      type: [
        "number",
        "null",
      ],
      description:
        "Recommended minimum monthly salary grounded in job band and company peer pay.",
    },

    recommendedSalaryTarget: {
      type: [
        "number",
        "null",
      ],
      description:
        "Recommended target monthly salary for a fair offer.",
    },

    recommendedSalaryMax: {
      type: [
        "number",
        "null",
      ],
      description:
        "Recommended maximum monthly salary the company should offer, based on peers with similar experience and performance, without exceeding the approved job band when one exists.",
    },

    salaryRecommendationReason: {
      type: [
        "string",
        "null",
      ],
      description:
        "Explain how peer experience, knowledge/performance, and peer salaries informed the maximum salary. Avoid naming employees.",
    },
  },

  required: [
    "aiMatchScore",
    "summary",
    "matchedSkills",
    "missingSkills",
    "strengths",
    "concerns",
    "interviewQuestions",
    "recommendation",
    "recommendedSalaryMin",
    "recommendedSalaryTarget",
    "recommendedSalaryMax",
    "salaryRecommendationReason",
  ],

  additionalProperties: false,
};

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

function roundToTwoDecimals(
  value: number,
): number {
  return (
    Math.round(
      value * 100,
    ) / 100
  );
}

function uniqueStrings(
  values: string[],
): string[] {
  const normalized =
    values
      .map(
        (value) =>
          value.trim(),
      )
      .filter(
        (value) =>
          value.length > 0,
      );

  return Array.from(
    new Set(
      normalized,
    ),
  );
}

function createPrompt(
  input: GeminiCandidateAnalysisInput,
): string {
  const peers = input.companyPeers;

  const peerLines =
    peers.peers.length === 0
      ? "No anonymized peer salary profiles were available for this role/department."
      : peers.peers
          .slice(0, 25)
          .map(
            (peer) =>
              `- ${peer.label}: position=${peer.positionTitle ?? "n/a"}; department=${peer.departmentName ?? "n/a"}; yearsAtCompany=${peer.yearsAtCompany ?? "n/a"}; monthlyCompensation=${peer.monthlyCompensation}; performanceScore=${peer.latestPerformanceScore ?? "n/a"}; strengths=${peer.performanceStrengths ?? "n/a"}`,
          )
          .join("\n");

  return `
You are an AI assistant supporting an authorized HR team.

Analyze the candidate against the supplied job opening AND anonymized company peer compensation data.

IMPORTANT RULES:

1. Use only the information supplied below.
2. Do not invent qualifications, employers, skills, education, achievements, or experience.
3. Do not use age, gender, race, nationality, religion, marital status, disability, photograph, home address, or other protected or irrelevant personal information.
4. Treat the result as an HR recommendation, not an automatic hiring decision.
5. Clearly identify uncertainty as a concern or interview question.
6. The AI match score must be between 0 and 100.
7. Salary recommendations are MONTHLY amounts in the same currency as the peer/job figures.
8. recommendedSalaryMax must be justified by company peers with similar experience and knowledge/performance.
   - Prefer peers closest to the candidate years of experience.
   - Stronger CV match / higher peer performance can support a higher max within the peer range.
   - Weaker match should stay closer to peer median or below.
9. If an approved job salary band is supplied, do not recommend above salaryMax or below salaryMin.
10. If no job salary band is supplied, derive min/target/max from peer compensation statistics.
11. If no peers and no salary band exist, return null for all salary values.
12. The salary order must be: minimum <= target <= maximum.
13. Never include real employee names, emails, or IDs (peers are already anonymized).
14. Return only the structured response required by the schema.

CANDIDATE PROFILE

Name:
${input.candidate.firstName} ${input.candidate.lastName}

Current job title:
${input.candidate.currentJobTitle ?? "Not provided"}

Current company:
${input.candidate.currentCompany ?? "Not provided"}

Years of experience:
${input.candidate.yearsOfExperience}

Candidate skills:
${input.candidate.skills ?? "Not separately provided"}

Candidate education:
${input.candidate.education ?? "Not separately provided"}

EXTRACTED CV TEXT

${input.candidate.extractedText}

JOB OPENING

Job title:
${input.jobOpening.title}

Job description:
${input.jobOpening.description}

Minimum experience:
${input.jobOpening.minimumExperience} years

Required skills:
${input.jobOpening.requiredSkills ?? "Not specified"}

Requirements:
${input.jobOpening.requirements ?? "Not specified"}

Responsibilities:
${input.jobOpening.responsibilities ?? "Not specified"}

Approved salary minimum:
${input.jobOpening.salaryMin ?? "Not provided"}

Approved salary maximum:
${input.jobOpening.salaryMax ?? "Not provided"}

COMPANY PEER COMPENSATION (ANONYMIZED)

Peer sample size:
${peers.sampleSize}

Peer monthly compensation min:
${peers.compensationMin ?? "Not available"}

Peer monthly compensation median:
${peers.compensationMedian ?? "Not available"}

Peer monthly compensation 75th percentile:
${peers.compensationP75 ?? "Not available"}

Peer monthly compensation max:
${peers.compensationMax ?? "Not available"}

Average years at company among peers:
${peers.averageYearsAtCompany ?? "Not available"}

Peer rows:
${peerLines}

LOCAL BACKEND ANALYSIS

Local match score:
${input.localAnalysis.localMatchScore}

Skills score:
${input.localAnalysis.skillsScore}

Experience score:
${input.localAnalysis.experienceScore}

Job title score:
${input.localAnalysis.jobTitleScore}

Education score:
${input.localAnalysis.educationScore}

Completeness score:
${input.localAnalysis.completenessScore}

Locally matched skills:
${JSON.stringify(
  input.localAnalysis.matchedSkills,
)}

Locally missing skills:
${JSON.stringify(
  input.localAnalysis.missingSkills,
)}

Local recommended salary minimum:
${input.localAnalysis.recommendedSalaryMin ?? "Not available"}

Local recommended salary target:
${input.localAnalysis.recommendedSalaryTarget ?? "Not available"}

Local recommended salary maximum:
${input.localAnalysis.recommendedSalaryMax ?? "Not available"}

Local salary calculation reason:
${input.localAnalysis.salaryCalculationReason ?? "Not available"}

Provide a careful and evidence-based analysis with a peer-informed maximum salary.
`;
}

function parseGeminiJson(
  responseText: string,
): unknown {
  const trimmedText =
    responseText.trim();

  if (!trimmedText) {
    throw new Error(
      "Gemini returned an empty response",
    );
  }

  try {
    return JSON.parse(
      trimmedText,
    );
  } catch {
    const cleanedText =
      trimmedText
        .replace(
          /^```json\s*/i,
          "",
        )
        .replace(
          /^```\s*/i,
          "",
        )
        .replace(
          /\s*```$/i,
          "",
        )
        .trim();

    try {
      return JSON.parse(
        cleanedText,
      );
    } catch {
      throw new Error(
        "Gemini returned invalid JSON",
      );
    }
  }
}

function sanitizeSalaryResult(
  result: GeminiCandidateAnalysisResult,
  input: GeminiCandidateAnalysisInput,
): GeminiCandidateAnalysisResult {
  const jobMin =
    input.jobOpening.salaryMin;

  const jobMax =
    input.jobOpening.salaryMax;

  const peers =
    input.companyPeers;

  const peerMin =
    peers.compensationMin;

  const peerMax =
    peers.compensationMax;

  const peerMedian =
    peers.compensationMedian;

  const peerP75 =
    peers.compensationP75;

  const hasJobBand =
    jobMin !== null &&
    jobMax !== null &&
    jobMax >= jobMin;

  const hasPeerBand =
    peerMin !== null &&
    peerMax !== null &&
    peerMax >= peerMin;

  if (!hasJobBand && !hasPeerBand) {
    return {
      ...result,

      recommendedSalaryMin:
        null,

      recommendedSalaryTarget:
        null,

      recommendedSalaryMax:
        null,

      salaryRecommendationReason:
        "No approved job salary band and no peer salary profiles were available.",
    };
  }

  const bandMin =
    hasJobBand
      ? jobMin!
      : peerMin!;

  const bandMax =
    hasJobBand
      ? jobMax!
      : peerMax!;

  const peerInformedMax =
    peerP75 ??
    peerMedian ??
    peerMax ??
    bandMax;

  const fallbackMinimum =
    input.localAnalysis
      .recommendedSalaryMin ??
    bandMin;

  const fallbackTarget =
    input.localAnalysis
      .recommendedSalaryTarget ??
    peerMedian ??
    bandMin;

  const fallbackMaximum =
    input.localAnalysis
      .recommendedSalaryMax ??
    Math.min(
      bandMax,
      peerInformedMax,
    );

  let recommendedMinimum =
    result.recommendedSalaryMin ??
    fallbackMinimum;

  let recommendedTarget =
    result.recommendedSalaryTarget ??
    fallbackTarget;

  let recommendedMaximum =
    result.recommendedSalaryMax ??
    fallbackMaximum;

  recommendedMinimum =
    clamp(
      recommendedMinimum,
      bandMin,
      bandMax,
    );

  recommendedTarget =
    clamp(
      recommendedTarget,
      bandMin,
      bandMax,
    );

  recommendedMaximum =
    clamp(
      recommendedMaximum,
      bandMin,
      bandMax,
    );

  // Keep max from drifting above peer-informed ceiling when peers exist
  // and the job band is wider than current peer pay.
  if (
    hasPeerBand &&
    peerInformedMax !== null
  ) {
    recommendedMaximum =
      Math.min(
        recommendedMaximum,
        Math.max(
          peerInformedMax,
          recommendedTarget,
        ),
      );
  }

  const orderedValues = [
    recommendedMinimum,
    recommendedTarget,
    recommendedMaximum,
  ].sort(
    (
      firstValue,
      secondValue,
    ) =>
      firstValue -
      secondValue,
  );

  const peerNote =
    peers.sampleSize > 0
      ? ` Peer sample=${peers.sampleSize}; peer median=${peers.compensationMedian ?? "n/a"}; peer p75=${peers.compensationP75 ?? "n/a"}; peer max=${peers.compensationMax ?? "n/a"}.`
      : " No peer salary sample was available.";

  return {
    ...result,

    recommendedSalaryMin:
      roundToTwoDecimals(
        orderedValues[0] ??
          bandMin,
      ),

    recommendedSalaryTarget:
      roundToTwoDecimals(
        orderedValues[1] ??
          bandMin,
      ),

    recommendedSalaryMax:
      roundToTwoDecimals(
        orderedValues[2] ??
          bandMax,
      ),

    salaryRecommendationReason:
      `${result.salaryRecommendationReason ??
        input.localAnalysis
          .salaryCalculationReason ??
        "Salary recommendation combined job band and company peer compensation."}${peerNote}`,
  };
}

async function applyWrdnOutputSanitizer(
  result: GeminiCandidateAnalysisResult,
): Promise<GeminiCandidateAnalysisResult> {
  const [
    summary,
    strengths,
    concerns,
    interviewQuestions,
  ] =
    await Promise.all([
      sanitizeNarrativeText(
        result.summary,
      ),
      sanitizeNarrativeList(
        result.strengths,
      ),
      sanitizeNarrativeList(
        result.concerns,
      ),
      sanitizeNarrativeList(
        result.interviewQuestions,
      ),
    ]);

  // Keep structured salary numbers; only lightly gate the reason text
  // without currency digits so WRDN salary regex is less likely to false-block.
  const reasonWithoutCurrency =
    result.salaryRecommendationReason
      ?.replace(
        /(?:Rs\.?|LKR|USD|\$|€|£)\s*[\d,]+(?:\.\d+)?/gi,
        "[amount]",
      )
      .replace(
        /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g,
        "[amount]",
      ) ??
    null;

  const salaryRecommendationReason =
    await sanitizeNarrativeText(
      reasonWithoutCurrency,
      "Salary rationale withheld by output sanitizer. Structured salary fields remain available.",
    );

  return {
    ...result,
    summary:
      summary ??
      "Summary withheld by output sanitizer.",
    strengths:
      strengths.length > 0
        ? strengths
        : [
            "Strength details withheld by output sanitizer.",
          ],
    concerns,
    interviewQuestions:
      interviewQuestions.length >= 3
        ? interviewQuestions
        : result.interviewQuestions,
    salaryRecommendationReason,
  };
}

function sanitizeGeminiResult(
  result: GeminiCandidateAnalysisResult,
  input: GeminiCandidateAnalysisInput,
): GeminiCandidateAnalysisResult {
  const sanitizedResult: GeminiCandidateAnalysisResult =
    {
      ...result,

      aiMatchScore:
        roundToTwoDecimals(
          clamp(
            result.aiMatchScore,
            0,
            100,
          ),
        ),

      matchedSkills:
        uniqueStrings(
          result.matchedSkills,
        ),

      missingSkills:
        uniqueStrings(
          result.missingSkills,
        ),

      strengths:
        uniqueStrings(
          result.strengths,
        ),

      concerns:
        uniqueStrings(
          result.concerns,
        ),

      interviewQuestions:
        uniqueStrings(
          result.interviewQuestions,
        ),
    };

  return sanitizeSalaryResult(
    sanitizedResult,
    input,
  );
}

export async function analyzeCandidateWithGemini(
  input: GeminiCandidateAnalysisInput,
): Promise<GeminiCandidateAnalysisResult> {
  if (
    input.candidate.extractedText
      .trim()
      .length <
    30
  ) {
    throw new Error(
      "The extracted CV text is too short for Gemini analysis",
    );
  }

  const prompt =
    createPrompt(
      input,
    );

  const response =
    await gemini.models.generateContent({
      model:
        geminiModel,

      contents: [
        {
          role: "user",

          parts: [
            {
              text:
                prompt,
            },
          ],
        },
      ],

      config: {
        temperature:
          0.2,

        responseMimeType:
          "application/json",

        responseSchema:
          responseSchema as never,
      },
    });

  const responseText =
    response.text?.trim();

  if (!responseText) {
    throw new Error(
      "Gemini returned an empty analysis",
    );
  }

  const parsedResponse =
    parseGeminiJson(
      responseText,
    );

  const validationResult =
    geminiAnalysisSchema.safeParse(
      parsedResponse,
    );

  if (
    !validationResult.success
  ) {
    const validationMessage =
      validationResult.error.issues
        .map(
          (issue) =>
            `${issue.path.join(".")}: ${issue.message}`,
        )
        .join("; ");

    throw new Error(
      `Gemini analysis validation failed: ${validationMessage}`,
    );
  }

  const structured =
    sanitizeGeminiResult(
      validationResult.data,
      input,
    );

  return applyWrdnOutputSanitizer(
    structured,
  );
}