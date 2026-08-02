# Universal Design Guidelines

These guidelines define the **visual, typographic, and component standards for the DEVS website. They are to ensure **consistency, accessibility, and scalability across all pages and features.

The website is built using **React, TypeScript, and Tailwind CSS**.
All major UI patterns should be implemented as **reusable components**.
Final design mockups must be approved in **Figma** before development.

## Design Principles

- **Consistency first** – reuse existing components and patterns
- **Clarity over decoration** – visuals should support content, not distract
- **Accessible by default** – meet standard contrast and readability standards
- **Modular & scalable** – components should be composable and easy to extend
- **Developer-friendly** – styles should map cleanly to Tailwind utilities

## Colour Palette

Use the following colours exactly as defined. Do not introduce new colours unless approved.

### Primary Brand Colours

| Colour       | Hex       | Usage                         | Preview                                                                                                                                                           |
| ------------ | --------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pink         | `#EB75C5` | Highlights, accents, callouts | <span style="display:inline-block;width:2em;height:1em;background:#EB75C5;border:1px solid #bbb;border-radius:4px;vertical-align:middle;margin-left:.5em"></span> |
| Purple       | `#9D4CB7` | Secondary accents, gradients  | <span style="display:inline-block;width:2em;height:1em;background:#9D4CB7;border:1px solid #bbb;border-radius:4px;vertical-align:middle;margin-left:.5em"></span> |
| Light Purple | `#9060F0` | Links, interactive states     | <span style="display:inline-block;width:2em;height:1em;background:#9060F0;border:1px solid #bbb;border-radius:4px;vertical-align:middle;margin-left:.5em"></span> |
| Deep Purple  | `#622ACB` | Primary buttons, emphasis     | <span style="display:inline-block;width:2em;height:1em;background:#622ACB;border:1px solid #bbb;border-radius:4px;vertical-align:middle;margin-left:.5em"></span> |

### Supporting Colours

| Colour     | Hex       | Usage                     | Preview                                                                                                                                                           |
| ---------- | --------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Light Blue | `#B8C0E7` | Backgrounds, cards        | <span style="display:inline-block;width:2em;height:1em;background:#B8C0E7;border:1px solid #bbb;border-radius:4px;vertical-align:middle;margin-left:.5em"></span> |
| Blue       | `#6E80DA` | Secondary buttons, icons  | <span style="display:inline-block;width:2em;height:1em;background:#6E80DA;border:1px solid #bbb;border-radius:4px;vertical-align:middle;margin-left:.5em"></span> |
| Navy       | `#19276F` | Headings, strong emphasis | <span style="display:inline-block;width:2em;height:1em;background:#19276F;border:1px solid #bbb;border-radius:4px;vertical-align:middle;margin-left:.5em"></span> |
| Dark Navy  | `#0C1439` | Footer, dark sections     | <span style="display:inline-block;width:2em;height:1em;background:#0C1439;border:1px solid #bbb;border-radius:4px;vertical-align:middle;margin-left:.5em"></span> |

### Usage Rules

- Text must maintain **AA contrast** against backgrounds
- Avoid using pink or purple for long body text
- Prefer white navy for readable text
- Gradients may be used sparingly using brand colours only

## Typography

### Headings (Primary)

**Silkscreen**

- Used for: Hero titles, major section headings
- Usage:
  - Keep text short
  - Avoid long sentences or paragraphs

### Headings (Secondary)

**Pixelify Sans**

- Used for: Sub-headings, labels, UI section titles
- Usage:
  - Works well for navigation and card headers
  - Avoid for body text

### Body Text

**Rethink Sans**

- Used for: Paragraphs, descriptions, long-form content
- Usage:
  - Default font for all readable content

## Layout & Spacing

- Use **Tailwind spacing scale only** (`p-4`, `gap-6`, etc.)
- Consistent vertical rhythm:
  - Section spacing: `py-16` or `py-24`
  - Card spacing: `p-6` or `p-8`
- Avoid arbitrary values unless absolutely necessary

## Component-First Design

All UI elements should be built as **reusable components**.

## Accessibility Standards

- All interactive elements must be keyboard accessible
- Visible focus states (do not remove outlines)
- Semantic HTML first (`<button>`, `<nav>`, `<main>`)
- Icons must include accessible labels when needed

## Tailwind Best Practices

- Avoid large custom CSS files
- Prefer utility classes over custom styles

## React & TypeScript Guidelines

- Prefer small, focused components
- Props should be explicit and documented using JSDoc
- Keep UI logic separate from data logic

## Figma → Code Workflow

1. Design created in Figma
2. Reviewed and approved by design team
3. Components mapped directly to React components
4. Colours and fonts must match this guide exactly
5. No visual changes without Figma updates

## What Not To Do

- Do not introduce new fonts
- Do not add random colours
- Do not hardcode styles repeatedly
- Do not bypass components for one-off designs
- Do not ship UI without design approval
