# Social Link Component

The **Social Links** component provides a consistent social links section for pages across the website.  
It displays all the social links in a fixed layout

## Purpose

Use this component to:
- Maintain consistent Social media links
- Reduce layout duplication across pages


## Usage
### Basic Example

```tsx
import { SocialLinks } from "@/components/SocialLinks"

<SocialLinks />
```

### Optionally remove social links
```tsx
<SocialLinks 
    facebook={false}
/>
```

## Props

| Prop        | Type     | Required | Description                                                                  |
| ----------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `instagram`     | `boolean` | No      | If you want to display the Instagram logo or not                                |
| `facebook`     | `boolean` | No      | If you want to display the Facebook logo or not |
| `linkedin`   | `boolean` | No       | If you want to display the LinkedIn logo or not                           |

| `className` | `string` | No       | Additional Tailwind classes for layout customization                         |

## Styling & Customization

You can extend or override layout styles using the className prop:

```tsx
<SocialLinks
  className="mt-[80vh]"
/>
```

The component uses:
- Tailwind CSS for layout and spacing

## When to Use

Use this component when:
- Displaying social media icons on a page
- Consistent branding and spacing are required