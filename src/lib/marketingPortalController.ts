import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

// Apps Script URL which handles the form submission to Google Sheets
// Google sheets handles email automations, everything else goes to tasks
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbz2__ivp8VWFCQZg5WaB-b3QDmxO5fWavFvmodkk7kstYzmKaCEymmIhzlKXF_ofxM3/exec';

export interface MarketingFormData {
  postType: 'event' | 'sponsorship' | '';
  // Event fields
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventDescription?: string;
  eventSuggestions?: string;
  // Sponsorship fields
  sponsorName?: string;
  sponsorshipEmailDate?: string;
  sponsorshipPostDate?: string;
  sponsorshipEventName?: string;
  sponsorshipLinks?: string;
  sponsorshipDescription?: string;
  // Common fields
  marketingDescription?: string;
  preWrittenCaptions?: string;
}

export interface MarketingFormState {
  postType: 'event' | 'sponsorship' | '';
  showDialog: boolean;
  // Event fields
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventDescription: string;
  eventSuggestions: string;
  // Sponsorship fields
  sponsorName: string;
  sponsorshipEmailDate: string;
  sponsorshipPostDate: string;
  sponsorshipEventName: string;
  sponsorshipLinks: string;
  sponsorshipDescription: string;
  // Common fields
  marketingDescription: string;
  preWrittenCaptions: string;
}

export interface MarketingFormSetters {
  setPostType: (value: 'event' | 'sponsorship' | '') => void;
  setShowDialog: (value: boolean) => void;
  setEventName: (value: string) => void;
  setEventDate: (value: string) => void;
  setEventTime: (value: string) => void;
  setEventLocation: (value: string) => void;
  setEventDescription: (value: string) => void;
  setEventSuggestions: (value: string) => void;
  setSponsorName: (value: string) => void;
  setSponsorshipEmailDate: (value: string) => void;
  setSponsorshipPostDate: (value: string) => void;
  setSponsorshipEventName: (value: string) => void;
  setSponsorshipLinks: (value: string) => void;
  setSponsorshipDescription: (value: string) => void;
  setMarketingDescription: (value: string) => void;
  setPreWrittenCaptions: (value: string) => void;
}

async function submitToGoogle(formData: MarketingFormData): Promise<void> {
  try {
    console.log('Submitting to Google Spreadsheet:', formData);

    // use the Apps Script to handle sheets manipulation
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    console.log('Form submitted to Google Spreadsheet successfully');
  } catch (error) {
    console.error('Error submitting to Google Spreadsheet:', error);
    throw error;
  }
}

async function submitToSupabase(formData: MarketingFormData): Promise<void> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    if (!formData.postType) {
      throw new Error('postType is required');
    }

    const { error } = await supabase.from('marketing_requests').insert({
      post_type: formData.postType,

      // Event fields
      event_name: formData.eventName ?? null,
      event_date: formData.eventDate ? formData.eventDate : null,
      event_time: formData.eventTime ?? null,
      event_location: formData.eventLocation ?? null,
      event_description: formData.eventDescription ?? null,
      event_suggestions: formData.eventSuggestions ?? null,

      // Sponsorship fields
      sponsor_name: formData.sponsorName ?? null,
      sponsorship_email_date: formData.sponsorshipEmailDate
        ? formData.sponsorshipEmailDate
        : null,
      sponsorship_post_date: formData.sponsorshipPostDate
        ? formData.sponsorshipPostDate
        : null,
      sponsorship_event_name: formData.sponsorshipEventName ?? null,
      sponsorship_links: formData.sponsorshipLinks ?? null,
      sponsorship_description: formData.sponsorshipDescription ?? null,

      // Common fields
      marketing_description: formData.marketingDescription ?? null,
      pre_written_captions: formData.preWrittenCaptions ?? null,

      // Metadata
      created_by: user.id,
    });

    if (error) throw error;

    console.log('Form submitted to Supabase successfully');

    const functionResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-marketing-task`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${
            (await supabase.auth.getSession()).data.session?.access_token
          }`,
        },
        body: JSON.stringify(formData),
      }
    );

    if (!functionResponse.ok) {
        const errorText = await functionResponse.text();
        throw new Error(`Failed to create task: ${errorText}`);
      }

  } catch (error) {
    console.error('Error submitting to Supabase:', error);
    throw error;
  }  
}

