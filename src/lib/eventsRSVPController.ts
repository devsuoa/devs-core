import { api, ApiError, jsonPart } from "./api";

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

/**
 * What the visitor fills in. Payment method, proof and attendance are not here:
 * the API sets them based on which endpoint is called and what the payment provider confirms.
 */
export interface RSVPSubmissionPayload {
  eventId: string;
  leaderEmail: string;
  dietaryRequirements: string | null;
  groupEmails: string[];
  answers: RSVPAnswers;
}

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

/**
 * All attendee emails for a stored RSVP row (leader + group, deduped as persisted).
 * Use this when expanding RSVPs to per-person rows in dashboards.
 */
export function emailsFromStoredRsvp(leaderEmail: string, groupEmails: unknown): string[] {
  if (Array.isArray(groupEmails) && groupEmails.length > 0) {
    const deduped = Array.from(
      new Set(groupEmails.map((e) => String(e).trim().toLowerCase()).filter(Boolean)),
    );
    return deduped.length ? deduped : [leaderEmail.trim().toLowerCase()];
  }
  return [leaderEmail.trim().toLowerCase()];
}

function requestBody(payload: RSVPSubmissionPayload) {
  const leader = payload.leaderEmail.trim().toLowerCase();
  return {
    leader_email: leader,
    group_emails: normalizeEmails(leader, payload.groupEmails).filter((e) => e !== leader),
    dietary_requirements: payload.dietaryRequirements || null,
    answers: payload.answers ?? {},
  };
}

/** Turns the API's error codes into the error classes the RSVP dialog already handles. */
function toRsvpError(err: unknown): unknown {
  if (!(err instanceof ApiError)) return err;
  switch (err.code) {
    case "not_member":
      return new NotMemberError();
    case "already_rsvped":
      return new AlreadyRSVPedError();
    case "event_full":
      return new EventFullError();
    case "group_rsvp_disabled":
      return new GroupRSVPDisabledError();
    case "group_too_large":
      return new GroupRSVPSizeExceededError();
    default:
      return new Error(err.message);
  }
}

/** RSVP to a free event. */
export async function rsvpToEvent(payload: RSVPSubmissionPayload) {
  try {
    await api(`/api/events/${encodeURIComponent(payload.eventId)}/rsvps`, {
      method: "POST",
      body: requestBody(payload),
    });
  } catch (err) {
    throw toRsvpError(err);
  }
}

/** RSVP to a paid event with a bank transfer screenshot. One request: the API checks, stores and saves. */
export async function rsvpWithBankTransfer(payload: RSVPSubmissionPayload, proof: File) {
  const form = new FormData();
  form.append("rsvp", jsonPart(requestBody(payload)));
  form.append("proof", proof);
  try {
    await api(`/api/events/${encodeURIComponent(payload.eventId)}/rsvps/bank-transfer`, {
      method: "POST",
      form,
    });
  } catch (err) {
    throw toRsvpError(err);
  }
}

/**
 * Starts a card payment and sends the browser to Stripe. The RSVP is created once Stripe
 * confirms the payment. The API sets the price and the return URLs.
 */
export async function startPaidEventCheckout(payload: RSVPSubmissionPayload) {
  let checkoutUrl: string | undefined;
  try {
    const data = await api<{ checkout_url: string }>(
      `/api/events/${encodeURIComponent(payload.eventId)}/rsvps/checkout`,
      { method: "POST", body: requestBody(payload) },
    );
    checkoutUrl = data?.checkout_url;
  } catch (err) {
    throw toRsvpError(err);
  }

  if (!checkoutUrl) {
    throw new Error("Could not create checkout session.");
  }

  window.location.assign(checkoutUrl);
}
