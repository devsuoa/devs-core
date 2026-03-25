# Generic RSVP Dialog Component

The **GenericRSVPDialog** is a modal used to collect **event RSVPs**: leader email, optional **group emails** (when the event allows group RSVP), dietary requirements, and **per-event custom questions** (text, single select, or multi select).

## Purpose

- Present a consistent RSVP UX across the site
- Validate required fields before calling the parent’s submit handler
- Surface domain-specific errors from `eventsRSVPController` (already RSVP’d, event full, group size, etc.)
- Show a short success state, then reset and close

## Where it is used

Primarily from **`EventsCard`** on the public events flow. The parent passes `onConfirm`, which should call **`rsvpToEvent`** (or equivalent). See [Events & RSVP](events_and_rsvp.md).

## Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | When true, the dialog is rendered |
| `onClose` | `() => void` | Called to dismiss (also used after success timeout) |
| `groupRSVPEnabled` | `boolean` | Enables group email fields and validation |
| `groupRSVPMaxEmails` | `number \| null` | Caps how many group email inputs apply; `null` uses current list length |
| `rsvpQuestions` | `RSVPQuestion[]` | Custom questions from the event (`eventRsvpTypes`) |
| `onConfirm` | `(payload) => Promise<void> \| void` | Async-friendly; receives `leaderEmail`, `groupEmails`, `dietaryRequirements`, `answers` |

## Behaviour summary

1. **Validation:** Leader email required; required RSVP questions must be answered; if group RSVP is on, at least one group email and respect for `groupRSVPMaxEmails`.
2. **Submit:** Calls `onConfirm`; on success sets a submitted state, then after **3 seconds** clears fields and calls `onClose`.
3. **Errors:** Maps `AlreadyRSVPedError`, `EventFullError`, `GroupRSVPSizeExceededError` to user-facing strings; generic fallback for other errors.
4. **Keyboard:** **Escape** closes; **Enter** submits when not loading and not already on success screen.

## Usage

```tsx
import GenericRSVPDialog from "./components/GenericRSVPDialog";

<GenericRSVPDialog
  open={rsvpOpen}
  onClose={() => setRsvpOpen(false)}
  groupRSVPEnabled={event.group_rsvp_enabled}
  groupRSVPMaxEmails={event.group_rsvp_max_emails}
  rsvpQuestions={event.rsvp_questions}
  onConfirm={async (payload) => {
    await rsvpToEvent({ eventId: event.id, ...payload });
  }}
/>
```

## Related

- `src/lib/eventsRSVPController.ts` – server-side rules and Supabase writes
- `src/lib/eventRsvpTypes.ts` – question shapes
