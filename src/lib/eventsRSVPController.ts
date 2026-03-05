import { supabase } from "./supabase";

export class NotMemberError extends Error {
    constructor() {
    super("User is not a member");
    this.name = "NotMemberError";
    }
}

export class AlreadyRSVPedError extends Error {
    constructor() {
    super("User has already RSVP'd to this event");
    this.name = "AlreadyRSVPedError";
    }
}

export async function rsvpToEvent(eventId: string, email: string, dietaryRequirements: string | null) {
  const { data: data, error: memberError } = await supabase.functions.invoke("member-exists", { body: { email } });
  
  // check for other errors
  if (memberError) {
    throw memberError;
  }
  
  // If member does not exist, redirect to join page
  if (!data.exists) {
    throw new NotMemberError()
  }

  const { error } = await supabase
    .from("events_rsvp")
    .insert({
      event_id: eventId,
      email,
      dietary_requirements: dietaryRequirements || null,
    });

  if (error) {
    // Prevent duplicate RSVPs
    if (error.code === "23505") {
      throw new AlreadyRSVPedError()
    }

    throw error;
  }
}
