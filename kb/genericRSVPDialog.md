# Generic RSVP Dialog Component

> **Status (November 2026):** this feature is being rebuilt on the Java API. Its code still uses the direct Supabase calls described below, and the database now refuses them (migration `V20261026_0320`), so it won't work until the rebuild is merged. The rebuilt version gets its data through `api()` in `apps/web/src/lib/api.ts`.

The **GenericRSVPDialog** is a modal used to collect **event RSVPs**: leader email, optional **group emails** (when the event allows group RSVP), dietary requirements, and **per-event custom questions** (text, single select, or multi select). When the leader's email does not belong to an existing DEVS member, the dialog **reveals an inline signup step** so the user can register and RSVP without leaving the page.

## Purpose

- Present a consistent RSVP UX across the site
- Validate required fields before calling the parent's submit handler
- Surface domain-specific errors from `eventsRSVPController` (already RSVP'd, event full, group size, etc.)
- Catch `NotMemberError` and switch into an inline **signup step** instead of redirecting to `/join`
- Show a short success state, then reset and close

## Where it is used

Primarily from **`EventsCard`** on the public events flow. The parent passes `onConfirm`, which should call **`rsvpToEvent`** (or equivalent). When the dialog's `onConfirm` payload includes `signupInfo`, the parent must first create the member (e.g. via `submitSignupForm`) and then proceed with the RSVP / payment path. See [Events & RSVP](events_and_rsvp.md).

## Props

| Prop                  | Type                                 | Description                                                                                                                                                                                             |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `open`                | `boolean`                            | When true, the dialog is rendered                                                                                                                                                                       |
| `onClose`             | `() => void`                         | Called to dismiss (also used after success timeout)                                                                                                                                                     |
| `initialLeaderEmail`  | `string` (optional)                  | When **`open`** and set, normalises into the leader email field                                                                                                                                         |
| `groupRSVPEnabled`    | `boolean`                            | Enables group email fields and validation                                                                                                                                                               |
| `groupRSVPMaxEmails`  | `number \| null`                     | Caps how many group email inputs apply; `null` uses current list length                                                                                                                                 |
| `paymentEnabled`      | `boolean` (optional)                 | Toggles the cost/payment section                                                                                                                                                                        |
| `chargeAmount`        | `number \| null` (optional)          | Per-person price when paid                                                                                                                                                                              |
| `bankTransferEnabled` | `boolean` (optional)                 | Enables the bank-transfer option in the payment picker                                                                                                                                                  |
| `rsvpQuestions`       | `RSVPQuestion[]`                     | Custom questions from the event (`eventRsvpTypes`)                                                                                                                                                      |
| `onConfirm`           | `(payload) => Promise<void> \| void` | Async-friendly; receives `leaderEmail`, `groupEmails`, `dietaryRequirements`, `answers`, `paymentMethod`, `bankPaymentProofFile`, and optionally `signupInfo` when the inline signup step was filled in |

### `onConfirm` payload

```ts
{
  leaderEmail: string;
  groupEmails: string[];
  dietaryRequirements: string | null;
  answers: RSVPAnswers;
  paymentMethod?: "stripe" | "bank_transfer";
  bankPaymentProofFile?: File | null;
  // Present only after the inline signup step has been filled in.
  signupInfo?: RSVPSignupValues;
}
```

`RSVPSignupValues` is exported from `GenericRSVPDialog` and mirrors the questions on the standalone `/join` page (first name, last name, gender, university, UPI, student ID, year, and one or more degree+major blocks). When `signupInfo` is present, the parent must create the member record (e.g. `submitSignupForm(...)`) **before** completing the RSVP. The dialog does not run the signup itself.

## Behaviour summary

1. **Validation:** Leader email required; required RSVP questions must be answered; if group RSVP is on, respect for `groupRSVPMaxEmails`. When the signup step is active, the dialog runs its own validation over the signup fields before resubmitting.
2. **Submit (member):** Calls `onConfirm` with no `signupInfo`. On success, shows the success state for ~3 seconds, clears fields, and calls `onClose`.
3. **Submit (non-member):** If `onConfirm` throws `NotMemberError`, the dialog reveals an inline **DEVS member details** section styled with the dialog's existing `pixel-input` controls, keeps all RSVP fields populated, and changes the confirm-button label to "Sign up & RSVP" (or "Sign up, pay & confirm" / "Sign up & confirm RSVP" for paid events). The next submit calls `onConfirm` again with `signupInfo` attached.
4. **Errors:** Maps `AlreadyRSVPedError`, `EventFullError`, `GroupRSVPSizeExceededError` to user-facing strings; generic fallback for other errors. If the signup step succeeds but RSVP then fails, the member record is **kept** and the RSVP error is surfaced.
5. **Keyboard:** **Escape** closes (when chrome-dismiss is enabled); **Enter** submits when not loading and not already on success screen.

## Usage

```tsx
import GenericRSVPDialog from "./components/GenericRSVPDialog";
import { submitSignupForm } from "./lib/signupController";
import { rsvpToEvent } from "./lib/eventsRSVPController";

<GenericRSVPDialog
  open={rsvpOpen}
  onClose={() => setRsvpOpen(false)}
  groupRSVPEnabled={event.group_rsvp_enabled}
  groupRSVPMaxEmails={event.group_rsvp_max_emails}
  rsvpQuestions={event.rsvp_questions}
  onConfirm={async ({ signupInfo, ...payload }) => {
    if (signupInfo) {
      await submitSignupForm({
        ...signupInfo,
        email: payload.leaderEmail /* ... */,
      });
    }
    await rsvpToEvent({ eventId: event.id, ...payload });
  }}
/>;
```

## Related

- `src/lib/eventsRSVPController.ts` – server-side rules and Supabase writes; throws `NotMemberError`
- `src/lib/signupController.ts` – creates the member record from `signupInfo`
- `src/lib/eventRsvpTypes.ts` – question shapes
