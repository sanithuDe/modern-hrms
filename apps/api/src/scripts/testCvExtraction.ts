import path from "node:path";

import {
  extractCvText,
} from "../modules/cv-portal/cv-extractor.service.js";

async function testCvExtraction(): Promise<void> {
  const fileName =
    process.argv[2];

  if (!fileName) {
    throw new Error(
      "Provide a PDF or DOCX file path",
    );
  }

  const absolutePath =
    path.resolve(
      process.cwd(),
      fileName,
    );

  const extension =
    path
      .extname(
        absolutePath,
      )
      .toLowerCase();

  const mimeType =
    extension ===
    ".pdf"
      ? "application/pdf"
      : extension ===
          ".docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "";

  if (!mimeType) {
    throw new Error(
      "Only PDF and DOCX files are supported",
    );
  }

  const result =
    await extractCvText({
      filePath:
        absolutePath,

      originalFileName:
        path.basename(
          absolutePath,
        ),

      mimeType,
    });

  console.log(
    "Character count:",
    result.characterCount,
  );

  console.log(
    "Truncated:",
    result.wasTruncated,
  );

  console.log(
    "\nExtracted preview:\n",
  );

  console.log(
    result.text.slice(
      0,
      1000,
    ),
  );
}

testCvExtraction().catch(
  (
    error:
      unknown,
  ) => {
    console.error(
      "CV extraction failed:",
      error,
    );

    process.exitCode = 1;
  },
);