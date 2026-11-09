import { useEffect, useState } from "react";
import { api } from "./api";
import { RSVPQuestion } from "./eventRsvpTypes";
import { prepareImageForUpload } from "./imageProcessing";

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

export const useEventsManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      setEvents(await api<Event[]>("/api/admin/events"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (event: EventFormData): Promise<Event> => {
    const created = await api<Event>("/api/admin/events", { method: "POST", body: event });
    await fetchEvents();
    return created;
  };

  const editEvent = async (id: string, event: EventFormData) => {
    await api(`/api/admin/events/${encodeURIComponent(id)}`, { method: "PUT", body: event });
    await fetchEvents();
  };

  /** Deletes the event, its RSVPs, and its cover image. */
  const removeEvent = async (id: string) => {
    await api(`/api/admin/events/${encodeURIComponent(id)}`, { method: "DELETE" });
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
  const processed = await prepareImageForUpload(file);
  const form = new FormData();
  form.append("file", processed);
  const { url } = await api<{ url: string }>("/api/admin/uploads/event-image", {
    method: "POST",
    form,
  });
  return url;
};
