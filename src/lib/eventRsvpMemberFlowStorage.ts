const STORAGE_KEY = "devs_event_rsvp_member_flow";

export type RsvpMemberFlowPhase = "need_signup" | "signup_complete";

export type RsvpMemberFlowStored = {
  phase: RsvpMemberFlowPhase;
  eventId: string;
  email: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseStored(raw: string | null): RsvpMemberFlowStored | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as RsvpMemberFlowStored).phase !== "string" ||
      typeof (parsed as RsvpMemberFlowStored).eventId !== "string" ||
      typeof (parsed as RsvpMemberFlowStored).email !== "string"
    ) {
      return null;
    }
    const p = parsed as RsvpMemberFlowStored;
    if (p.phase !== "need_signup" && p.phase !== "signup_complete") {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

function clearCorrupted(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}

/** Called when redirecting from RSVP after the user is not yet a member. */
export function setNeedSignupIntent(eventId: string, email: string): void {
  try {
    const payload: RsvpMemberFlowStored = {
      phase: "need_signup",
      eventId,
      email: normalizeEmail(email),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
  }
}

/** Read current flow without mutating (e.g. Signup prefill). */
export function getMemberFlow(): RsvpMemberFlowStored | null {
  try {
    const parsed = parseStored(sessionStorage.getItem(STORAGE_KEY));
    if (!parsed) {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) clearCorrupted();
      return null;
    }
    return parsed;
  } catch {
    clearCorrupted();
    return null;
  }
}

/** After successful member signup — same event id, email from submitted form. */
export function setSignupComplete(eventId: string, email: string): void {
  try {
    const payload: RsvpMemberFlowStored = {
      phase: "signup_complete",
      eventId,
      email: normalizeEmail(email),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
  }
}

/**
 * Call when `/events#eventId` loads (e.g. after signup). Works even if the card
 * is not mounted yet—unlike per-card consumption under pagination.
 * Clears storage and returns email for RSVP prefill when phase is signup_complete.
 */
export function consumeSignupCompleteForEvent(eventId: string): string | null {
  try {
    const parsed = parseStored(sessionStorage.getItem(STORAGE_KEY));
    if (!parsed) {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) clearCorrupted();
      return null;
    }
    if (parsed.phase !== "signup_complete" || parsed.eventId !== eventId) {
      return null;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    return parsed.email;
  } catch {
    clearCorrupted();
    return null;
  }
}
