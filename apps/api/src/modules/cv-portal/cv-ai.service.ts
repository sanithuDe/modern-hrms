import {
  gemini,
  geminiModel,
} from "../../config/gemini.js";

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
        "Recommended minimum salary inside the supplied approved salary band.",
    },

    recommendedSalaryTarget: {
      type: [
        "number",
        "null",
      ],
      description:
        "Recommended target salary inside the supplied approved salary band.",
    },

    recommendedSalaryMax: {
      type: [
        "number",
        "null",
      ],
      description:
        "Recommended maximum salary inside the supplied approved salary band.",
    },

    salaryRecommendationReason: {
      type: [
        "string",
        "null",
      ],
      description:
        "Reason for the salary recommendation based only on job-related evidence.",
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
  return `
You are an AI assistant supporting an authorized HR team.

Analyze the candidate only against the supplied job opening.

IMPORTANT RULES:

1. Use only the information supplied below.
2. Do not invent qualifications, employers, skills, education, achievements, or experience.
3. Do not use age, gender, race, nationality, religion, marital status, disability, photograph, home address, or other protected or irrelevant personal information.
4. Treat the result as an HR recommendation, not an automatic hiring decision.
5. Clearly identify uncertainty as a concern or interview question.
6. The AI match score must be between 0 and 100.
7. Salary recommendations must remain inside the approved salary range.
8. If no complete salary range is supplied, return null for all salary values.
9. The salary order must be:
   minimum <= target <= maximum.
10. Return only the structured response required by the schema.

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

Provide a careful and evidence-based analysis.
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
  const salaryMinimum =
    input.jobOpening.salaryMin;

  const salaryMaximum =
    input.jobOpening.salaryMax;

  if (
    salaryMinimum === null ||
    salaryMaximum === null ||
    salaryMaximum <
      salaryMinimum
  ) {
    return {
      ...result,

      recommendedSalaryMin:
        null,

      recommendedSalaryTarget:
        null,

      recommendedSalaryMax:
        null,

      salaryRecommendationReason:
        "A complete approved salary range was not provided for this job opening.",
    };
  }

  const fallbackMinimum =
    input.localAnalysis
      .recommendedSalaryMin ??
    salaryMinimum;

  const fallbackTarget =
    input.localAnalysis
      .recommendedSalaryTarget ??
    salaryMinimum;

  const fallbackMaximum =
    input.localAnalysis
      .recommendedSalaryMax ??
    salaryMaximum;

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
      salaryMinimum,
      salaryMaximum,
    );

  recommendedTarget =
    clamp(
      recommendedTarget,
      salaryMinimum,
      salaryMaximum,
    );

  recommendedMaximum =
    clamp(
      recommendedMaximum,
      salaryMinimum,
      salaryMaximum,
    );

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

  return {
    ...result,

    recommendedSalaryMin:
      roundToTwoDecimals(
        orderedValues[0] ??
          salaryMinimum,
      ),

    recommendedSalaryTarget:
      roundToTwoDecimals(
        orderedValues[1] ??
          salaryMinimum,
      ),

    recommendedSalaryMax:
      roundToTwoDecimals(
        orderedValues[2] ??
          salaryMaximum,
      ),

    salaryRecommendationReason:
      result.salaryRecommendationReason ??
      input.localAnalysis
        .salaryCalculationReason ??
      "Salary recommendation was constrained to the approved job salary range.",
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

  return sanitizeGeminiResult(
    validationResult.data,
    input,
  );
}