import { api } from "./api";

export interface ContactMessage {
  kind: "contact" | "sponsor";
  name: string;
  email: string;
  message: string;
}

/**
 * Sends the contact or sponsorship form to the society inbox. The API chooses the
 * recipient and builds the email; the browser only supplies what the visitor typed.
 */
export async function sendContactMessage(message: ContactMessage): Promise<void> {
  try {
    await api("/api/contact", { method: "POST", body: message });
  } catch (error) {
    console.error("Email controller error:", error);
    throw error;
  }
}
