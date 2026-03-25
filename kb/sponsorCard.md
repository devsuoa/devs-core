# Sponsor Card Component

The **SponsorCard** is a **tiered sponsor tile** (gold / silver / bronze) used in stacked or carousel-style sponsor layouts. It shows tier label, logo (or name fallback), and a short description.

## Purpose

- Consistent visual hierarchy by **sponsor tier**
- Accessible labelling via **`aria-label`**

## Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Sponsor name; used for alt text and text fallback |
| `image` | `string` | Logo URL; if empty, name renders as text |
| `desc` | `string` | Short blurb under the logo |
| `tier` | `"gold" \| "silver" \| "bronze"` | Controls accent colour class |

## Structure

- Outer **`li`** with **`data-tier`** for styling hooks
- Inner card with ring/shadow styling, tier heading, image area, and description **`p`**

## Usage

```tsx
import SponsorCard from "./components/SponsorCard";

<SponsorCard
  name="Example Corp"
  image="/sponsors/gold/example.png"
  desc="Supporting DEVS events and workshops."
  tier="gold"
/>
```

## Related

- [Sponsor Item](sponsorItem.md) – simpler logo + name block
- [Sponsor Form](sponsorForm.md) – inquiry form
