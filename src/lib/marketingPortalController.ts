import React, { useState, useEffect } from 'react';

// Apps Script URL which handles the form submission to Google Sheets
// A Zapier automation automatically assigns asana tasks using the sheets
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz2__ivp8VWFCQZg5WaB-b3QDmxO5fWavFvmodkk7kstYzmKaCEymmIhzlKXF_ofxM3/exec';

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
    await submitToGoogle(formData);

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
  } catch (error) {
    console.error('Failed to submit form:', error);
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

