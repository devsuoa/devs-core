import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { RSVPQuestion } from "./eventRsvpTypes";

export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  tag: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  register_url: string | null;
  max_attendees: number | null;
  group_rsvp_enabled: boolean;
  group_rsvp_max_emails: number | null;
  payment_enabled: boolean;
  charge_amount: number | null;
  bank_transfer_enabled: boolean;
  rsvp_questions: RSVPQuestion[];
  is_active: boolean;
}

export const formatEventDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  const day = date.getUTCDate();

  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  const weekday = date.toLocaleDateString("en-NZ", {
    weekday: "long",
    timeZone: "UTC",
  });
  const month = date.toLocaleDateString("en-NZ", {
    month: "long",
    timeZone: "UTC",
  });

  return `${weekday} ${day}${suffix} ${month}`;
};

export const useEvents = () => {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("events")
        .select(
          `
          id,
          title,
          description,
          image_url,
          tag,
          event_date,
          event_time,
          location,
          register_url,
          max_attendees,
          group_rsvp_enabled,
          group_rsvp_max_emails,
          payment_enabled,
          charge_amount,
          bank_transfer_enabled,
          rsvp_questions,
          is_active
        `,
        )
        .order("event_date", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        const normalized = (data || []).map((event) => ({
          ...event,
          rsvp_questions: Array.isArray(event.rsvp_questions)
            ? event.rsvp_questions
            : [],
        }));
        setEvents(normalized);
      }

      setLoading(false);
    };

    fetchEvents();
  }, []);

  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date);
    eventDate.setUTCHours(0, 0, 0, 0);
    return eventDate >= todayUTC && event.is_active;
  });
  const pastEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date);
    eventDate.setUTCHours(0, 0, 0, 0);
    return eventDate < todayUTC;
  });

  return {
    upcomingEvents,
    pastEvents,
    loading,
    error,
    formatEventDate,
  };
};
