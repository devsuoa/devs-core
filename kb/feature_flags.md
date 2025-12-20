# Feature Flags

Everything merged into `main` is **automatically deployed to production**.
Sometimes we need to merge work that **isn’t ready to be public yet**.

Feature flags let us safely ship code without exposing unfinished features.

## Where feature flags are set

Feature flags are defined in:

```
src/config/feature-flags.json
```

Each flag controls whether a feature, page, or section of the site is accessible.


## When to use a feature flag

Use a feature flag when:

* A page is incomplete
* A feature is under development
* Something should only be visible later
* You need to temporarily disable access without reverting code



## How to use a feature flag

### 1. Import the required helpers

```tsx
import { useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '../lib/featureFlags';
import { onPageNotFound } from '../lib/pageNotFoundController';
```



### 2. Gate the feature at the very start of the component

```tsx
  const navigate = useNavigate();
  if (!isFeatureEnabled('your_feature_flag')) {
    onPageNotFound();
    return null;
  }
```



## Important rules ⚠️

* **This check must be the first thing inside your component**
* Do **not** place it:
  * After hooks
  * Inside conditionals
  * Inside TSX
* Always return `null` after calling `onPageNotFound()`

Failing to do this can cause:

* UI flashes
* Hooks running when they shouldn’t
* Unexpected navigation bugs



## Example

```tsx
const Links: React.FC = () => {
  const navigate = useNavigate();
  if (!isFeatureEnabled('links_page_is_enabled')) {
    onPageNotFound();
    return null;
  }

  // normal component logic below
};
```



## Naming conventions

Feature flag names should:

* Be descriptive
* End with `_is_enabled`
* Match the feature or page they control

**Examples**

* `links_page_is_enabled`
* `events_page_is_enabled`
* `admin_dashboard_is_enabled`
