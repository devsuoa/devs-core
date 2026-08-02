import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { RSVPQuestion } from "./eventRsvpTypes";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  tag: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  register_url: string | null;
  is_active: boolean;
  max_attendees: number | null;
  group_rsvp_enabled: boolean;
  group_rsvp_max_emails: number | null;
  payment_enabled: boolean;
  charge_amount: number | null;
  bank_transfer_enabled: boolean;
  /** Legacy DB columns; always cleared on save — account details are site-wide. */
  bank_account_name: string | null;
  bank_account_number: string | null;
  rsvp_questions: RSVPQuestion[];
}

export interface EventFormData {
  title: string;
  description: string | null;
  image_url: string | null;
  tag: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  register_url: string | null;
  is_active: boolean;
  max_attendees: number | null;
  group_rsvp_enabled: boolean;
  group_rsvp_max_emails: number | null;
  payment_enabled: boolean;
  charge_amount: number | null;
  bank_transfer_enabled: boolean;
  rsvp_questions: RSVPQuestion[];
}

/** Slug for storage path: events/payments/{slug}/... */
export function sanitizeEventTitleForStoragePath(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 80) || "event";
}

/**
 * Safe object key segment derived from email (e.g. `user_at_example.com.png`).
 * `@` and other reserved URL/path characters break Storage API requests if left in keys.
 */
export function sanitizeEmailForFilename(email: string): string {
  const s = email
    .trim()
    .toLowerCase()
    .replace(/@/g, "_at_")
    .replace(/[/\\?#%]/g, "_")
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 180);
  return s || "payer";
}

/** Upload bank payment screenshot to bucket `event-payments` at events/payments/{slug}/{safe-email}.png */
export async function uploadBankPaymentProofScreenshot(
  eventTitle: string,
  file: File,
  payerEmail: string,
): Promise<string> {
  const slug = sanitizeEventTitleForStoragePath(eventTitle);
  const filename = `${sanitizeEmailForFilename(payerEmail)}.png`;
  const path = `events/payments/${slug}/${filename}`;
  const { error } = await supabase.storage.from("event-payments").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/png",
  });
  if (error) throw error;
  return path;
}

export const useEventsManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (event: EventFormData) => {
    const { error } = await supabase.from("events").insert([
      {
        ...event,
        bank_account_name: null,
        bank_account_number: null,
      },
    ]);
    if (error) throw error;
    await fetchEvents();
  };

  const editEvent = async (id: string, event: EventFormData) => {
    const { error } = await supabase
      .from("events")
      .update({
        ...event,
        bank_account_name: null,
        bank_account_number: null,
      })
      .eq("id", id);
    if (error) throw error;
    await fetchEvents();
  };

  const removeEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw error;
    await fetchEvents();
  };

  return {
    events,
    loading,
    error,
    addEvent,
    editEvent,
    removeEvent,
  };
};

export const uploadEventImage = async (file: File): Promise<string> => {
  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("event-images")
    .upload(filename, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("event-images").getPublicUrl(filename);
  return data.publicUrl;
};
