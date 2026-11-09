import React, { useState, useEffect } from "react";
import { api, ApiError } from "./api";

export interface MarketingFormData {
  postType: "event" | "sponsorship" | "";
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
  postType: "event" | "sponsorship" | "";
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
  setPostType: (value: "event" | "sponsorship" | "") => void;
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

/**
 * Sends the request to the API, which saves it, adds a task for the marketing team and
 * forwards it to the Google Sheet (whose Apps Script handles the emails).
 */
async function submitRequest(formData: MarketingFormData): Promise<void> {
  if (!formData.postType) {
    throw new Error("postType is required");
  }
  await api("/api/admin/marketing-requests", {
    method: "POST",
    body: {
      post_type: formData.postType,
      event_name: formData.eventName,
      event_date: formData.eventDate,
      event_time: formData.eventTime,
      event_location: formData.eventLocation,
      event_description: formData.eventDescription,
      event_suggestions: formData.eventSuggestions,
      sponsor_name: formData.sponsorName,
      sponsorship_email_date: formData.sponsorshipEmailDate,
      sponsorship_post_date: formData.sponsorshipPostDate,
      sponsorship_event_name: formData.sponsorshipEventName,
      sponsorship_links: formData.sponsorshipLinks,
      sponsorship_description: formData.sponsorshipDescription,
      marketing_description: formData.marketingDescription,
      pre_written_captions: formData.preWrittenCaptions,
    },
  });
}

export async function handleMarketingSubmit(
  e: React.FormEvent,
  state: MarketingFormState,
  setters: MarketingFormSetters,
) {
  e.preventDefault();

  const formData: MarketingFormData = {
    postType: state.postType,
    ...(state.postType === "event" && {
      eventName: state.eventName,
      eventDate: state.eventDate,
      eventTime: state.eventTime,
      eventLocation: state.eventLocation,
      eventDescription: state.eventDescription,
      eventSuggestions: state.eventSuggestions,
    }),
    ...(state.postType === "sponsorship" && {
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

  console.log("Marketing Request Data:", formData);

  try {
    await submitRequest(formData);

    // Show dialog and reset form on submit
    setters.setShowDialog(true);
    setters.setPostType("");
    setters.setEventName("");
    setters.setEventDate("");
    setters.setEventTime("");
    setters.setEventLocation("");
    setters.setEventDescription("");
    setters.setEventSuggestions("");
    setters.setSponsorName("");
    setters.setSponsorshipEmailDate("");
    setters.setSponsorshipPostDate("");
    setters.setSponsorshipEventName("");
    setters.setSponsorshipLinks("");
    setters.setSponsorshipDescription("");
    setters.setMarketingDescription("");
    setters.setPreWrittenCaptions("");
  } catch (error: any) {
    console.error("Failed to submit form:", error);

    // If user somehow reaches page without admin role
    if (error instanceof ApiError && error.status === 403) {
      alert("You do not have permission to submit marketing requests.");
      return;
    }

    alert("Failed to submit form. Please try again.");
  }
}

export function closeMarketingDialog(setShowDialog: (value: boolean) => void) {
  setShowDialog(false);
}

export function useMarketingPortal() {
  const [postType, setPostType] = useState<"event" | "sponsorship" | "">("");
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Event fields
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSuggestions, setEventSuggestions] = useState("");

  // Sponsorship fields
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorshipEmailDate, setSponsorshipEmailDate] = useState("");
  const [sponsorshipPostDate, setSponsorshipPostDate] = useState("");
  const [sponsorshipEventName, setSponsorshipEventName] = useState("");
  const [sponsorshipLinks, setSponsorshipLinks] = useState("");
  const [sponsorshipDescription, setSponsorshipDescription] = useState("");

  // Common fields
  const [marketingDescription, setMarketingDescription] = useState("");
  const [preWrittenCaptions, setPreWrittenCaptions] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await handleMarketingSubmit(
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
        },
      );
    } finally {
      setIsSubmitting(false);
    }
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
    isSubmitting,
  };
}
