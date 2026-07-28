import {
    readFile,
    unlink,
} from "node:fs/promises";

import path from "node:path";

import mammoth from "mammoth";

import {
    PDFParse,
} from "pdf-parse";

const pdfMimeType =
  "application/pdf";

const docxMimeType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const maximumExtractedCharacters =
  100_000;

const minimumUsefulCharacters =
  30;

export interface ExtractCvTextInput {
  filePath: string;
  mimeType: string;
  originalFileName: string;
}

export interface ExtractCvTextResult {
  text: string;
  characterCount: number;
  wasTruncated: boolean;
}

function normalizeExtractedText(
  value: string,
): string {
  return value
    .replace(
      /\u0000/g,
      "",
    )
    .replace(
      /\r\n/g,
      "\n",
    )
    .replace(
      /\r/g,
      "\n",
    )
    .replace(
      /[ \t]+\n/g,
      "\n",
    )
    .replace(
      /\n[ \t]+/g,
      "\n",
    )
    .replace(
      /[ \t]{2,}/g,
      " ",
    )
    .replace(
      /\n{3,}/g,
      "\n\n",
    )
    .trim();
}

function validateFileExtension(
  fileName: string,
  mimeType: string,
): void {
  const extension =
    path
      .extname(
        fileName,
      )
      .toLowerCase();

  if (
    mimeType ===
      pdfMimeType &&
    extension !==
      ".pdf"
  ) {
    throw new Error(
      "The uploaded PDF has an invalid file extension",
    );
  }

  if (
    mimeType ===
      docxMimeType &&
    extension !==
      ".docx"
  ) {
    throw new Error(
      "The uploaded DOCX has an invalid file extension",
    );
  }
}

async function extractPdfText(
  filePath: string,
): Promise<string> {
  const fileBuffer =
    await readFile(
      filePath,
    );

  const parser =
    new PDFParse({
      data:
        new Uint8Array(
          fileBuffer,
        ),
    });

  try {
    const result =
      await parser.getText();

    return (
      result.text ??
      ""
    );
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(
  filePath: string,
): Promise<string> {
  const result =
    await mammoth.extractRawText({
      path:
        filePath,
    });

  const extractionErrors =
    result.messages.filter(
      (message) =>
        message.type ===
        "error",
    );

  if (
    extractionErrors.length >
    0
  ) {
    throw new Error(
      extractionErrors
        .map(
          (message) =>
            message.message,
        )
        .join("; "),
    );
  }

  return (
    result.value ??
    ""
  );
}

export async function extractCvText(
  input: ExtractCvTextInput,
): Promise<ExtractCvTextResult> {
  validateFileExtension(
    input.originalFileName,
    input.mimeType,
  );

  let extractedText =
    "";

  if (
    input.mimeType ===
    pdfMimeType
  ) {
    extractedText =
      await extractPdfText(
        input.filePath,
      );
  } else if (
    input.mimeType ===
    docxMimeType
  ) {
    extractedText =
      await extractDocxText(
        input.filePath,
      );
  } else {
    throw new Error(
      "Only PDF and DOCX files can be analyzed",
    );
  }

  const normalizedText =
    normalizeExtractedText(
      extractedText,
    );

  if (
    normalizedText.length <
    minimumUsefulCharacters
  ) {
    throw new Error(
      "The CV does not contain enough readable text. Scanned image-only PDFs are not supported yet.",
    );
  }

  const wasTruncated =
    normalizedText.length >
    maximumExtractedCharacters;

  const text =
    wasTruncated
      ? normalizedText.slice(
          0,
          maximumExtractedCharacters,
        )
      : normalizedText;

  return {
    text,
    characterCount:
      normalizedText.length,
    wasTruncated,
  };
}

export async function deleteCvFile(
  filePath:
    | string
    | null
    | undefined,
): Promise<void> {
  if (!filePath) {
    return;
  }

  try {
    await unlink(
      filePath,
    );
  } catch (
    error
  ) {
    const fileError =
      error as NodeJS.ErrnoException;

    if (
      fileError.code !==
      "ENOENT"
    ) {
      throw error;
    }
  }
}