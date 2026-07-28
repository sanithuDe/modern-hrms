import {
  randomUUID,
} from "node:crypto";

import {
  mkdir,
} from "node:fs/promises";

import path from "node:path";

import type {
  NextFunction,
  Request,
  Response,
} from "express";

import multer, {
  MulterError,
} from "multer";

import {
  allowedCvMimeTypes,
  cvMaximumFileSizeBytes,
  cvMaximumFileSizeMb,
  cvUploadDirectory,
} from "../../config/cvUpload.js";

const pdfMimeType =
  "application/pdf";

const docxMimeType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function getExtensionFromMimeType(
  mimeType: string,
): string {
  if (
    mimeType ===
    pdfMimeType
  ) {
    return ".pdf";
  }

  if (
    mimeType ===
    docxMimeType
  ) {
    return ".docx";
  }

  throw new Error(
    "Unsupported CV file type",
  );
}

function sanitizeBaseName(
  originalName: string,
): string {
  const extension =
    path.extname(
      originalName,
    );

  const nameWithoutExtension =
    path.basename(
      originalName,
      extension,
    );

  const sanitized =
    nameWithoutExtension
      .normalize("NFKD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-zA-Z0-9-_]+/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^[-_]+|[-_]+$/g,
        "",
      )
      .slice(
        0,
        80,
      );

  return (
    sanitized ||
    "candidate-cv"
  );
}

async function ensureUploadDirectory(): Promise<void> {
  await mkdir(
    cvUploadDirectory,
    {
      recursive: true,
    },
  );
}

const storage =
  multer.diskStorage({
    destination(
      _request,
      _file,
      callback,
    ) {
      void ensureUploadDirectory()
        .then(() => {
          callback(
            null,
            cvUploadDirectory,
          );
        })
        .catch(
          (
            error:
              unknown,
          ) => {
            callback(
              error instanceof Error
                ? error
                : new Error(
                    "Unable to create CV upload directory",
                  ),
              cvUploadDirectory,
            );
          },
        );
    },

    filename(
      _request,
      file,
      callback,
    ) {
      try {
        const extension =
          getExtensionFromMimeType(
            file.mimetype,
          );

        const safeBaseName =
          sanitizeBaseName(
            file.originalname,
          );

        const uniqueName =
          `${Date.now()}-${randomUUID()}-${safeBaseName}${extension}`;

        callback(
          null,
          uniqueName,
        );
      } catch (
        error
      ) {
        callback(
          error instanceof Error
            ? error
            : new Error(
                "Unable to generate CV filename",
              ),
          "",
        );
      }
    },
  });

function cvFileFilter(
  _request: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void {
  const extension =
    path
      .extname(
        file.originalname,
      )
      .toLowerCase();

  const validPdf =
    file.mimetype ===
      pdfMimeType &&
    extension ===
      ".pdf";

  const validDocx =
    file.mimetype ===
      docxMimeType &&
    extension ===
      ".docx";

  if (
    !allowedCvMimeTypes.has(
      file.mimetype,
    ) ||
    (
      !validPdf &&
      !validDocx
    )
  ) {
    callback(
      new Error(
        "Only PDF and DOCX CV files are allowed",
      ),
    );

    return;
  }

  callback(
    null,
    true,
  );
}

const cvUploader =
  multer({
    storage,

    fileFilter:
      cvFileFilter,

    limits: {
      fileSize:
        cvMaximumFileSizeBytes,

      files: 1,

      fields: 20,

      parts: 25,
    },
  });

export const uploadSingleCv =
  cvUploader.single(
    "cv",
  );

export function handleCvUpload(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  uploadSingleCv(
    request,
    response,
    (
      error:
        unknown,
    ) => {
      if (!error) {
        next();
        return;
      }

      if (
        error instanceof
        MulterError
      ) {
        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {
          response
            .status(413)
            .json({
              success: false,

              message:
                `CV file cannot exceed ${cvMaximumFileSizeMb} MB`,
            });

          return;
        }

        if (
          error.code ===
          "LIMIT_UNEXPECTED_FILE"
        ) {
          response
            .status(400)
            .json({
              success: false,

              message:
                'Upload exactly one CV using the field name "cv"',
            });

          return;
        }

        response
          .status(400)
          .json({
            success: false,

            message:
              error.message,
          });

        return;
      }

      response
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "CV upload failed",
        });
    },
  );
}