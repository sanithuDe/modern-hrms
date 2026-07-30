import { api } from "../lib/api";

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    emailSent: boolean;
  };
}

export async function submitContactMessage(
  input: ContactMessageInput,
) {
  const response = await api.post<ContactResponse>(
    "/contact",
    input,
  );

  return response.data;
}
