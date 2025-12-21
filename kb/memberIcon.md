# MemberIcon Component

The **MemberIcon** component displays an individual team member (exec) with their photo, name, role, and optional visual indicators such as team colour and lead status.

It is made for use in team / committee pages where consistent styling and quick visual identification of teams is important.

## Purpose

Use this component to:
- Display exec or committee members in a consistent format
- Visually distinguish teams using coloured borders
- Highlight team leads with a badge
- Reduce duplication across team layouts

## Layout

Each `MemberIcon` renders:
- A circular profile image with a coloured border based on team
- An optional lead badge overlay
- The member’s name
- An optional role label

The component is vertically stacked and centered, making it suitable for grids and flex layouts.

## Usage

### Basic Example

```tsx
import { MemberIcon, Team } from "@/components/MemberIcon";

<MemberIcon
  name="Alanna Santoso"
  image="/team/execs/alanna.jpg"
/>
```

### With Role and Team

```tsx
<MemberIcon
  name="Alanna Santoso"
  role="Secretary"
  image="/team/execs/alanna.jpg"
  team={Team.Admin}
/>
```

### Lead of a Team

```tsx
<MemberIcon
  name="John Doe"
  role="Tech Lead"
  image="/team/execs/john.jpg"
  team={Team.Tech}
  lead
/>
```

## Props

| Prop        | Type      | Required | Description                                                   |
| ----------- | --------- | -------- | ------------------------------------------------------------- |
| `name`      | `string`  | Yes      | Name of the member, displayed below the image                 |
| `image`     | `string`  | No       | Profile image path or URL                                     |
| `role`      | `string`  | No       | Optional role text displayed under the name                   |
| `team`      | `Team`    | No       | Team enum used to determine the image border colour           |
| `lead`      | `boolean` | No       | If true, displays a lead star badge on the image              |
| `className` | `string`  | No       | Additional Tailwind classes for outer container customization |

## Team Enum

The `team` prop must be one of the following values:

```ts
enum Team {
  Presidents
  SeniorAdvisor
  Admin
  Tech
  Industry
  Comps
  Social
  Marketing
}
```

Each team maps to a predefined border colour to ensure consistent branding.

## Styling & Customization

* Uses **Tailwind CSS** for layout, spacing, and transitions
* Profile image:

  * Circular (`rounded-full`)
  * Fixed max size (100px)
  * Hover scale animation
* Border colour is automatically applied based on the `team` prop
* Defaults to a white border if no team is provided

You can extend styling via `className`:

```tsx
<MemberIcon
  name="Jane Doe"
  className="p-8"
  team={Team.Marketing}
/>
```

## Behavior Notes

* The image is only rendered if an `image` prop is provided
* The lead badge is conditionally rendered when `lead` is true
* Role text is omitted entirely if not provided
* Safe to use in grids, carousels, or flex rows

## When to Use

Use this component when:

* Displaying committee or exec members
* Team-based visual distinction is needed
* Consistent avatar sizing and layout is required

Avoid using this component when:

* Displaying large profile cards with extended bios
* Inline or text-only lists are more appropriate
