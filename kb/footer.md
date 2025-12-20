# Footer Component

The **Footer** component provides the site-wide footer section with navigation links, social media icons, contact information, newsletter subscription, and decorative Game Boy elements.
It should appear consistently across all main pages.

## Purpose

- Provide footer navigation links
- Display social media links
- Show contact information
- Enable newsletter subscription
- Add visual interest with Game Boy themed graphics

## Component Requirements

- Acts as the main footer section
- Includes accessible newsletter subscription form
- Maintains responsive design for mobile and desktop
- Uses gradient background for visual integration

## Structure Overview

The footer is divided into **three sections**, laid out using a CSS Grid:

1. **Navigation & Social Links (Left)**
2. **Contact & Newsletter (Center)**
3. **Game Boy Graphics (Right)**

[ Navigation Links + Social Icons ] [ Contact Info + Newsletter Form ] [ Game Boy Graphics ]

### Left Section

- Vertical list of navigation links (HOME, ABOUT US, MEET OUR TEAM, SPONSORS, EVENTS, RESOURCES)
- Social media icons (Instagram, Facebook, LinkedIn) below navigation

### Center Section

- Contact heading and email address
- Newsletter subscription form with:
  - Email input field (responsive width)
  - Subscribe button
  - Accessible labels and ARIA attributes

### Right Section

- Decorative Game Boy button graphics
- Positioned with spacing to create visual balance

## Implementation

```tsx
import Footer from "./components/Footer";

<Footer />;
```

The Footer component requires no props and can be used directly. Import it and place it at the bottom of your page layout to display the footer section.

### Recommended Layout Usage

For consistency, the `Footer` should be placed inside a shared layout component where possible:

```tsx
import Footer from "./components/Footer";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default PageLayout;
```

## Styling & Customization

The footer uses:

- **Gradient background**: `bg-gradient-to-t from-black/50 to-transparent` for subtle blending
- **Silkscreen font**: For all text elements
- **Responsive grid**: 3 columns on desktop, stacks to 1 column on mobile (768px breakpoint)
- **Pixelated images**: Social icons and Game Boy graphics use pixelated rendering

### Newsletter Form

The newsletter form includes:

- Full form validation (`required` email field)
- Accessible labels (`htmlFor` and `aria-label` attributes)
- Responsive input width (`w-full sm:w-72 md:w-96`)
- Submit button with hover effects
- Form submission handler (currently logs to console - needs implementation)

## Accessibility Features

- Proper `<form>` element with `onSubmit` handler
- `<label>` elements with `htmlFor` attributes
- `required` and `type="email"` attributes on input
- ARIA label on submit button
- External links have `target="_blank"` and `rel="noopener noreferrer"`

## When to Use

Use the Footer component on:

- All public-facing pages
- Main content pages
- Landing pages (unless specified otherwise in Figma)

Do not use the footer on:

- Admin dashboard pages
- Login/signup pages
- Standalone utility pages without design approval

## Assets Required

The footer requires the following image assets in the `/public` directory:

- `/socials/Instagram.png` - Instagram icon
- `/socials/Facebook.png` - Facebook icon
- `/socials/LinkedIn.png` - LinkedIn icon
- `/footer/gameboy_buttons.png` - Game Boy D-pad graphic
- `/footer/gameboy_button.png` - Game Boy A/B button graphic

**Note**: File paths are case-sensitive. Ensure image files match the exact casing used in the component.

## Future Enhancements

- [ ] Implement newsletter subscription backend integration
- [ ] Add success/error states for newsletter form
- [ ] Add email validation feedback
- [ ] Create SocialLinks reusable component for DRY code
- [ ] Add animation to Game Boy graphics on hover
- [ ] Implement proper responsive stacking for mobile devices
