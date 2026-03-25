# Sponsor Form Component

The **SponsorForm** is a **contact-style form** that emails **`contact@devsuoa.com`** via the **`sendEmail`** helper (Supabase Edge Function **`send-email`**). It supports two modes: **sponsorship inquiry** and **general contact**, selected with the **`formType`** prop.

## Purpose

- Single component for **Sponsors** and **Contact** (or similar) pages with different copy and email templates
- User feedback through **react-toastify** toasts

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `formType` | `"sponsor" \| "contact"` | `"sponsor"` | Switches labels and HTML email body |

## Behaviour

1. Collects **name** (or company name), **email**, and **message**.
2. On submit, builds **subject** and **HTML body** from the active config, then **`sendEmail({ to, subject, html })`**.
3. Success → success toast and form reset; failure → error toast.

## Usage

```tsx
import SponsorForm from "./components/SponsorForm";

<SponsorForm formType="sponsor" />
<SponsorForm formType="contact" />
```

## Operational notes

- Recipient is hard-coded in the component; change there if the inbox changes.
- Deliverability depends on Supabase Edge Function configuration and secrets.

## Related

- `src/lib/emailController.ts`
- [Repository overview](repository_overview.md) – Edge Functions summary
