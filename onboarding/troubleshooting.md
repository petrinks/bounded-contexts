# Troubleshooting

Common errors and how to fix them.

---

## "You're importing a component that needs useState. It only works in a Client Component but none of its parents are marked with 'use client'."

**Cause:** A Server Component is importing a component that uses `useState`, `useEffect`, or another client-only API without `"use client"`.

**Fix:** Add `"use client"` to the component file — and make sure the file uses the `.client.tsx` suffix:

```typescript
// ✅ CORRECT
// InfluencerCard.client.tsx
"use client"

import { useState } from "react"

export function InfluencerCardClient() {
  const [liked, setLiked] = useState(false)
  // ...
}
```

If the component is in `shared/` and you added `"use client"` to the main file, consider creating a `.client.tsx` sibling instead to preserve the Server version.

---

## "async/await is not yet supported in Client Components"

**Cause:** You added `"use client"` to a component that uses `async/await` for data fetching.

**Fix:** Data fetching belongs in Server Components. Remove `"use client"`, remove the `async` keyword from the Client Component, and create a Server Component wrapper that fetches and passes data as props:

```typescript
// ❌ WRONG
"use client"
export async function InfluencerCard({ id }) {
  const data = await fetch(...) // can't do this in a CC
}

// ✅ CORRECT: split into two files
// InfluencerCard.tsx (Server Component)
export async function InfluencerCard({ id }) {
  const data = await fetch(...)
  return <InfluencerCardClient data={data} />
}

// InfluencerCard.client.tsx
"use client"
export function InfluencerCardClient({ data }) {
  // handle interactivity here
}
```

---

## Server Component is rendering stale data

**Cause:** Next.js caches `fetch` responses aggressively. Your data is fresh on first load but stale on subsequent visits.

**Fix:** Configure the correct caching strategy for your use case:

```typescript
// Revalidate every 60 seconds (ISR)
const res = await fetch(url, { next: { revalidate: 60 } })

// Always fetch fresh (no cache)
const res = await fetch(url, { cache: "no-store" })

// Cache indefinitely until manually invalidated
const res = await fetch(url, { next: { tags: ["influencer"] } })

// Invalidate by tag from a Server Action
import { revalidateTag } from "next/cache"
revalidateTag("influencer")
```

---

## Two Server Components are fetching the same data twice

**Cause:** Two components call the same endpoint independently, resulting in two HTTP requests.

**Fix 1:** Use Next.js automatic `fetch` deduplication. If both components call the exact same URL with the same options, Next.js deduplicates automatically within a single render.

**Fix 2:** For database queries, wrap with React `cache()`:

```typescript
// features/influencer/services/influencer.service.ts
import { cache } from "react"

export const getInfluencerById = cache(async (id: string) => {
  return prisma.influencer.findUnique({ where: { id } })
})
```

Now if two Server Components call `getInfluencerById("123")` in the same render, only one database query runs.

---

## Suspense fallback never shows — page just blocks

**Cause:** The component is not async, so React does not suspend. Or the Suspense boundary is missing.

**Fix:** Make sure the Server Component is `async` and the Suspense boundary wraps it in `page.tsx`:

```typescript
// ✅ Server Component must be async to trigger Suspense
export async function InfluencerCard({ id }) {
  const data = await influencerService.getById(id) // this suspends
  return <InfluencerCardClient data={data} />
}

// ✅ Suspense must wrap the component in page.tsx
<Suspense fallback={<InfluencerCardSkeleton />}>
  <InfluencerCard id={id} />
</Suspense>
```

---

## "Cannot import a Server Component from a Client Component"

**Cause:** A `.client.tsx` file is directly importing a Server Component.

**Fix:** Pass the Server Component as `children` or a prop instead of importing it:

```typescript
// ❌ WRONG
"use client"
import { ServerComponent } from "./ServerComponent"

export function ClientWrapper() {
  return <ServerComponent /> // turns SC into CC silently
}

// ✅ CORRECT: pass as children from a Server Component parent
// ParentServerComponent.tsx
export function ParentServerComponent() {
  return (
    <ClientWrapper>
      <ServerComponent /> {/* rendered by the server */}
    </ClientWrapper>
  )
}

// ClientWrapper.client.tsx
"use client"
export function ClientWrapper({ children }) {
  return <div>{children}</div>
}
```

---

## "Module not found: @features/..."

**Cause:** Path aliases are not configured in `tsconfig.json` or `next.config.js`.

**Fix:** Add the aliases to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

---

## shared/ component is accidentally importing from features/

**Cause:** A shared component has a domain-specific dependency that crept in over time.

**Fix:** Remove the domain logic from `shared/`. Two options:

1. Move the logic to the feature that needs it and compose from there
2. Pass the domain-specific behavior as a prop/callback to keep `shared/` generic

```typescript
// ❌ WRONG: shared/ knows about Influencer
// shared/components/AvatarCard.tsx
import { influencerService } from "@features/influencer/services" // bad!

// ✅ CORRECT: generic, receives data as prop
// shared/components/AvatarCard.tsx
interface Props {
  name: string
  imageUrl: string
  subtitle?: string
}

export function AvatarCard({ name, imageUrl, subtitle }: Props) {
  return (
    <div>
      <img src={imageUrl} alt={name} />
      <h3>{name}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}

// features/influencer/components/InfluencerAvatar.tsx
import { AvatarCard } from "@shared/components/AvatarCard"

export async function InfluencerAvatar({ id }) {
  const influencer = await influencerService.getById(id)
  return (
    <AvatarCard
      name={influencer.name}
      imageUrl={influencer.avatarUrl}
      subtitle={`${influencer.followers} followers`}
    />
  )
}
```

---

## TypeScript is not picking up types from feature index

**Cause:** The feature `index.ts` is not exporting the type, or the import path is wrong.

**Fix:** Make sure the type is exported from the feature index:

```typescript
// features/influencer/index.ts
export type { Influencer } from "./types/influencer.types" // ✅ explicit re-export
```

And import it correctly:

```typescript
import type { Influencer } from "@features/influencer"
```
