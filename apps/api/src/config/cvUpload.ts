import "dotenv/config";

import path from "node:path";

function parseMaximumFileSize(): number {
  const configuredValue =
    process.env.CV_MAX_FILE_SIZE_MB;

  if (!configuredValue) {
    return 10;
  }

  const parsedValue =
    Number(configuredValue);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new Error(
      "CV_MAX_FILE_SIZE_MB must be a positive number",
    );
  }

  return parsedValue;
}

export const cvUploadDirectory =
  path.resolve(
    process.cwd(),
    process.env.CV_UPLOAD_DIRECTORY?.trim() ||
      "uploads/cvs",
  );

export const cvMaximumFileSizeMb =
  parseMaximumFileSize();

export const cvMaximumFileSizeBytes =
  cvMaximumFileSizeMb *
  1024 *
  1024;

export const allowedCvMimeTypes =
  new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);