# Site toast component

**Site toast** is the DEVS-branded notification UI: dark panel, **Silkscreen** body text, optional in-panel **×** dismiss, and a **variant** (default / success / error) that adjusts border and ring colour. It is implemented in **`src/components/SiteToast.tsx`** and shown through the app-wide **`react-toastify`** **`ToastContainer`** in **`App.tsx`** (`showSiteToast` is the only caller of `toast()` elsewhere—use it instead of `toast.success` / `toast.error` directly).

## Purpose

- One visual language for transient messages (join validation, sponsor/contact form, RSVP prompts, **“Link copied!”**).
- **`react-toastify`** remains the **queue / positioning / container** layer; **`SiteToast`** is the branded body.

## API

### `SiteToastContent`

Presentational building block. Safe to embed for layout experiments; for live notifications use **`showSiteToast`**.

| Prop | Type | Description |
|------|------|-------------|
| `message` | `string` | Copy to display |
| `closeToast` | `() => void` (optional) | When set, renders the **×** control; omit to hide the button |
| `variant` | **`SiteToastVariant`** (optional) | `"default"` \| `"success"` \| `"error"` — defaults to **`default`** (purple ring / white border) |

**Layout:** Three-column **CSS grid** (`2.5rem` / `1fr` / `2.5rem`) keeps the message **visually centered** in the bar while the close control sits in the right column.

### `showSiteToast(message, options?)`

| Option | Description |
|--------|-------------|
| `variant` | **`default`** (purple), **`success`** (emerald accent), **`error`** (red accent) |
| `autoClose` | ms, or **`false`** to stay until **×** (default **4500**) |
| `position` | Any **`ToastPosition`**; default **`top-right`** (matches **`App`** container). RSVP prompts use **`top-center`**; **“Link copied!”** uses **`bottom-center`**. |

**Implementation:** Pass **JSX** (`<SiteToastContent />`) as the toast body—**not** a render callback—so the toast reliably mounts. **`toast.dismiss(toastId)`** powers the **×**.

### Types

- **`SiteToastVariant`** — `"default" | "success" | "error"`
- **`SiteToastOptions`** — `autoClose`, `position` (from **`ToastOptions`**), plus **`variant`**

## Requirements

- A single **`ToastContainer`** in **`App.tsx`** (plus global **`ReactToastify.css`**). Do not add second containers on feature pages unless you have a special reason.

## Usage

```tsx
import { showSiteToast, SiteToastContent } from "./components/SiteToast";

showSiteToast("Saved");
showSiteToast("Something went wrong", { variant: "error" });
showSiteToast("Done!", { variant: "success", autoClose: 4000 });
showSiteToast("Heads up", { position: "top-center" });

<SiteToastContent message="Preview" variant="error" closeToast={() => {}} />;
```

## Where it is used

- **`Signup`** — validation and API errors (**`variant: "error"`**).
- **`SponsorForm`** — success / failure after **`sendEmail`**.
- **`EventsCard`** — **`NotMemberError`** prompt (**`top-center`**); clipboard **“Link copied!”** (**`success`**, **`bottom-center`**).
- **`Events`** — **“Please RSVP”** after signup return (**`top-center`**).

See [Events & RSVP](events_and_rsvp.md).

## Related

- `src/components/SiteToast.tsx`
- `src/App.tsx` — **`ToastContainer`**
- [Events Card](eventsCard.md), [Generic RSVP Dialog](genericRSVPDialog.md)
