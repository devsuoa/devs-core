# Sponsor Tape Component

The **SponsorTape** renders a **horizontally scrolling strip** of sponsor logos for visual continuity (e.g. home or landing sections).

## Purpose

- Repeat sponsor marks in a single row for an infinite-marquee style track (CSS class **`sponsor-track`** handles motion where defined in global styles)
- Keep data in one place: **`src/data/current_sponsors.json`**

## Implementation

- Imports **`current_sponsors.json`** and maps each entry’s **`image`** field to an `<img>`.
- The logo list is **duplicated twice** in the DOM so the track can loop seamlessly.
- Logos use a fixed height (`h-10`) and **`object-contain`**; container is full width with **`overflow-hidden`**.

## Usage

```tsx
import SponsorTape from "./components/SponsorTape";

<SponsorTape />;
```

No props. Update **`src/data/current_sponsors.json`** (and any mirrored **`public/`** data if your deploy pipeline uses it) to change logos.

## Related

- [Sponsor Card](sponsorCard.md), [Sponsor Item](sponsorItem.md) – other sponsor presentations
- `src/pages/Sponsors.tsx` – full sponsors page layout
