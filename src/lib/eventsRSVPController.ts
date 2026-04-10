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

export class EventFullError extends Error {
  constructor() {
    super("This event is already full.");
    this.name = "EventFullError";
  }
}

export class GroupRSVPDisabledError extends Error {
  constructor() {
    super("Group RSVP is not enabled for this event.");
    this.name = "GroupRSVPDisabledError";
  }
}

export class GroupRSVPSizeExceededError extends Error {
  constructor() {
    super("The submitted group size exceeds this event's group RSVP limit.");
    this.name = "GroupRSVPSizeExceededError";
  }
}

export type RSVPAnswerValue = string | string[];
export type RSVPAnswers = Record<string, RSVPAnswerValue>;

export interface RSVPSubmissionPayload {
  eventId: string;
  leaderEmail: string;
  dietaryRequirements: string | null;
  groupEmails: string[];
  answers: RSVPAnswers;
  paymentMethod?: "bank_transfer";
  bankPaymentProofPath?: string | null;
}

type EventRSVPConfig = {
  max_attendees: number | null;
  group_rsvp_enabled: boolean;
  group_rsvp_max_emails: number | null;
};

function normalizeEmails(leaderEmail: string, groupEmails: string[]): string[] {
  const cleaned = [leaderEmail, ...groupEmails]
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const deduped = Array.from(new Set(cleaned));
  return deduped.length ? deduped : [leaderEmail.trim().toLowerCase()];
}

/** Seats for pricing: 1 when group RSVP is off; deduped leader + group emails when on. */
export function attendeeSeatCount(
  leaderEmail: string,
  groupEmails: string[],
  groupRSVPEnabled: boolean,
): number {
  if (!groupRSVPEnabled) return 1;
  return normalizeEmails(leaderEmail, groupEmails).length;
}

function seatCountForGroup(raw: unknown): number {
  if (!Array.isArray(raw)) return 1;
  return Math.max(1, raw.length);
}

async function fetchEventRSVPConfig(eventId: string): Promise<EventRSVPConfig> {
  const { data, error } = await supabase
    .from("events")
    .select("max_attendees, group_rsvp_enabled, group_rsvp_max_emails")
    .eq("id", eventId)
    .single();

  if (error || !data) {
    throw error ?? new Error("Could not load event RSVP settings.");
  }

  return data;
}

async function isEventAtCapacity(eventId: string, requestedSeats: number, maxAttendees: number | null) {
  if (maxAttendees == null) return false;

  const { data, error } = await supabase
    .from("events_rsvp")
    .select("group_emails")
    .eq("event_id", eventId);

  if (error) {
    throw error;
  }

  const currentSeats = (data ?? []).reduce((total, row) => total + seatCountForGroup(row.group_emails), 0);
  return currentSeats + requestedSeats > maxAttendees;
}

async function assertLeaderIsMember(leaderEmail: string) {
  const { data, error: memberError } = await supabase.functions.invoke("member-exists", {
    body: { email: leaderEmail },
  });

  if (memberError) {
    throw memberError;
  }

  if (!data.exists) {
    throw new NotMemberError();
  }
}

async function validateRsvpRules(payload: RSVPSubmissionPayload, config: EventRSVPConfig) {
  const normalizedGroupEmails = normalizeEmails(payload.leaderEmail, payload.groupEmails);
  const requestedSeats = normalizedGroupEmails.length;

  if (!config.group_rsvp_enabled && requestedSeats > 1) {
    throw new GroupRSVPDisabledError();
  }

  if (config.group_rsvp_enabled && config.group_rsvp_max_emails != null && requestedSeats > config.group_rsvp_max_emails) {
    throw new GroupRSVPSizeExceededError();
  }

  await assertLeaderIsMember(payload.leaderEmail);

  if (await isEventAtCapacity(payload.eventId, requestedSeats, config.max_attendees)) {
    throw new EventFullError();
  }
}

export async function startPaidEventCheckout(payload: RSVPSubmissionPayload) {
  const config = await fetchEventRSVPConfig(payload.eventId);
  await validateRsvpRules(payload, config);

  const normalizedPayload: RSVPSubmissionPayload = {
    ...payload,
    leaderEmail: payload.leaderEmail.trim().toLowerCase(),
    groupEmails: normalizeEmails(payload.leaderEmail, payload.groupEmails),
    dietaryRequirements: payload.dietaryRequirements || null,
    answers: payload.answers ?? {},
  };

  const successUrl = `${window.location.origin}/events#${payload.eventId}`;
  const cancelUrl = `${window.location.origin}/events#${payload.eventId}`;
  const { data, error } = await supabase.functions.invoke("create-event-checkout-session", {
    body: {
      ...normalizedPayload,
      successUrl,
      cancelUrl,
    },
  });

  if (error) {
    throw error;
  }

  const checkoutUrl = data?.checkoutUrl as string | undefined;
  if (!checkoutUrl) {
    throw new Error("Could not create checkout session.");
  }

  window.location.assign(checkoutUrl);
}

export async function rsvpToEvent(payload: RSVPSubmissionPayload) {
  const config = await fetchEventRSVPConfig(payload.eventId);
  await validateRsvpRules(payload, config);
  const normalizedGroupEmails = normalizeEmails(payload.leaderEmail, payload.groupEmails);

  const { error } = await supabase
    .from("events_rsvp")
    .insert({
      event_id: payload.eventId,
      email: payload.leaderEmail.trim().toLowerCase(),
      dietary_requirements: payload.dietaryRequirements || null,
      group_emails: normalizedGroupEmails,
      rsvp_answers: payload.answers ?? {},
      payment_method: payload.paymentMethod ?? null,
      bank_payment_proof_path: payload.bankPaymentProofPath ?? null,
    });

  if (error) {
    // Prevent duplicate RSVPs
    if (error.code === "23505") {
      throw new AlreadyRSVPedError()
    }

    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("event is full")) {
      throw new EventFullError();
    }
    if (message.includes("group rsvp is not enabled")) {
      throw new GroupRSVPDisabledError();
    }
    if (message.includes("group rsvp size exceeds configured max")) {
      throw new GroupRSVPSizeExceededError();
    }

    throw error;
  }
}
