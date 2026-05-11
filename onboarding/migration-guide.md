# Migration Guide

How to migrate an existing Next.js project to the Bounded Contexts architecture.

---

## Before You Start

Migration does not need to happen all at once. The best strategy is to migrate feature by feature, keeping the old structure intact while new code follows the new architecture. Over time, old files get refactored as you touch them.

**Principles for a smooth migration:**

- Never migrate everything at once — it leads to broken states
- Start with one isolated feature, prove the pattern, then expand
- Keep old files working while you build the new structure alongside them
- Use feature flags or parallel routes if needed during transition

---

## Step 1: Audit Your Current Structure

Before moving anything, map out what you have.

Typical "global folder" structure that needs migrating:

```
src/
├── components/
│   ├── InfluencerCard.tsx       ← has business logic
│   ├── RevenueChart.tsx         ← has business logic
│   ├── Button.tsx               ← truly shared
│   ├── Modal.tsx                ← truly shared
│   └── DashboardLayout.tsx      ← platform concern
│
├── hooks/
│   ├── useInfluencer.ts         ← domain-specific
│   ├── useRevenue.ts            ← domain-specific
│   └── useDebounce.ts           ← truly shared
│
├── services/
│   ├── influencer.service.ts    ← belongs in feature
│   └── revenue.service.ts       ← belongs in feature
│
└── types/
    ├── influencer.ts            ← belongs in feature
    └── common.ts                ← shared
```

For each file, ask two questions:

1. Does this contain domain knowledge (Influencer, Revenue, Auth)? → `features/`
2. Is this purely generic and reusable across domains? → `shared/`

---

## Step 2: Create the New Structure

Create the new folders without moving anything yet:

```bash
mkdir -p src/features/influencer/components
mkdir -p src/features/influencer/services
mkdir -p src/features/influencer/hooks
mkdir -p src/features/influencer/types

mkdir -p src/features/revenue/components
mkdir -p src/features/revenue/services
mkdir -p src/features/revenue/types

mkdir -p src/shared/components
mkdir -p src/shared/hooks
mkdir -p src/shared/utils
mkdir -p src/shared/types
```

---

## Step 3: Migrate Shared Files First

Start with files that have no domain knowledge — they are the safest to move because nothing depends on them having business logic.

```bash
# Move truly shared components
mv src/components/Button.tsx src/shared/components/Button.tsx
mv src/components/Modal.tsx src/shared/components/Modal.tsx
mv src/hooks/useDebounce.ts src/shared/hooks/useDebounce.ts
mv src/types/common.ts src/shared/types/common.types.ts
```

Update imports everywhere these files are used. Most editors have a global find-and-replace that handles this.

---

## Step 4: Migrate One Feature at a Time

Pick your simplest, most isolated feature and migrate it completely before touching others.

### 4a. Move the service

```bash
mv src/services/influencer.service.ts src/features/influencer/services/influencer.service.ts
```

### 4b. Move the types

```bash
mv src/types/influencer.ts src/features/influencer/types/influencer.types.ts
```

### 4c. Move domain hooks

```bash
mv src/hooks/useInfluencer.ts src/features/influencer/hooks/useInfluencer.ts
```

### 4d. Migrate the component

The biggest change happens here. If your current component fetches data via `useEffect` (Client Component), you need to split it into a Server Component wrapper and a Client Component:

**Before** (typical pattern):

```typescript
// src/components/InfluencerCard.tsx
"use client"

import { useState, useEffect } from "react"

export function InfluencerCard({ id }: { id: string }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/influencers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div>Loading...</div>

  return <div>{data?.name}</div>
}
```

**After** (Bounded Contexts pattern):

```typescript
// src/features/influencer/components/InfluencerCard.tsx (Server Component)
import { influencerService } from "../services/influencer.service"
import { InfluencerCardClient } from "./InfluencerCard.client"

export async function InfluencerCard({ id }: { id: string }) {
  const data = await influencerService.getById(id)
  return <InfluencerCardClient data={data} />
}

// src/features/influencer/components/InfluencerCard.client.tsx
"use client"

import type { Influencer } from "../types/influencer.types"

export function InfluencerCardClient({ data }: { data: Influencer }) {
  return <div>{data.name}</div>
}

// src/features/influencer/components/InfluencerCardSkeleton.tsx
import { Skeleton } from "@shared/components/Skeleton"

export function InfluencerCardSkeleton() {
  return <Skeleton className="h-24 w-full" />
}
```

### 4e. Create the feature index

```typescript
// src/features/influencer/index.ts
export { InfluencerCard } from "./components/InfluencerCard"
export { InfluencerCardSkeleton } from "./components/InfluencerCardSkeleton"
export type { Influencer } from "./types/influencer.types"
```

### 4f. Update the page.tsx

```typescript
// src/app/(dashboard)/influencers/[id]/page.tsx
import { Suspense } from "react"
import { InfluencerCard, InfluencerCardSkeleton } from "@features/influencer"

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<InfluencerCardSkeleton />}>
      <InfluencerCard id={params.id} />
    </Suspense>
  )
}
```

---

## Step 5: Repeat for Each Feature

Once you have proven the pattern with one feature, migrate the others following the same steps. The order should be:

1. Simplest, most isolated feature first
2. Features with no cross-feature dependencies
3. Features that others depend on (auth, platform) last

---

## Step 6: Clean Up

Once all features are migrated:

```bash
# Remove old global folders (only if empty or fully migrated)
rm -rf src/components
rm -rf src/hooks
rm -rf src/services
rm -rf src/types
```

---

## Common Migration Problems

### "My component uses both server data and client state"

Split it. The Server Component fetches and passes data as props. The Client Component handles all local state.

### "Two features use the same type"

If the type is truly shared (not domain-specific), move it to `shared/types/`. If it belongs to one domain, keep it in that feature and import from its index in the other feature — but question whether the cross-feature dependency is necessary.

### "I have a global state manager (Redux, Zustand) that many features depend on"

Keep the store configuration in a top-level `store/` or inside `features/platform/`. Each feature can have its own slice. The store itself is not a violation of the architecture — but avoid importing cross-feature slices directly. Use selectors exposed through each feature's index.

### "My useEffect fetches depend on user interaction (not initial load)"

This is a valid use case for fetching in a Client Component — for example, an autocomplete input that fetches as the user types. In this case:

- Keep the initial data fetch in the Server Component
- Use Client-side fetching only for triggered, interactive queries
- Consider using `useSWR` or `react-query` for these cases
