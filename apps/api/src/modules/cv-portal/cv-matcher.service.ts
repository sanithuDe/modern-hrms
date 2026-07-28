export interface CandidateMatchingInput {
  candidate: {
    currentJobTitle:
      | string
      | null;

    yearsOfExperience:
      | number
      | string;

    skills:
      | string
      | null;

    education:
      | string
      | null;

    extractedText:
      | string
      | null;
  };

  jobOpening: {
    title: string;

    description:
      | string
      | null;

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
      | string
      | null;

    salaryMax:
      | number
      | string
      | null;
  };
}

export interface LocalMatchingResult {
  skillsScore: number;
  experienceScore: number;
  jobTitleScore: number;
  educationScore: number;
  completenessScore: number;

  localMatchScore: number;

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
}

const skillWeight = 45;
const experienceWeight = 25;
const jobTitleWeight = 10;
const educationWeight = 10;
const completenessWeight = 10;

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
  return Math.round(
    value * 100,
  ) / 100;
}

function normalizeText(
  value:
    | string
    | null
    | undefined,
): string {
  return (
    value ?? ""
  )
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-z0-9+#.\s-]/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function normalizeSkill(
  value: string,
): string {
  return normalizeText(
    value,
  )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function splitSkills(
  value:
    | string
    | null
    | undefined,
): string[] {
  if (!value) {
    return [];
  }

  const skills =
    value
      .split(
        /[,;|\n•]+/,
      )
      .map(
        normalizeSkill,
      )
      .filter(
        (
          skill,
        ) =>
          skill.length > 0,
      );

  return Array.from(
    new Set(
      skills,
    ),
  );
}

function extractRequiredSkills(
  requiredSkills:
    | string
    | null,
): string[] {
  return splitSkills(
    requiredSkills,
  );
}

function createCandidateSearchText(
  input: CandidateMatchingInput,
): string {
  return normalizeText(
    [
      input.candidate.skills,
      input.candidate.currentJobTitle,
      input.candidate.education,
      input.candidate.extractedText,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function skillExistsInText(
  skill: string,
  candidateText: string,
): boolean {
  const normalizedSkill =
    normalizeSkill(
      skill,
    );

  if (!normalizedSkill) {
    return false;
  }

  if (
    candidateText.includes(
      normalizedSkill,
    )
  ) {
    return true;
  }

  const skillWords =
    normalizedSkill.split(
      " ",
    );

  if (
    skillWords.length === 1
  ) {
    return candidateText
      .split(" ")
      .includes(
        normalizedSkill,
      );
  }

  return skillWords.every(
    (word) =>
      candidateText.includes(
        word,
      ),
  );
}

function calculateSkillsResult(
  input: CandidateMatchingInput,
): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const requiredSkills =
    extractRequiredSkills(
      input.jobOpening.requiredSkills,
    );

  if (
    requiredSkills.length === 0
  ) {
    return {
      score:
        skillWeight * 0.5,

      matchedSkills: [],

      missingSkills: [],
    };
  }

  const candidateText =
    createCandidateSearchText(
      input,
    );

  const matchedSkills: string[] =
    [];

  const missingSkills: string[] =
    [];

  for (
    const skill of requiredSkills
  ) {
    if (
      skillExistsInText(
        skill,
        candidateText,
      )
    ) {
      matchedSkills.push(
        skill,
      );
    } else {
      missingSkills.push(
        skill,
      );
    }
  }

  const matchRatio =
    matchedSkills.length /
    requiredSkills.length;

  return {
    score:
      roundToTwoDecimals(
        matchRatio *
          skillWeight,
      ),

    matchedSkills,

    missingSkills,
  };
}

function calculateExperienceScore(
  candidateExperience: number,
  minimumExperience: number,
): number {
  if (
    minimumExperience <= 0
  ) {
    return candidateExperience > 0
      ? experienceWeight
      : experienceWeight * 0.7;
  }

  if (
    candidateExperience >=
    minimumExperience
  ) {
    const additionalExperience =
      candidateExperience -
      minimumExperience;

    const bonusRatio =
      clamp(
        additionalExperience /
          Math.max(
            minimumExperience,
            1,
          ),
        0,
        0.2,
      );

    return roundToTwoDecimals(
      clamp(
        experienceWeight *
          (1 + bonusRatio),
        0,
        experienceWeight,
      ),
    );
  }

  const experienceRatio =
    candidateExperience /
    minimumExperience;

  return roundToTwoDecimals(
    clamp(
      experienceRatio *
        experienceWeight,
      0,
      experienceWeight,
    ),
  );
}

function tokenizeTitle(
  value:
    | string
    | null
    | undefined,
): string[] {
  const ignoredWords =
    new Set([
      "and",
      "the",
      "of",
      "for",
      "to",
      "a",
      "an",
      "senior",
      "junior",
      "lead",
      "associate",
      "intern",
    ]);

  return normalizeText(
    value,
  )
    .split(" ")
    .filter(
      (word) =>
        word.length > 1 &&
        !ignoredWords.has(
          word,
        ),
    );
}

function calculateJobTitleScore(
  candidateTitle:
    | string
    | null,
  jobTitle: string,
  extractedText:
    | string
    | null,
): number {
  const jobWords =
    tokenizeTitle(
      jobTitle,
    );

  if (
    jobWords.length === 0
  ) {
    return 0;
  }

  const candidateWords =
    new Set(
      tokenizeTitle(
        [
          candidateTitle,
          extractedText,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    );

  const matchedWordCount =
    jobWords.filter(
      (word) =>
        candidateWords.has(
          word,
        ),
    ).length;

  const ratio =
    matchedWordCount /
    jobWords.length;

  return roundToTwoDecimals(
    ratio *
      jobTitleWeight,
  );
}

function calculateEducationScore(
  education:
    | string
    | null,
  extractedText:
    | string
    | null,
  requirements:
    | string
    | null,
): number {
  const candidateEducation =
    normalizeText(
      [
        education,
        extractedText,
      ]
        .filter(Boolean)
        .join(" "),
    );

  if (!candidateEducation) {
    return 0;
  }

  const educationTerms = [
    "degree",
    "bachelor",
    "bachelors",
    "master",
    "masters",
    "diploma",
    "certificate",
    "certification",
    "university",
    "college",
    "phd",
    "doctorate",
    "bsc",
    "msc",
    "hnd",
  ];

  const containsEducation =
    educationTerms.some(
      (term) =>
        candidateEducation.includes(
          term,
        ),
    );

  if (!containsEducation) {
    return educationWeight * 0.4;
  }

  const normalizedRequirements =
    normalizeText(
      requirements,
    );

  if (!normalizedRequirements) {
    return educationWeight;
  }

  const requiredEducationTerms =
    educationTerms.filter(
      (term) =>
        normalizedRequirements.includes(
          term,
        ),
    );

  if (
    requiredEducationTerms.length ===
    0
  ) {
    return educationWeight;
  }

  const matchedRequirement =
    requiredEducationTerms.some(
      (term) =>
        candidateEducation.includes(
          term,
        ),
    );

  return matchedRequirement
    ? educationWeight
    : educationWeight * 0.5;
}

function calculateCompletenessScore(
  input: CandidateMatchingInput,
): number {
  const fields = [
    input.candidate.currentJobTitle,
    Number(
      input.candidate
        .yearsOfExperience,
    ) > 0
      ? String(
          input.candidate
            .yearsOfExperience,
        )
      : null,
    input.candidate.skills,
    input.candidate.education,
    input.candidate.extractedText,
  ];

  const completedFields =
    fields.filter(
      (value) =>
        typeof value ===
          "string" &&
        value.trim().length > 0,
    ).length;

  const ratio =
    completedFields /
    fields.length;

  return roundToTwoDecimals(
    ratio *
      completenessWeight,
  );
}

function parseMoney(
  value:
    | number
    | string
    | null,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}

function roundMoney(
  value: number,
): number {
  return Math.round(
    value * 100,
  ) / 100;
}

function calculateSalaryRecommendation(
  salaryMin:
    | number
    | string
    | null,
  salaryMax:
    | number
    | string
    | null,
  localMatchScore: number,
  candidateExperience: number,
  minimumExperience: number,
): {
  minimum: number | null;
  target: number | null;
  maximum: number | null;
  reason: string | null;
} {
  const bandMinimum =
    parseMoney(
      salaryMin,
    );

  const bandMaximum =
    parseMoney(
      salaryMax,
    );

  if (
    bandMinimum === null ||
    bandMaximum === null ||
    bandMaximum <
      bandMinimum
  ) {
    return {
      minimum: null,
      target: null,
      maximum: null,
      reason:
        "The job opening does not have a complete approved salary range.",
    };
  }

  const salaryRange =
    bandMaximum -
    bandMinimum;

  const scoreRatio =
    clamp(
      localMatchScore / 100,
      0,
      1,
    );

  const experienceBonus =
    candidateExperience >
    minimumExperience
      ? clamp(
          (
            candidateExperience -
            minimumExperience
          ) /
            Math.max(
              minimumExperience,
              1,
            ),
          0,
          0.15,
        )
      : 0;

  const positionRatio =
    clamp(
      0.2 +
        scoreRatio * 0.65 +
        experienceBonus,
      0.1,
      0.95,
    );

  const target =
    bandMinimum +
    salaryRange *
      positionRatio;

  const negotiationWidth =
    salaryRange * 0.1;

  const recommendedMinimum =
    clamp(
      target -
        negotiationWidth,
      bandMinimum,
      bandMaximum,
    );

  const recommendedMaximum =
    clamp(
      target +
        negotiationWidth,
      bandMinimum,
      bandMaximum,
    );

  return {
    minimum:
      roundMoney(
        recommendedMinimum,
      ),

    target:
      roundMoney(
        clamp(
          target,
          bandMinimum,
          bandMaximum,
        ),
      ),

    maximum:
      roundMoney(
        recommendedMaximum,
      ),

    reason:
      `The recommendation is based on a ${roundToTwoDecimals(
        localMatchScore,
      )}% local match score, ${candidateExperience} years of candidate experience, and the approved salary band.`,
  };
}

export function calculateLocalCandidateMatch(
  input: CandidateMatchingInput,
): LocalMatchingResult {
  const candidateExperience =
    Math.max(
      Number(
        input.candidate
          .yearsOfExperience,
      ) || 0,
      0,
    );

  const skillsResult =
    calculateSkillsResult(
      input,
    );

  const experienceScore =
    calculateExperienceScore(
      candidateExperience,
      input.jobOpening
        .minimumExperience,
    );

  const jobTitleScore =
    calculateJobTitleScore(
      input.candidate
        .currentJobTitle,
      input.jobOpening.title,
      input.candidate
        .extractedText,
    );

  const educationScore =
    calculateEducationScore(
      input.candidate.education,
      input.candidate
        .extractedText,
      input.jobOpening
        .requirements,
    );

  const completenessScore =
    calculateCompletenessScore(
      input,
    );

  const localMatchScore =
    roundToTwoDecimals(
      clamp(
        skillsResult.score +
          experienceScore +
          jobTitleScore +
          educationScore +
          completenessScore,
        0,
        100,
      ),
    );

  const salary =
    calculateSalaryRecommendation(
      input.jobOpening
        .salaryMin,
      input.jobOpening
        .salaryMax,
      localMatchScore,
      candidateExperience,
      input.jobOpening
        .minimumExperience,
    );

  return {
    skillsScore:
      skillsResult.score,

    experienceScore,

    jobTitleScore,

    educationScore,

    completenessScore,

    localMatchScore,

    matchedSkills:
      skillsResult
        .matchedSkills,

    missingSkills:
      skillsResult
        .missingSkills,

    recommendedSalaryMin:
      salary.minimum,

    recommendedSalaryTarget:
      salary.target,

    recommendedSalaryMax:
      salary.maximum,

    salaryCalculationReason:
      salary.reason,
  };
}