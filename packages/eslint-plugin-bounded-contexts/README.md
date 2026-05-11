# eslint-plugin-bounded-contexts

ESLint rules for the [Bounded Contexts](https://github.com/petrinks/bounded-contexts) feature-based Next.js architecture.

Enforces architectural boundaries between `app/`, `features/`, and `shared/` — preventing the accidental coupling, misplaced files, and Server/Client Component mistakes that tend to sneak into Next.js codebases over time.

## Installation

```bash
npm install --save-dev eslint-plugin-bounded-contexts
```

## Usage

### Recommended config (quickest setup)

```js
// .eslintrc.js
module.exports = {
  plugins: ["bounded-contexts"],
  extends: ["plugin:bounded-contexts/recommended"],
}
```

### Strict config (all rules as errors)

```js
module.exports = {
  plugins: ["bounded-contexts"],
  extends: ["plugin:bounded-contexts/strict"],
}
```

### Manual config (pick your rules)

```js
module.exports = {
  plugins: ["bounded-contexts"],
  rules: {
    "bounded-contexts/enforce-client-suffix": "error",
    "bounded-contexts/no-import-features-from-shared": "error",
    "bounded-contexts/no-fetch-in-client-component": "warn",
    "bounded-contexts/no-global-folders": "error",
    "bounded-contexts/no-cross-feature-imports": "warn",
  },
}
```

---

## Rules

| Rule | Recommended | Strict | Description |
|---|---|---|---|
| [`enforce-client-suffix`](#enforce-client-suffix) | error | error | Files with `"use client"` must use `.client.tsx` |
| [`no-import-features-from-shared`](#no-import-features-from-shared) | error | error | `shared/` must not import from `features/` |
| [`no-fetch-in-client-component`](#no-fetch-in-client-component) | warn | error | Client Components must not call `fetch()` |
| [`no-global-folders`](#no-global-folders) | error | error | No global `components/`, `hooks/`, `services/` at `src/` root |
| [`no-cross-feature-imports`](#no-cross-feature-imports) | warn | error | Features must import from other features' index only |

---

### enforce-client-suffix

Files containing `"use client"` must use the `.client.tsx` (or `.client.ts`) suffix. This makes the rendering environment visible at a glance without opening the file.

```tsx
// ❌ BAD — "use client" in a file without the suffix
// Button.tsx
"use client"
export function Button() { ... }

// ✅ GOOD — suffix matches the directive
// Button.client.tsx
"use client"
export function Button() { ... }
```

---

### no-import-features-from-shared

`shared/` must never import from `features/`. This enforces the unidirectional dependency rule: `app/ → features/ → shared/`.

```tsx
// ❌ BAD — shared importing from a feature
// shared/components/Card.tsx
import { influencerService } from "@features/influencer/services"

// ✅ GOOD — shared only uses other shared code
// shared/components/Card.tsx
import { cn } from "@shared/utils/cn"
```

Options:

```js
"bounded-contexts/no-import-features-from-shared": ["error", {
  sharedDir: "shared",    // default: "shared"
  featuresDir: "features" // default: "features"
}]
```

---

### no-fetch-in-client-component

Client Components (`.client.tsx`) must not call `fetch()` directly or fetch inside `useEffect`. Data fetching belongs in Server Components.

```tsx
// ❌ BAD — fetching in a Client Component
// InfluencerCard.client.tsx
"use client"
export function InfluencerCard({ id }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/api/influencers/${id}`).then(r => r.json()).then(setData)
  }, [id])
  return <div>{data?.name}</div>
}

// ✅ GOOD — Server Component fetches, Client Component receives props
// InfluencerCard.tsx (Server Component)
export async function InfluencerCard({ id }) {
  const data = await fetch(`/api/influencers/${id}`).then(r => r.json())
  return <InfluencerCardClient data={data} />
}

// InfluencerCard.client.tsx
"use client"
export function InfluencerCardClient({ data }) {
  return <div>{data.name}</div>
}
```

> **Note:** Interactive client-side fetching (autocomplete, load more) is a valid exception. Consider `useSWR` or `@tanstack/react-query` for those cases.

---

### no-global-folders

Disallows files in global `components/`, `hooks/`, `services/`, `utils/`, or `types/` folders at the `src/` root level. All code must live inside `features/` or `shared/`.

```
// ❌ BAD
src/components/InfluencerCard.tsx
src/hooks/useInfluencer.ts
src/services/api.ts

// ✅ GOOD
src/features/influencer/components/InfluencerCard.tsx
src/features/influencer/hooks/useInfluencer.ts
src/shared/components/Button.tsx
```

Options:

```js
"bounded-contexts/no-global-folders": ["error", {
  srcDir: "src",
  forbiddenFolders: ["components", "hooks", "services", "utils", "types"]
}]
```

---

### no-cross-feature-imports

Features must not import from other features' internal paths. When cross-feature imports are necessary, they must go through the feature's `index.ts`.

```tsx
// ❌ BAD — importing from another feature's internals
// features/influencer/components/InfluencerCard.tsx
import { revenueService } from "@features/revenue/services/revenue.service"

// ✅ GOOD — importing from the feature's public index
// features/influencer/components/InfluencerCard.tsx
import { RevenueChart } from "@features/revenue"
```

Options:

```js
"bounded-contexts/no-cross-feature-imports": ["warn", {
  featuresDir: "features" // default: "features"
}]
```

---

## License

MIT
