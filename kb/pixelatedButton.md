# PixelatedButton Component

The **PixelatedButton** component is a reusable, pixel-art–styled button designed for interactive navigation across the site.
It visually transitions between **inactive**, **hover**, and **clicked** states using smooth cross-fade animations.

This component is built specifically to avoid layout jitter and snapping when swapping images.

All the images are designed by the design team and the component handles switching between states

## Purpose

Use this component to:

- Create consistent pixel-art buttons across the site
- Support hover and click states with smooth transitions
- Avoid image flicker and layout shifts
- Reduce duplicated button logic and state handling

## How It Works

Instead of swapping the image `src`, the component:

- Renders **three stacked images** (inactive, hover, clicked)
- Controls their visibility using `opacity`
- Animates transitions via `transition-opacity`

Because opacity is animatable, this produces a smooth fade between states.

A hidden spacer image is used to lock the button’s layout height.

## Usage

### Basic Example

```tsx
import PixelatedButton from "./components/PixelatedButton";

<PixelatedButton
  to="/join"
  inactive="/buttons/join/join_us_inactive.png"
  hover="/buttons/join/join_us_hover.png"
  clicked="/buttons/join/join_us_click.png"
  alt="Join Us"
/>;
```

### Button (Action) Example

Use `PixelatedButton` without `to` when you want custom click behavior.

```tsx
<PixelatedButton
  inactive="/buttons/register/inactive.png"
  hover="/buttons/register/hover.png"
  clicked="/buttons/register/click.png"
  onClick={() => {
    console.log("Button clicked");
  }}
/>
```

## Props

| Prop        | Type         | Required | Description                                                               |
| ----------- | ------------ | -------- | ------------------------------------------------------------------------- |
| `to`        | `string`     | No       | Route path the button navigates to (internal navigation via React Router) |
| `onClick`   | `() => void` | No       | Click handler when no `to` prop is provided                               |
| `inactive`  | `string`     | Yes      | Image shown in the default (inactive) state                               |
| `hover`     | `string`     | Yes      | Image shown when the button is hovered                                    |
| `clicked`   | `string`     | Yes      | Image shown while the button is actively clicked                          |
| `className` | `string`     | No       | Tailwind classes to control sizing and layout                             |
| `alt`       | `string`     | No       | Alt text for accessibility (applied to spacer image)                      |

## Styling & Customization

Button size and layout are controlled entirely via `className`.

```tsx
<PixelatedButton
  to="/events"
  inactive="/buttons/events/inactive.png"
  hover="/buttons/events/hover.png"
  clicked="/buttons/events/click.png"
  className="w-48"
/>
```

The component uses:

- Tailwind CSS for layout and transitions
- `pixelated` image rendering
- Absolute positioning with a fixed-size spacer

## Behavior Notes

- Transitions use `opacity` (not `src` changes) for smooth animation
- All images must be the **same dimensions**
- Images are preloaded automatically since they are all rendered
- Mouse states:
  - `hover` → on mouse enter
  - `clicked` → on mouse down
  - resets cleanly on mouse leave

## When to Use

Use this component when:

- You need an interactive custom designed pixel-style button
- Hover and click feedback is important
- Visual smoothness matters

Avoid using this component when:

- A simple text button is sufficient
- No hover or click feedback is needed
- The button must dynamically change size

## Accessibility Notes

- If `to` is provided, the button renders as a React Router `<Link>`
- If `to` is omitted, the button renders as a non-semantic wrapper and requires `onClick`
- Provide a meaningful `alt` value when the button conveys important action
- Keyboard focus styles are not included by default and should be added if needed

## Important Notes

- Either `to` **or** `onClick` should be provided — not both
- External URLs should be handled manually (e.g. `window.open`) via `onClick`
- All images must have identical dimensions to avoid visual artifacts

## Known Limitations

- Keyboard activation (Enter / Space) is not handled by default
- Screen reader semantics are limited when used without `to`
