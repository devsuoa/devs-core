# Header Component

The **Header** component provides the primary site navigation and branding for the DEVS website.
It should appear consistently across all main pages.

## Purpose

- Display DEVS branding (logo)
- Provide top-level navigation links

## Component Requirements

- Acts as the main navigation bar
- Maintains consistent spacing and alignment
- Remains simple and uncluttered

## Structure Overview

The header is divided into **three sections**, laid out using Flexbox:

1. **Logo Section (Left)**
2. **Navigation Links (Center)**
3. **Call-to-Action Button (Right)**

[ Logo ] [ OUR TEAM | EVENTS | SPONSORS | CONTACT US ] [ Join Us ]

## Implementation

```tsx
import Header from "./components/Header";

<Header />;
```

The Header component requires no props and can be used directly. Import it and place it at the top of your page layout to display the navigation bar with logo, links, and CTA button.

### Recommended Layout usage

For consistency, the `Header` should be placed inside a shared layout component where possible:

```tsx
import Header from "./components/Header";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
};

export default PageLayout;
```

## When to Use

Use the Header component on:

- Public-facing informational pages

Do not use the header on:

- Standalone landing pages (unless specified in Figma)
- Experimental or one-off layouts without design approval
