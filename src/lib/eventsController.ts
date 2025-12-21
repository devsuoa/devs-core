import { useEffect, useState } from "react";
import { supabase } from "./supabase";

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
}

export const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    const day = date.getUTCDate();
  
    const suffix =
      day % 10 === 1 && day !== 11 ? "st" :
      day % 10 === 2 && day !== 12 ? "nd" :
      day % 10 === 3 && day !== 13 ? "rd" : "th";
  
    const weekday = date.toLocaleDateString("en-NZ", { weekday: "long", timeZone: "UTC" });
    const month = date.toLocaleDateString("en-NZ", { month: "long", timeZone: "UTC" });
  
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
          register_url
        `
        )
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setEvents(data || []);
      }

      setLoading(false);
    };

    fetchEvents();
  }, []);

  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const upcomingEvents = events.filter(
    (event) => {
      const eventDate = new Date(event.event_date);
      eventDate.setUTCHours(0, 0, 0, 0);
      return eventDate >= todayUTC;
    }
  );
  const pastEvents = events.filter(
    (event) => {
      const eventDate = new Date(event.event_date);
      eventDate.setUTCHours(0, 0, 0, 0);
      return eventDate < todayUTC;
    }
  );

  return {
    upcomingEvents,
    pastEvents,
    loading,
    error,
    formatEventDate,
  };
};
