# Bounded Context

A production-ready, opinionated architecture for building scalable Next.js applications using feature-based organization, Server/Client Components, and granular data fetching with Suspense boundaries.

## Why Bounded Context?

Most Next.js projects struggle with organization as they scale. Code gets scattered across global `components/`, `hooks/`, and `services/` folders. Features leak into each other. Shared components accumulate business logic. The codebase becomes increasingly hard to navigate and maintain.

Bounded Context solves this by enforcing a **feature-based, domain-driven architecture** where:

- Every feature is self-contained and owns its components, hooks, services, and types
- Server Components fetch data independently, enabling true parallel loading
- Client Components only handle interactivity — never data fetching
- Suspense boundaries are granular — each component loads at its own pace
- Shared code is truly agnostic — no business logic allowed
- Dependencies flow in one direction: `app/` → `features/` → `shared/`

## Architecture at a Glance

```
project/
├── app/                          ← routing & composition only
│   ├── page.tsx                  ← Server Component, wraps Suspense boundaries
│   └── layout.tsx
│
├── features/                      ← all domain logic lives here
│   ├── influencer/
│   │   ├── components/
│   │   │   ├── InfluencerCard.tsx           ← Server, fetches own data
│   │   │   ├── InfluencerCard.client.tsx    ← Client, receives props
│   │   │   ├── InfluencerCardSkeleton.tsx   ← Skeleton for Suspense
│   │   │   └── FollowersChart.tsx
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── revenue/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── auth/
│   └── marketing/
│
└── shared/                        ← reusable, domain-agnostic
    ├── components/
    │   ├── Button.tsx             ← Server by default
    │   ├── Button.client.tsx      ← Client version exists
    │   ├── Input.tsx
    │   ├── Modal.client.tsx
    │   ├── LineChart.tsx          ← base chart
    │   └── Skeleton.tsx
    ├── hooks/
    ├── utils/
    └── types/
```

## Core Principles

### 1. Feature-Based Organization

Every feature is a complete, self-contained module. If you need to work on a feature, you work inside one folder. If you need to delete a feature, you delete one folder.

```typescript
// ✅ CORRECT: Everything for influencer feature lives here
features/influencer/
  ├── components/InfluencerCard.tsx
  ├── services/influencer.service.ts
  ├── hooks/useInfluencerData.ts
  ├── types/influencer.types.ts
  └── utils/parseInfluencerMetrics.ts

// ❌ WRONG: Scattered across the codebase
components/InfluencerCard.tsx
hooks/useInfluencerData.ts
services/influencer.service.ts
```

### 2. Server Components by Default

All components are Server Components until proven otherwise. Only add `"use client"` when you genuinely need browser APIs or state management.

```typescript
// ✅ CORRECT: Server Component fetches its own data
// features/influencer/components/InfluencerCard.tsx
export default async function InfluencerCard({ id }: { id: string }) {
  const data = await fetch(`/api/influencers/${id}`)
  return <div>{/* render with data */}</div>
}

// ❌ WRONG: Fetching in Client Component
"use client"
export default function InfluencerCard({ id }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/api/influencers/${id}`).then(setData) // bad!
  }, [id])
  return <div>{/* ... */}</div>
}
```

### 3. Server Components Own Fetching

Each Server Component inside a feature is responsible for fetching its own data. This enables true parallel data fetching — multiple components can fetch simultaneously without blocking each other.

```typescript
// ✅ CORRECT: Two components fetch independently
// app/page.tsx
export default function Page() {
  return (
    <>
      <Suspense fallback={<InfluencerCardSkeleton />}>
        <InfluencerCard id={params.id} />
      </Suspense>
      
      <Suspense fallback={<RevenueChartSkeleton />}>
        <RevenueChart influencerId={params.id} />
      </Suspense>
    </>
  )
}

// features/influencer/components/InfluencerCard.tsx
async function InfluencerCard({ id }) {
  const data = await fetch(...) // fetches here
  return <InfluencerCardClient data={data} />
}

