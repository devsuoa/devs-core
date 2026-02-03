# Pagination Component

The **Pagination** component provides a user-friendly interface for navigating through paginated content. It displays page numbers, ellipsis for skipped pages, and navigation controls with responsive design support.

## Purpose

Use this component to:

- Navigate through multi-page content efficiently
- Provide clear visual feedback about the current page
- Offer quick access to first/last pages
- Adapt the pagination display based on screen size
- Reduce cognitive load with smart page number truncation

## Use Cases

- **Events listing**: Navigate through multiple pages of events
- **Member registry**: Browse paginated member lists
- **Task management**: View tasks across multiple pages
- **Any paginated data view**: General-purpose pagination for large datasets

## Usage

### Basic Example

```tsx
import Pagination from "@/components/Pagination";

const [currentPage, setCurrentPage] = useState(0);
const totalPages = 10;

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={(page) => setCurrentPage(page)}
/>;
```

### In a Data List

```tsx
const EventsList = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 9;
  const totalPages = Math.ceil(events.length / itemsPerPage);

  const currentEvents = events.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div>
      {currentEvents.map((event) => (
        <EventCard key={event.id} {...event} />
      ))}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};
```

## Props

| Prop           | Type                     | Required | Description                                                  |
| -------------- | ------------------------ | -------- | ------------------------------------------------------------ |
| `currentPage`  | `number`                 | Yes      | Zero-indexed current page number (0 = first page)            |
| `totalPages`   | `number`                 | Yes      | Total number of pages available                              |
| `onPageChange` | `(page: number) => void` | Yes      | Callback function triggered when the user selects a new page |

## How It Works

### Adaptive Page Display

The component uses the `getPaginationItems` helper function to intelligently determine which page numbers to show:

- **Small page count** (≤4 on mobile, ≤7 on desktop): Shows all pages without ellipsis
- **Near the end** (within last 3 pages): Displays the final 4 pages
- **Middle pages**: Shows current page, next page, ellipsis, and last page

This ensures the pagination stays compact while providing intuitive navigation.

### Responsive Design

- **Desktop**: Full spacing and larger touch targets
- **Mobile**: Condensed layout with adjusted padding
- Screen size detection adapts the maximum visible pages (4 on mobile, 7 on desktop)

### Navigation Controls

- **Arrow buttons**: Previous/Next page navigation (disabled at boundaries)
- **Page numbers**: Direct navigation to specific pages
- **First/Last buttons**: Quick jump to beginning or end
- **Current page indicator**: Highlighted with bold text and accent color

### State Management

The component is **stateless** and relies on the parent to manage `currentPage`. Changes are communicated via the `onPageChange` callback, allowing flexible integration with various state management solutions.

## Styling & Customization

The component uses:

- **Tailwind CSS** for responsive layout and spacing
- `.pagination-link` class for consistent button styling
- `.pagination-break-link` class for ellipsis display
- Accent color `#6b7fd7` for hover states and active page
- Disabled states with reduced opacity for boundary controls

All buttons include proper `aria-label` attributes for accessibility.
