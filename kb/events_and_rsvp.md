# Events & RSVP

> **AI documentation notice:** This page was created with AI assistance and **may contain errors**. See [Documentation disclaimer](disclaimer.md).

This document describes how **public events**, **RSVP**, **admin event management**, and the **event attendees dashboard** work in the codebase. It complements [Repository overview](repository_overview.md) and [Auth Service](auth.md).

## Purpose

- List **upcoming and past** events for visitors (`/events`).
- Let eligible users **RSVP** (including optional **group RSVP** and custom questions).
- Let admins **create, edit, delete**, and toggle visibility of events (`/admin/manage-events`).
- Let admins **review RSVPs** and attendance (`/admin/event-attendees`).

## Public events listing

**Route:** `/events`  
**Page:** `src/pages/Events.tsx`

**Data:** `useEvents` in `src/lib/eventsController.ts` loads rows from Supabase table **`events`** where **`is_active`** is true, ordered by `event_date`. The hook splits results into **upcoming** and **past** using UTC midnight comparison.

**Display helpers:** `formatEventDate` formats dates for en-NZ style output.

**UI:** Event cards (`EventsCard`) open RSVP where applicable; external registration links may use `register_url`.

**URL hash:** **`#eventId`** focuses the right card and pagination (see **`Events.tsx`**).

## RSVP → join → return (non-members)

Visitors who RSVP before they are **members** hit **`NotMemberError`** from **`member-exists`**. The client keeps context in **`sessionStorage`** via **`src/lib/eventRsvpMemberFlowStorage.ts`** (tab-scoped; email is not put in the query string):

| Phase                 | Meaning                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| **`need_signup`**     | Set when redirecting from RSVP to **`/join`**; **`Signup`** prefills the email field on load.                |
| **`signup_complete`** | Set when **`Signup`** succeeds if a **`need_signup`** intent exists; then navigate to **`/events#eventId`**. |

**`Events.tsx`** calls **`consumeSignupCompleteForEvent(hashEventId)`** after the list loads so the correct event is handled **even if its card is on another pagination page**. It passes the email into **`EventsCard`** as **`postJoinRsvpEmail`**, which flips the card, opens **`GenericRSVPDialog`**, and supplies **`initialLeaderEmail`**.

Short prompts use the branded **[Site toast](siteToast.md)** (**`top-center`**): **“Please sign up first”** when sending the user to **`/join`**, and **“Please RSVP”** when they land back on **`/events`** after signup.

If the user leaves **`/join`** without completing signup, the flow stays on **`need_signup`** and the events list does not auto-open RSVP (nothing consumes until **`signup_complete`**).

## RSVP submission

**UI:** `src/components/GenericRSVPDialog.tsx` (and usage from `EventsCard` / `Events` page).

**Logic:** `src/lib/eventsRSVPController.ts` centralises validation and writes to **`events_rsvp`**.

Notable behaviours (verify in code for exact rules):

- Loads event config (`max_attendees`, `group_rsvp_enabled`, `group_rsvp_max_emails`) from **`events`** before accepting a submission.
- Defines explicit error types (e.g. not a member, already RSVP’d, event full, group RSVP disabled or over limit) for clear user messaging.
- Normalises and deduplicates **group emails** with the leader email.
- Enforces **capacity** using existing RSVP rows when `max_attendees` is set.

**Types:** `src/lib/eventRsvpTypes.ts` describes RSVP question shapes stored on the event row (e.g. JSON field `rsvp_questions`).

## Admin: manage events

**Route:** `/admin/manage-events`  
**Page:** `src/pages/admin/ManageEvents.tsx`

**Data:** `useEventsManagement` in `src/lib/manageEventsController.ts`:

- **Fetches** all events (not only active), ordered by date.
- **addEvent** / **editEvent** / **removeEvent** map to Supabase `insert`, `update`, and `delete` on **`events`**.

**Images:** `uploadEventImage` uploads to Supabase Storage bucket **`event-images`** and returns a public URL for `image_url`.

Admins must pass **`checkAdminAuthorization`** (see `auth.ts`) via the surrounding admin UX.

## Admin: event attendees (dashboard)

**Route:** `/admin/event-attendees`  
**Page:** `src/pages/admin/EventsDashboard.tsx`

**Data:** `useEventAttendees` and related helpers in `src/lib/eventsDashboardController.ts` read from **`events_rsvp`** with joins to **`events`** and **`members`** (shape normalised in `normalizeRow`). Supports filtering by event, exporting or marking attendance depending on UI (confirm in component).

Utility exports include **`formatNZDate`**, **`memberFullName`**, and row typing **`AttendeeRow`**.

## Pagination and scale

The public events page may use the shared **[Pagination](pagination.md)** component for long lists. Admin tables may use similar patterns or MUI tables—check the page implementation for the current approach.

## Security considerations

1. **RLS:** All enforcement for who can read/write `events` and `events_rsvp` must be correct in **Supabase policies**; the anon key is public in the browser bundle.
2. **Admin-only routes** still rely on client-side gating; treat server-side rules as mandatory for data protection.
3. **PII:** RSVP and member registry data include emails and names; handle exports and screenshots according to your privacy policy.

## Related files (quick reference)

| Area                                  | Primary files                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| Public list                           | `src/pages/Events.tsx`, `src/lib/eventsController.ts`, `src/components/EventsCard.tsx` |
| RSVP member flow (storage)            | `src/lib/eventRsvpMemberFlowStorage.ts`                                                |
| Join (prefill / post-signup redirect) | `src/pages/Signup.tsx`                                                                 |
| RSVP UI                               | `src/components/GenericRSVPDialog.tsx`                                                 |
| Site toast (RSVP prompts)             | `src/components/SiteToast.tsx` — see [Site toast](siteToast.md)                        |
| RSVP API                              | `src/lib/eventsRSVPController.ts`, `src/lib/eventRsvpTypes.ts`                         |
| Admin CRUD                            | `src/pages/admin/ManageEvents.tsx`, `src/lib/manageEventsController.ts`                |
| Attendees                             | `src/pages/admin/EventsDashboard.tsx`, `src/lib/eventsDashboardController.ts`          |

KB component docs: [Events Card](eventsCard.md), [Generic RSVP Dialog](genericRSVPDialog.md), [Site toast](siteToast.md).

## Future enhancements

- [ ] Document exact attendance toggle and export flows once stabilised
- [ ] Add sequence diagram for RSVP + capacity check for onboarding