// features/revenue/components/RevenueChart.tsx
async function RevenueChart({ influencerId }) {
  const data = await fetch(...) // fetches independently in parallel
  return <RevenueChartClient data={data} />
}
```

### 4. Granular Suspense Boundaries

Never use a global `loading.tsx`. Each component that fetches data gets its own Suspense boundary with a specific skeleton fallback. This way, if one component is slow, others still render.

```typescript
// ✅ CORRECT: Granular Suspense
<Suspense fallback={<InfluencerCardSkeleton />}>
  <InfluencerCard id={id} />
</Suspense>

<Suspense fallback={<RevenueChartSkeleton />}>
  <RevenueChart influencerId={id} />
</Suspense>

// ❌ WRONG: Global loading fallback
// loading.tsx (never use this pattern)
export default function Loading() {
  return <div>Loading...</div>
}
```

### 5. Client Components Only for Interactivity

Client Components receive data via props from their parent Server Component. They never fetch data. They only handle interactivity: state, effects, event handlers, browser APIs.

```typescript
// ✅ CORRECT: Client Component receives data as prop
// features/influencer/components/InfluencerCard.client.tsx
"use client"
export function InfluencerCardClient({ data }: { data: Influencer }) {
  const [liked, setLiked] = useState(false)
  
  return (
    <div>
      <h2>{data.name}</h2>
      <button onClick={() => setLiked(!liked)}>
        {liked ? "♥️" : "♡"} Like
      </button>
    </div>
  )
}

