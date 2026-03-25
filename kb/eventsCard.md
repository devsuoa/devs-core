# Events Card Component

The **EventsCard** is a **flip card** for a single event: the **front** shows the hero image (aligned with social / Instagram assets); the **back** shows date, time, location, description, **share**, and **register / RSVP** actions.

## Purpose

- Rich event presentation on `/events` without leaving the list layout
- Optional **external registration** via `registerUrl`, or **in-app RSVP** via **`GenericRSVPDialog`**
- Support **controlled** or **internal** flip state for parent layouts (e.g. coordinated cards)

## Key props

| Prop | Notes |
|------|--------|
| `id` | Event id (passed to RSVP) |
| `title`, `image`, `imageAlt`, `tag`, `date`, `time`, `location`, `description` | Display; date uses `formatEventDate` from `eventsController` |
| `registerUrl` | If set, register **PixelatedButton** opens this URL in a new tab instead of RSVP |
| `groupRSVPEnabled`, `groupRSVPMaxEmails`, `rsvpQuestions` | Forwarded to **`GenericRSVPDialog`** |
| `className` | Wrapper sizing / layout |
| `isFlipped`, `onFlipChange` | Optional controlled flip |

## Interaction model

- **Card surface click** (not on buttons/links) toggles flip, unless RSVP dialog is open.
- When flipped on large breakpoints, the card can scale up (`lg:scale-115`) for emphasis.
- **Back face** `minHeight` tracks the **front** face via **`ResizeObserver`** so heights stay aligned.
- **Past events:** register button area is empty; share remains available where applicable.
- **Share:** uses **`navigator.share`** when available; otherwise copies the current page URL and shows a temporary toast.

## RSVP flow

If there is no `registerUrl`, the register button opens **`GenericRSVPDialog`** and keeps the card flipped. **`onConfirm`** calls **`rsvpToEvent`**. If **`NotMemberError`** is thrown, the user is sent to **`/join`** (re-thrown so the dialog can show error state if needed).

## Related

- [Generic RSVP Dialog](genericRSVPDialog.md)
- [Events & RSVP](events_and_rsvp.md)
- [Pixelated Button](pixelatedButton.md)
