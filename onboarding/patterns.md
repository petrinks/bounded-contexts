# Patterns

Common implementation patterns for the Bounded Contexts architecture.

---

## Pattern 1: Server Component with Client Island

The most common pattern. A Server Component fetches data and renders a Client Component with that data as props.

```
FeatureCard.tsx (SC) → fetches data → passes as props → FeatureCard.client.tsx (CC)
```

```typescript
// features/influencer/components/InfluencerCard.tsx
import { InfluencerCardClient } from "./InfluencerCard.client"
import { influencerService } from "../services/influencer.service"

export async function InfluencerCard({ id }: { id: string }) {
  const influencer = await influencerService.getById(id)
  return <InfluencerCardClient data={influencer} />
}

// features/influencer/components/InfluencerCard.client.tsx
"use client"

import { useState } from "react"
import type { Influencer } from "../types/influencer.types"

export function InfluencerCardClient({ data }: { data: Influencer }) {
  const [followed, setFollowed] = useState(false)

  return (
    <div>
      <h2>{data.name}</h2>
      <p>{data.followers} followers</p>
      <button onClick={() => setFollowed(!followed)}>
        {followed ? "Unfollow" : "Follow"}
      </button>
    </div>
  )
}
```

---

## Pattern 2: Parallel Data Fetching with Suspense

Multiple Server Components on the same page fetch data independently. The `page.tsx` wraps each one in its own Suspense boundary.

```typescript
// app/(dashboard)/influencers/[id]/page.tsx
import { Suspense } from "react"
import { InfluencerCard, InfluencerCardSkeleton } from "@features/influencer"
import { RevenueChart, RevenueChartSkeleton } from "@features/revenue"
import { FollowersChart, FollowersChartSkeleton } from "@features/influencer"

interface Props {
  params: { id: string }
}

export default function Page({ params }: Props) {
  return (
    <main>
      <Suspense fallback={<InfluencerCardSkeleton />}>
        <InfluencerCard id={params.id} />
      </Suspense>

      <Suspense fallback={<RevenueChartSkeleton />}>
        <RevenueChart influencerId={params.id} />
      </Suspense>

      <Suspense fallback={<FollowersChartSkeleton />}>
        <FollowersChart influencerId={params.id} />
      </Suspense>
    </main>
  )
}
```

All three components fetch in parallel. If `RevenueChart` is slow, `InfluencerCard` and `FollowersChart` still render as soon as they're ready.

---

## Pattern 3: Service Layer

Data fetching logic lives in a service file inside the feature. This keeps components clean and makes logic testable.

```typescript
// features/influencer/services/influencer.service.ts
import type { Influencer } from "../types/influencer.types"

export const influencerService = {
  async getById(id: string): Promise<Influencer> {
    const res = await fetch(`${process.env.API_URL}/influencers/${id}`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      if (res.status === 404) throw new Error("NOT_FOUND")
      throw new Error("FETCH_ERROR")
    }

    return res.json()
  },

  async getAll(): Promise<Influencer[]> {
    const res = await fetch(`${process.env.API_URL}/influencers`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) throw new Error("FETCH_ERROR")
    return res.json()
  },
}
```

The Server Component calls the service, not `fetch` directly:

```typescript
// features/influencer/components/InfluencerCard.tsx
import { notFound } from "next/navigation"
import { influencerService } from "../services/influencer.service"

export async function InfluencerCard({ id }: { id: string }) {
  try {
    const data = await influencerService.getById(id)
    return <InfluencerCardClient data={data} />
  } catch (error) {
    if (error.message === "NOT_FOUND") notFound()
    throw error
  }
}
```

---

## Pattern 4: Shared Component Composition

Feature components compose from shared base components. Never modify `shared/` components to fit one feature — extend them inside the feature instead.

```typescript
// shared/components/LineChart.tsx
interface Props {
  data: unknown[]
  xKey: string
  yKey: string
  formatter?: (value: number) => string
}

export function LineChart({ data, xKey, yKey, formatter }: Props) {
  // generic chart implementation
}

// features/revenue/components/RevenueChart.client.tsx
"use client"

import { LineChart } from "@shared/components/LineChart"
import type { RevenueData } from "../types/revenue.types"

interface Props {
  data: RevenueData[]
}

export function RevenueChartClient({ data }: Props) {
  const formatter = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

  return (
    <LineChart
      data={data}
      xKey="month"
      yKey="revenue"
      formatter={formatter}
    />
  )
}
```

---

## Pattern 5: Feature Index Exports

Each feature exposes a public API through `index.ts`. External consumers (like `app/`) only import from the index, not from internal paths.

```typescript
// features/influencer/index.ts
export { InfluencerCard } from "./components/InfluencerCard"
export { InfluencerCardSkeleton } from "./components/InfluencerCardSkeleton"
export { InfluencerList } from "./components/InfluencerList"
export { InfluencerListSkeleton } from "./components/InfluencerListSkeleton"
export type { Influencer } from "./types/influencer.types"
```

```typescript
// app/(dashboard)/influencers/page.tsx
import { InfluencerList, InfluencerListSkeleton } from "@features/influencer"

// ✅ CORRECT: importing from feature index
// ❌ WRONG: importing from internal path
// import { InfluencerList } from "@features/influencer/components/InfluencerList"
```

---

## Pattern 6: Skeleton Composition

Feature Skeletons compose from the shared `Skeleton` base component.

```typescript
// shared/components/Skeleton.tsx
import { cn } from "@shared/utils/cn"

interface Props {
  className?: string
}

export function Skeleton({ className }: Props) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  )
}

// features/influencer/components/InfluencerCardSkeleton.tsx
import { Skeleton } from "@shared/components/Skeleton"

export function InfluencerCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}
```

---

## Pattern 7: Client-Only Hooks in Features

Hooks that manage client-side state live in the feature's `hooks/` folder.

```typescript
// features/influencer/hooks/useInfluencerFilter.ts
"use client"

import { useState, useMemo } from "react"
import type { Influencer } from "../types/influencer.types"

export function useInfluencerFilter(influencers: Influencer[]) {
  const [search, setSearch] = useState("")
  const [minFollowers, setMinFollowers] = useState(0)

  const filtered = useMemo(
    () =>
      influencers.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) &&
          i.followers >= minFollowers
      ),
    [influencers, search, minFollowers]
  )

  return { filtered, search, setSearch, minFollowers, setMinFollowers }
}
```

The hook is used inside a Client Component:

```typescript
// features/influencer/components/InfluencerList.client.tsx
"use client"

import { useInfluencerFilter } from "../hooks/useInfluencerFilter"
import type { Influencer } from "../types/influencer.types"

export function InfluencerListClient({ data }: { data: Influencer[] }) {
  const { filtered, search, setSearch } = useInfluencerFilter(data)

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search influencers..."
      />
      {filtered.map((influencer) => (
        <div key={influencer.id}>{influencer.name}</div>
      ))}
    </div>
  )
}
```

---

## Pattern 8: Error Handling

Handle errors at the Server Component level before passing data to the Client Component.

```typescript
// features/influencer/components/InfluencerCard.tsx
import { notFound } from "next/navigation"
import { influencerService } from "../services/influencer.service"
import { InfluencerCardClient } from "./InfluencerCard.client"

export async function InfluencerCard({ id }: { id: string }) {
  const data = await influencerService.getById(id)

  if (!data) notFound()

  return <InfluencerCardClient data={data} />
}
```

Add an `error.tsx` at the route level for unexpected errors:

```typescript
// app/(dashboard)/influencers/[id]/error.tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```
