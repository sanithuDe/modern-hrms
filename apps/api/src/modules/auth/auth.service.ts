import crypto from "crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../../lib/prisma.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from "./auth.schema.js";

interface AccessTokenPayload {
  userId: string;
  role: string;
}

const RESET_TOKEN_HOURS = 1;

function hashResetToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function buildFrontendResetLink(token: string): string {
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

async function trySendResetEmail(
  email: string,
  resetLink: string,
): Promise<boolean> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim();

  if (!host || !user || !pass || !from) {
    return false;
  }

  try {
    const nodemailer = await import("nodemailer");
    const port = Number(process.env.SMTP_PORT || 587);
    const secure =
      process.env.SMTP_SECURE === "true" || port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: "WRDN HR System — Reset your password",
      text: [
        "You requested a password reset for WRDN HR System.",
        "",
        `Open this link to set a new password (valid for ${RESET_TOKEN_HOURS} hour):`,
        resetLink,
        "",
        "If you did not request this, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f1c1e">
          <h2>Reset your WRDN HR System password</h2>
          <p>You requested a password reset. This link expires in ${RESET_TOKEN_HOURS} hour.</p>
          <p><a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#0c4a4e;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Reset password</a></p>
          <p style="font-size:12px;color:#5b6b6e">If the button does not work, copy this link:<br/>${resetLink}</p>
          <p style="font-size:12px;color:#5b6b6e">If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email.toLowerCase(),
    },
    include: {
      employee: true,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Your account is not active");
  }

  if (!user.passwordHash) {
    throw new Error(
      "This user does not have a password configured",
    );
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const jwtSecret = process.env.JWT_ACCESS_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  const tokenPayload: AccessTokenPayload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = jwt.sign(tokenPayload, jwtSecret, {
    expiresIn: "15m",
  });

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      employee: user.employee,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      employee: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
) {
  const email = input.email.trim().toLowerCase();

  const genericMessage =
    "If an account exists for that email, password reset instructions have been sent.";

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      status: true,
      passwordHash: true,
    },
  });

  if (!user || user.status !== "ACTIVE" || !user.passwordHash) {
    return {
      message: genericMessage,
      emailSent: false,
    };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  const resetLink = buildFrontendResetLink(rawToken);
  const emailSent = await trySendResetEmail(user.email, resetLink);

  if (!emailSent) {
    console.info(
      `[password-reset] Email not configured or send failed. Reset link for ${user.email}: ${resetLink}`,
    );
  }

  return {
    message: genericMessage,
    emailSent,
    // Returned when SMTP is not configured so local/demo testing still works
    ...(emailSent
      ? {}
      : {
          resetLink,
          expiresInHours: RESET_TOKEN_HOURS,
        }),
  };
}

export async function resetPasswordWithToken(
  input: ResetPasswordInput,
) {
  const tokenHash = hashResetToken(input.token.trim());

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: {
        gt: new Date(),
      },
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error(
      "This reset link is invalid or has expired. Please request a new one.",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  return {
    message: "Password updated successfully. You can now sign in.",
  };
}