export async function handleMarketingSubmit(
  e: React.FormEvent,
  state: MarketingFormState,
  setters: MarketingFormSetters
) {
  e.preventDefault();

  const formData: MarketingFormData = {
    postType: state.postType,
    ...(state.postType === 'event' && {
      eventName: state.eventName,
      eventDate: state.eventDate,
      eventTime: state.eventTime,
      eventLocation: state.eventLocation,
      eventDescription: state.eventDescription,
      eventSuggestions: state.eventSuggestions,
    }),
    ...(state.postType === 'sponsorship' && {
      sponsorName: state.sponsorName,
      sponsorshipEmailDate: state.sponsorshipEmailDate,
      sponsorshipPostDate: state.sponsorshipPostDate,
      sponsorshipEventName: state.sponsorshipEventName,
      sponsorshipLinks: state.sponsorshipLinks,
      sponsorshipDescription: state.sponsorshipDescription,
    }),
    marketingDescription: state.marketingDescription,
    preWrittenCaptions: state.preWrittenCaptions,
  };

  console.log('Marketing Request Data:', formData);

  try {
    // Submit to both supabase and google sheets
    await Promise.all([submitToGoogle(formData), submitToSupabase(formData)]);

    // Show dialog and reset form on submit
    setters.setShowDialog(true);
    setters.setPostType('');
    setters.setEventName('');
    setters.setEventDate('');
    setters.setEventTime('');
    setters.setEventLocation('');
    setters.setEventDescription('');
    setters.setEventSuggestions('');
    setters.setSponsorName('');
    setters.setSponsorshipEmailDate('');
    setters.setSponsorshipPostDate('');
    setters.setSponsorshipEventName('');
    setters.setSponsorshipLinks('');
    setters.setSponsorshipDescription('');
    setters.setMarketingDescription('');
    setters.setPreWrittenCaptions('');
  } catch (error: any) {
    console.error('Failed to submit form:', error);

    // If user somehow reaches page without admin role
    if (error?.code === '42501') {
      alert('You do not have permission to submit marketing requests.');
      return;
    }

    alert('Failed to submit form. Please try again.');
  }
}

export function closeMarketingDialog(setShowDialog: (value: boolean) => void) {
  setShowDialog(false);
}

export function useMarketingPortal() {
  const [postType, setPostType] = useState<'event' | 'sponsorship' | ''>('');
  const [showDialog, setShowDialog] = useState(false);

  // Event fields
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventSuggestions, setEventSuggestions] = useState('');

  // Sponsorship fields
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorshipEmailDate, setSponsorshipEmailDate] = useState('');
  const [sponsorshipPostDate, setSponsorshipPostDate] = useState('');
  const [sponsorshipEventName, setSponsorshipEventName] = useState('');
  const [sponsorshipLinks, setSponsorshipLinks] = useState('');
  const [sponsorshipDescription, setSponsorshipDescription] = useState('');

  // Common fields
  const [marketingDescription, setMarketingDescription] = useState('');
  const [preWrittenCaptions, setPreWrittenCaptions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    handleMarketingSubmit(
      e,
      {
        postType,
        eventName,
        eventDate,
        eventTime,
        eventLocation,
        eventDescription,
        eventSuggestions,
        sponsorName,
        sponsorshipEmailDate,
        sponsorshipPostDate,
        sponsorshipEventName,
        sponsorshipLinks,
        sponsorshipDescription,
        marketingDescription,
        preWrittenCaptions,
        showDialog,
      },
      {
        setPostType,
        setShowDialog,
        setEventName,
        setEventDate,
        setEventTime,
        setEventLocation,
        setEventDescription,
        setEventSuggestions,
        setSponsorName,
        setSponsorshipEmailDate,
        setSponsorshipPostDate,
        setSponsorshipEventName,
        setSponsorshipLinks,
        setSponsorshipDescription,
        setMarketingDescription,
        setPreWrittenCaptions,
      }
    );
  };

  const closeDialog = () => {
    closeMarketingDialog(setShowDialog);
  };

  useEffect(() => {
    if (showDialog) {
      const timer = setTimeout(() => {
        setShowDialog(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showDialog]);

  return {
    postType,
    showDialog,
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    eventDescription,
    eventSuggestions,
    sponsorName,
    sponsorshipEmailDate,
    sponsorshipPostDate,
    sponsorshipEventName,
    sponsorshipLinks,
    sponsorshipDescription,
    marketingDescription,
    preWrittenCaptions,
    setPostType,
    setEventName,
    setEventDate,
    setEventTime,
    setEventLocation,
    setEventDescription,
    setEventSuggestions,
    setSponsorName,
    setSponsorshipEmailDate,
    setSponsorshipPostDate,
    setSponsorshipEventName,
    setSponsorshipLinks,
    setSponsorshipDescription,
    setMarketingDescription,
    setPreWrittenCaptions,
    handleSubmit,
    closeDialog,
  };
}
