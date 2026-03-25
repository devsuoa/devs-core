import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { RSVPQuestion } from './eventRsvpTypes';

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
  rsvp_questions: RSVPQuestion[];
}

export const useEventsManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

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
    const { error } = await supabase.from('events').insert([event]);
    if (error) throw error;
    await fetchEvents();
  };

  const editEvent = async (id: string, event: EventFormData) => {
    const { error } = await supabase.from('events').update(event).eq('id', id);
    if (error) throw error;
    await fetchEvents();
  };

  const removeEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
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
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('event-images')
    .upload(filename, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('event-images').getPublicUrl(filename);
  return data.publicUrl;
};
