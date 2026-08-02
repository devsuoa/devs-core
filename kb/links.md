# Links Management

The **Links Management** system provides a way to manage and display active links on the public Links page, similar to Linktree. Admins can control which links are visible and when they're active using date ranges.

## Purpose

- Display active links on a public `/links` page
- Allow admins to manage links with date-based activation
- Show favicons automatically for each link
- Control link visibility with start and end dates

## Database Setup

### Table Fields

- **id** (UUID): Primary key, auto-generated
- **title** (TEXT): Display name for the link (required)
- **url** (TEXT): Full URL to the link (required)
- **is_active** (BOOLEAN): Whether the link is active (default: true)
- **active_from** (TIMESTAMPTZ): Optional start date for when link becomes active
- **active_to** (TIMESTAMPTZ): Optional end date for when link becomes inactive
- **display_order** (INTEGER): Order in which links are displayed (lower numbers appear first)
- **is_spacer** (BOOLEAN): Whether this is a spacer/divider (not a clickable link)
- **created_at** (TIMESTAMPTZ): Timestamp when link was created
- **updated_at** (TIMESTAMPTZ): Timestamp when link was last updated

## Pages

### Links Page

**Route:** `/links`

**Component:** `src/pages/Links.tsx`

**Features:**

- Displays all currently active links
- Shows favicons automatically fetched from Google's favicon service
- Linktree-style layout with clickable link cards
- Filters links based on:
  - `is_active` flag
  - Current date vs `active_from` and `active_to` dates
- Public access (no authentication required)

**Link Activation Logic:**

- A link is considered active if:
  1. `is_active` is `true`
  2. Current date >= `active_from` (if `active_from` is set)
  3. Current date <= `active_to` (if `active_to` is set)

### Manage Links Page

**Route:** `/admin/manage-links`

**Component:** `src/pages/admin/ManageLinks.tsx`

**Features:**

- **Admin authentication required** - Uses `useAdminDashboard` hook
- Add new links with title, URL, active status, and date ranges
- Add spacers/dividers between links (with optional title)
- Edit existing links and spacers
- Delete links and spacers with confirmation
- Reorder links and spacers using up/down buttons
- View all links with their current status (ACTIVE/INACTIVE)
- See date ranges for each link
- Toggle active status for links and spacers
- Proper spacing and layout with overflow prevention

**Form Fields:**

- **This is a spacer/divider** (checkbox): Check to create a spacer instead of a link
- **Title** (required for links, optional for spacers): Display name for the link or spacer title
- **URL** (required for links, hidden for spacers): Full URL (must be valid URL format)
- **Active** (checkbox): Whether the link/spacer is active
- **Active From** (optional): Date when link/spacer becomes active
- **Active To** (optional): Date when link/spacer becomes inactive

## Controllers

### linksController.ts

Located at `src/lib/linksController.ts`, provides:

**Functions:**

- `fetchActiveLinks()`: Fetches and filters currently active links (ordered by display_order)
- `fetchAllLinks()`: Fetches all links (for admin, ordered by display_order)
- `createLink()`: Creates a new link (auto-assigns display_order if not provided)
- `updateLink()`: Updates an existing link
- `deleteLink()`: Deletes a link
- `reorderLinks()`: Swaps display_order of two links
- `getFaviconUrl()`: Generates favicon URL from domain
- `isLinkCurrentlyActive()`: Checks if a link is currently active

**Hooks:**

- `useLinksManagement()`: Hook for admin pages to manage links (includes `reorderLink` function)
- `useActiveLinks()`: Hook for public pages to display active links

## Favicon Service

The system uses Google's favicon service to automatically fetch favicons:

```
https://www.google.com/s2/favicons?domain={domain}&sz=64
```

Favicons are fetched based on the domain extracted from the link URL.

## Security

- **Row Level Security (RLS)** is enabled on the `links` table
- Public read access for displaying links
- Admin-only write access (insert, update, delete)
- Admin authentication verified through `profiles.role = 'admin'`

## Usage Examples

### Adding a Link

1. Navigate to `/admin/manage-links`
2. Click "Add New Link"
3. Fill in:
   - Title: "Sign up to be a DEVS member"
   - URL: "https://example.com/signup"
   - Active: ✓ (checked)
   - Active From: (optional) 2025-01-01
   - Active To: (optional) 2025-12-31
4. Click "Add Link"

### Viewing Active Links

1. Navigate to `/links`
2. All currently active links are displayed
3. Click any link to open it in a new tab

## Spacers/Dividers

Spacers allow you to add visual breaks or section headers between links:

- **Creating a Spacer**: Click "Add Spacer" button or check "This is a spacer/divider" when adding/editing
- **Spacer Title**: Optional - leave empty for a blank space, or add text like "Photos! 📷" for a section header
- **Display**: Spacers appear as dashed-border boxes with optional title text
- **Reordering**: Spacers can be reordered just like regular links
- **Active Status**: Spacers respect the same active/inactive and date range settings as links

## Reordering Links

Links and spacers can be reordered using the up/down arrow buttons on the Manage Links page:

- Click the ↑ button to move a link/spacer up in the list
- Click the ↓ button to move a link/spacer down in the list
- The first item cannot be moved up, and the last item cannot be moved down
- Reordering updates the `display_order` field in the database
- Items are displayed in order on both the public Links page and the Manage Links page

## Future Enhancements

- [ ] Link click analytics
- [ ] Bulk import/export
- [ ] Link preview/description
- [ ] Social media link icons