// ❌ WRONG: Client Component fetching
"use client"
export function InfluencerCard({ id }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/api/influencers/${id}`).then(setData) // bad!
  }, [id])
  return <div>{data?.name}</div>
}
```

### 6. The `.client.tsx` Suffix

Client Components must use the `.client.tsx` suffix. This makes it instantly clear which components need the browser. Server versions coexist with Client versions — consumers choose which to import.

```typescript
// shared/components/Button.tsx — Server, used by default
export function Button({ children, onClick }: Props) {
  // no state, no event handlers — renders on server
  return <button>{children}</button>
}

// shared/components/Button.client.tsx — Client, for interactivity
"use client"
export function ButtonClient({ children, onClick }: Props) {
  const [loading, setLoading] = useState(false)
  
  async function handleClick() {
    setLoading(true)
    await onClick?.()
    setLoading(false)
  }
  
  return <button onClick={handleClick}>{children}</button>
}
```

### 7. Shared Code is Truly Agnostic

`shared/` contains only reusable, domain-free components: `Button`, `Input`, `Modal`, `LineChart` (base, not domain-specific). No Influencer logic, no Revenue logic. If you're tempted to put business logic in `shared/`, it belongs in a feature.

```typescript
// ✅ CORRECT: Shared has no domain knowledge
// shared/components/LineChart.tsx
export function LineChart({ data, xKey, yKey }: Props) {
  return <ResponsiveContainer>{/* generic chart */}</ResponsiveContainer>
}

// ❌ WRONG: Shared with domain logic
// shared/components/RevenueChart.tsx (should be in features/revenue/)
export function RevenueChart({ influencerId }) {
  const data = await fetchRevenueData(influencerId) // domain logic!
  return <LineChart data={data} />
}
```

### 8. Composition Over Modification

Domain-specific variations of shared components live in features and compose from `shared/`. Never modify shared components to fit one feature's needs.

```typescript
// ✅ CORRECT: Feature composes shared component
// features/revenue/components/RevenueChart.tsx
import { LineChart } from "@/shared/components/LineChart"
import { currencyFormatter } from "./utils/formatCurrency"

export function RevenueChart({ data }) {
  return (
    <LineChart
      data={data}
      xKey="month"
      yKey="revenue"
      formatter={currencyFormatter}
    />
  )
}

// ❌ WRONG: Modifying shared component for one feature
// shared/components/LineChart.tsx with revenue-specific logic
export function LineChart({ showCurrency = false, ... }) {
  // now this shared component knows about revenue!
}
```

### 9. Unidirectional Dependencies

Dependencies flow strictly one direction:

```
app/ → features/ → shared/

shared/ never imports from features/
features/ never import from other features/ (unless strictly necessary)
app/ imports from features/ for composition
```

This prevents circular dependencies and keeps the architecture clean.

### 10. Skeletons for Suspense

Every Server Component that fetches data needs a skeleton. Skeletons live in the feature next to the component they support.

```typescript
// features/influencer/components/
├── InfluencerCard.tsx
├── InfluencerCard.client.tsx
└── InfluencerCardSkeleton.tsx  ← skeleton for Suspense fallback

// In page.tsx:
<Suspense fallback={<InfluencerCardSkeleton />}>
  <InfluencerCard id={id} />
</Suspense>
```

## Getting Started

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/feature-factory.git
cd feature-factory
npm install
npm run dev
```

### 2. Explore the Structure

Look at `features/` to see real examples of how features are organized. Start with the simplest feature to understand the pattern.

### 3. Create Your First Feature

```bash
mkdir features/my-feature
mkdir features/my-feature/components
mkdir features/my-feature/services
mkdir features/my-feature/types
mkdir features/my-feature/hooks
```

Then follow the patterns in existing features.

## Best Practices

### Naming Conventions

- **Features**: lowercase, singular or plural as semantically appropriate (`influencer/`, `revenue/`, `auth/`)
- **Components**: PascalCase, descriptive (`InfluencerCard.tsx`, `FollowersChart.tsx`)
- **Server/Client versions**: `.tsx` for Server, `.client.tsx` for Client
- **Skeletons**: `ComponentNameSkeleton.tsx`
- **Hooks**: `useFunctionality.ts` (camelCase)
- **Services**: `feature.service.ts` (descriptive, not generic)
- **Types**: `feature.types.ts` (feature-specific) or `feature.d.ts`

### Fetching Data

```typescript
// ✅ Inside a Server Component
async function InfluencerCard({ id }: { id: string }) {
  const res = await fetch(`https://api.example.com/influencers/${id}`, {
    next: { revalidate: 3600 } // ISR: revalidate every hour
  })
  
  if (!res.ok) notFound() // handle 404
  
  const data = await res.json()
  return <InfluencerCardClient data={data} />
}

// ✅ Or using a service function
async function InfluencerCard({ id }: { id: string }) {
  const data = await influencerService.getById(id)
  return <InfluencerCardClient data={data} />
}
```

### Importing Between Layers

```typescript
// ✅ CORRECT imports
import { Button } from "@/shared/components/Button"
import { InfluencerCard } from "@/features/influencer/components"
import { useInfluencerData } from "@/features/influencer/hooks"

// ❌ WRONG imports
import { Button } from "@/features/shared/Button"
import { influencerService } from "@/features/influencer/services"
// (missing the @/features/ path prefix)
```

## File Structure Rules Checklist

Before creating any new file, ask yourself:

- [ ] Is this component/hook/service used by multiple features? → `shared/`
- [ ] Does this component contain business logic? → `features/`
- [ ] Does this component need `useState`, `useEffect`, or browser APIs? → `.client.tsx`
- [ ] Is this a data-fetching component? → Server Component inside `features/`
- [ ] Does this component display a loading state? → It should be a Skeleton, not a Component
- [ ] Am I modifying a shared component for one feature's needs? → Create a domain-specific version in `features/`

## Running Linting and Type Checking

```bash
npm run lint    # ESLint
npm run type    # TypeScript
npm run format  # Prettier
```

Consider adding rules to your ESLint config that enforce:
- No imports from `features/` in `shared/`
- No global `components/`, `hooks/`, or `services/` folders
- All Client Components use `.client.tsx` suffix

## Examples

See the `/examples` directory for:
- Real feature implementation (influencer + revenue)
- Proper Suspense boundary setup
- Parallel data fetching patterns
- Server/Client component separation

## Contributing

This is an open-source architecture template. Contributions are welcome:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/add-example`)
3. Commit your changes (`git commit -am 'Add new example'`)
4. Push to the branch (`git push origin feature/add-example`)
5. Open a Pull Request

## License

MIT — feel free to use this architecture in your projects.

## Acknowledgments

This architecture is inspired by Domain-Driven Design (DDD), bounded contexts, and modern React/Next.js best practices. Special thanks to the Next.js team for Server Components, and the community for feedback on feature-based organization.

## Questions?

Open an issue or start a discussion. We're here to help you scale your codebase with confidence.

---

**Happy building! 🚀**
