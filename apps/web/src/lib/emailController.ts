import { supabase } from "./supabase";

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailData) {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html },
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Email controller error:", error);
    throw error;
  }
}
