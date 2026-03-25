# Sponsor Item Component

The **SponsorItem** is a **minimal logo block**: sponsor **name** and **logo** image, centred in a column with spacing.

## Purpose

- Reuse a simple sponsor mark where a full **`SponsorCard`** is not needed (e.g. grids or lists)

## Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Used for accessible **`alt`** text |
| `logo` | `string` | Image `src` |
| `className` | `string` (optional) | Extra classes merged onto the **image** element |

## Usage

```tsx
import SponsorItem from "./components/SponsorItem";

<SponsorItem
  name="Jane Street"
  logo="/sponsors/gold/jane_street_logo.png"
  className="p-2"
/>
```

## Related

- [Sponsor Card](sponsorCard.md)
- [Sponsor Tape](sponsorTape.md)
