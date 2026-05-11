# FAQ

Frequently asked questions about the Bounded Contexts architecture.

---

## General

### Why feature-based and not layer-based?

Layer-based organization (`components/`, `hooks/`, `services/`) groups files by what they are. Feature-based organization groups files by what they do.

When you work on a feature, you work in one place. When you delete a feature, you delete one folder. When you onboard someone new, they can understand an entire feature without jumping across the codebase.

Layer-based structures also tend to accumulate cross-feature imports over time, creating invisible coupling that makes refactoring painful.

---

### Can features import from each other?

Only when strictly necessary. The goal is zero cross-feature coupling.

If two features genuinely share a concept, ask: should this concept live in `shared/`? If it is domain-specific but shared, consider whether it deserves its own feature — for example, a `notifications/` feature that both `influencer/` and `revenue/` use.

When cross-feature imports are unavoidable, import only from the feature's `index.ts`, never from internal paths.

---

### What is the difference between shared/ and a utility library?

`shared/` is part of your application. It contains components, hooks, and utilities that are specific to your project's design system but agnostic to any domain.

A utility library (like `date-fns` or `lodash`) is a third-party dependency. Both are fine to use — they serve different purposes.

---

## Server and Client Components

### Why Server Components by default?

Server Components run on the server, which means:

- They can access databases and services directly
- They never send their code to the browser (smaller bundle)
- They can fetch data without network waterfalls
- They are faster for the initial render

Adding `"use client"` should be a deliberate choice, not a default.

---

### What actually requires "use client"?

Only these cases justify `"use client"`:

- `useState` or `useReducer` — managing local component state
- `useEffect` — running side effects after render
- Browser APIs — `window`, `document`, `navigator`, `localStorage`
- Event handlers with local logic — `onClick` that updates local state
- Third-party libraries that use any of the above

If your component just renders data passed via props, it does not need `"use client"`.

---

### Can a Server Component import a Client Component?

Yes — and this is the core pattern of this architecture. The Server Component fetches data and passes it as props to the Client Component.

```typescript
// Server Component
export async function InfluencerCard({ id }) {
  const data = await fetch(...)
  return <InfluencerCardClient data={data} /> // ✅ passes data as props
}
```

---

### Can a Client Component import a Server Component?

No — this creates a boundary violation. Once you are in a Client Component subtree, all children are treated as Client Components. Importing a Server Component inside a Client Component turns it into a Client Component silently.

The workaround is to pass Server Components as `children` or `props` to Client Components:

```typescript
// ✅ CORRECT: pass as children
<ClientWrapper>
  <ServerComponent /> {/* still renders as SC */}
</ClientWrapper>

// ❌ WRONG: import inside client
"use client"
import { ServerComponent } from "./ServerComponent" // now a CC
```

---

### Why the .client.tsx suffix?

It makes the rendering environment visible at a glance. When you see a file ending in `.client.tsx`, you immediately know it runs in the browser, has access to state and effects, and should not be doing data fetching.

Without the suffix, you have to open the file and look for `"use client"` to understand its rendering context.

---

## Data Fetching

### Why does each Server Component fetch its own data?

This enables true parallel loading. When multiple Server Components on the same page fetch independently, they all start at the same time. If one is slow, the others are not blocked.

Fetching everything in `page.tsx` and passing it down as props creates a waterfall: the page waits for all data before rendering anything.

---

### What about request deduplication?

Next.js automatically deduplicates identical `fetch` requests within a single render pass. If two Server Components call `fetch("https://api.example.com/influencers/123")` with the same URL, only one HTTP request is made.

For database queries (Prisma, Drizzle), use React's `cache()` function to achieve the same effect:

```typescript
import { cache } from "react"

export const getInfluencerById = cache(async (id: string) => {
  return prisma.influencer.findUnique({ where: { id } })
})
```

---

### When is it acceptable to fetch in a Client Component?

For interactive, user-triggered queries — not initial data load. Examples:

- Autocomplete that fetches as the user types
- "Load more" pagination triggered by a button
- Real-time data that needs to refresh on demand

For these cases, use `useSWR` or `@tanstack/react-query` inside the Client Component. The initial data still comes from the Server Component as a prop — the client-side hook handles updates.

---

## Suspense

### Why not use loading.tsx?

`loading.tsx` wraps the entire `page.tsx` in a single Suspense boundary. This means the whole page shows a loading state until every Server Component on the page finishes fetching.

Granular Suspense boundaries let each component load independently. The user sees content appear progressively, which is a significantly better experience.

---

### Every component needs a Skeleton?

Every Server Component that fetches data needs a Skeleton. Components that only receive props and render synchronously do not.

---

### Can I nest Suspense boundaries?

Yes. A Server Component can render another Server Component with its own Suspense boundary. This allows deep, granular control over loading states at every level of the tree.

---

## Skeletons

### Can Skeletons use "use client"?

Yes — this is explicitly allowed. Skeletons have no data fetching and no business logic. If a shimmer animation requires `useEffect` or a browser API, the `.client.tsx` suffix is appropriate.

---

### Where does the Skeleton base component live?

In `shared/components/Skeleton.tsx`. Feature Skeletons compose from this base:

```typescript
// shared/components/Skeleton.tsx — base animated block
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded-md", className)} />
}

// features/influencer/components/InfluencerCardSkeleton.tsx — feature-specific
import { Skeleton } from "@shared/components/Skeleton"

export function InfluencerCardSkeleton() {
  return (
    <div>
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-32 mt-2" />
    </div>
  )
}
```
