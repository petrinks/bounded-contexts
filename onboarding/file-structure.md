# File Structure

A complete reference for where every type of file belongs in the Bounded Contexts architecture.

## Overview

The project is divided into three top-level zones. Each zone has a strict, well-defined responsibility.

```
src/
├── app/         ← routing and composition only
├── features/    ← all domain and business logic
└── shared/      ← reusable, domain-agnostic code
```

Dependencies flow in one direction only:

```
app/ → features/ → shared/
```

`shared/` never imports from `features/`. Features should not import from other features unless strictly necessary.

---

## app/

The `app/` directory is used exclusively for routing. It should never contain business logic, complex components, or data fetching.

```
app/
├── layout.tsx              ← root layout (fonts, providers, metadata)
├── page.tsx                ← home page composition
├── globals.css             ← global styles only
│
├── (marketing)/            ← route group for public pages
│   ├── layout.tsx          ← marketing layout
│   ├── page.tsx            ← landing page
│   └── pricing/
│       └── page.tsx
│
├── (dashboard)/            ← route group for authenticated pages
│   ├── layout.tsx          ← dashboard layout
│   ├── influencers/
│   │   ├── page.tsx        ← list page
│   │   └── [id]/
│   │       └── page.tsx    ← detail page
│   └── revenue/
│       └── page.tsx
│
└── api/                    ← API routes (if needed)
    └── route.ts
```

### Rules for app/

- `page.tsx` receives `params` and `searchParams`, wraps Suspense boundaries, and imports from `features/`
- `layout.tsx` handles providers, fonts, and global UI shell
- No `useState`, no `useEffect`, no data fetching directly in `page.tsx`
- No business components defined inside `app/` — only imported from features

---

## features/

Every piece of domain logic lives here. Features are self-contained modules organized by domain.

```
features/
├── auth/
├── influencer/
├── revenue/
├── analytics/
├── marketing/
└── platform/
```

### Feature Folder Anatomy

```
features/influencer/
├── components/
│   ├── InfluencerCard.tsx              ← Server Component (fetches data)
│   ├── InfluencerCard.client.tsx       ← Client Component (interactivity)
│   ├── InfluencerCardSkeleton.tsx      ← Suspense fallback
│   ├── InfluencerList.tsx
│   ├── FollowersChart.tsx              ← Server Component
│   └── FollowersChart.client.tsx       ← Client Component
│
├── hooks/
│   └── useInfluencerFilter.ts          ← client-side hook
│
├── services/
│   └── influencer.service.ts           ← data fetching / API calls
│
├── types/
│   └── influencer.types.ts             ← TypeScript types
│
├── utils/
│   └── parseInfluencerMetrics.ts       ← pure utility functions
│
└── index.ts                            ← public API of the feature
```

### Component Naming

| File | Type | Purpose |
|---|---|---|
| `InfluencerCard.tsx` | Server Component | Fetches data, passes to client |
| `InfluencerCard.client.tsx` | Client Component | Handles interactivity |
| `InfluencerCardSkeleton.tsx` | Server or Client | Suspense fallback |

### Reserved Features

Some features have predefined purposes:

| Feature | Purpose |
|---|---|
| `auth/` | Authentication logic, session handling, guards |
| `marketing/` | Landing pages, hero, pricing, footer, header |
| `platform/` | Global dashboard shell, navigation, sidebar |

### Rules for features/

- Every component with business meaning lives here (e.g. `InfluencerCard`, `RevenueChart`)
- Server Components fetch their own data inside the feature
- Client Components never fetch data — they receive it via props
- Only the `.client.tsx` suffix files use `"use client"`
- Feature exports are public through `index.ts`
- Features do not import from other features unless strictly necessary

---

## shared/

Contains only reusable, domain-agnostic components, hooks, and utilities.

```
shared/
├── components/
│   ├── Button.tsx               ← Server Component (no interactivity)
│   ├── Button.client.tsx        ← Client Component (loading state, handlers)
│   ├── Input.tsx
│   ├── Input.client.tsx
│   ├── Modal.client.tsx         ← always client (needs state)
│   ├── Skeleton.tsx             ← base skeleton block
│   ├── Skeleton.client.tsx      ← animated version if needed
│   ├── LineChart.tsx            ← base chart (no domain data)
│   ├── LineChart.client.tsx     ← interactive chart
│   ├── Card.tsx
│   └── Badge.tsx
│
├── hooks/
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
│
├── utils/
│   ├── formatDate.ts
│   ├── formatCurrency.ts
│   └── cn.ts                    ← classnames utility
│
└── types/
    ├── common.types.ts
    └── api.types.ts
```

### Rules for shared/

- No business logic, no domain knowledge
- No imports from `features/`
- Components that need `"use client"` use the `.client.tsx` suffix
- Always prefer the Server version — only use `.client.tsx` when interactivity is required
- Shared components are building blocks, not complete UI sections

---

## File Naming Conventions

| Pattern | Example | When to use |
|---|---|---|
| `ComponentName.tsx` | `InfluencerCard.tsx` | Server Component |
| `ComponentName.client.tsx` | `InfluencerCard.client.tsx` | Client Component |
| `ComponentNameSkeleton.tsx` | `InfluencerCardSkeleton.tsx` | Suspense fallback |
| `feature.service.ts` | `influencer.service.ts` | Data fetching service |
| `feature.types.ts` | `influencer.types.ts` | TypeScript types |
| `useFunctionality.ts` | `useInfluencerFilter.ts` | Custom hook |
| `parseSomething.ts` | `parseInfluencerMetrics.ts` | Pure utility |

---

## Quick Reference: Where Does This File Go?

| File | Location |
|---|---|
| Landing page hero section | `features/marketing/components/Hero.tsx` |
| Dashboard sidebar | `features/platform/components/Sidebar.tsx` |
| Login form logic | `features/auth/components/LoginForm.client.tsx` |
| Influencer data card | `features/influencer/components/InfluencerCard.tsx` |
| Reusable button | `shared/components/Button.tsx` |
| Currency formatter | `shared/utils/formatCurrency.ts` |
| Fetch influencer by ID | `features/influencer/services/influencer.service.ts` |
| Route for /influencers | `app/(dashboard)/influencers/page.tsx` |
