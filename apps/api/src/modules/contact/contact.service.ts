import type { ContactMessageInput } from "./contact.schema.js";

async function trySendContactEmail(
  input: ContactMessageInput,
): Promise<boolean> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim();
  const to =
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.SUPER_ADMIN_EMAIL?.trim() ||
    from;

  if (!host || !user || !pass || !from || !to) {
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
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      replyTo: input.email,
      subject: `[WRDN Contact] ${input.subject}`,
      text: [
        `New contact message from WRDN HR System`,
        "",
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Subject: ${input.subject}`,
        "",
        input.message,
      ].join("\n"),
    });

    return true;
  } catch (error) {
    console.error("Failed to send contact email:", error);
    return false;
  }
}

export async function submitContactMessage(
  input: ContactMessageInput,
) {
  const emailSent = await trySendContactEmail(input);

  console.info(
    `[contact] ${input.name} <${input.email}> — ${input.subject}`,
  );
  console.info(input.message);

  return {
    message:
      "Thank you. Your message has been received. Our team will get back to you soon.",
    emailSent,
  };
}
