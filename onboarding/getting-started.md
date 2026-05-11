# Getting Started

This guide walks you through setting up a new project using the Bounded Contexts architecture from scratch.

## Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- Basic knowledge of Next.js App Router and TypeScript

## 1. Create a New Next.js Project

```bash
npx create-next-app@latest my-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd my-app
```

## 2. Set Up the Folder Structure

Remove the default Next.js folder structure and replace it with the feature-based layout:

```bash
# Remove default structure
rm -rf src/app/page.tsx src/app/globals.css

# Create the base folders
mkdir -p src/features
mkdir -p src/shared/components
mkdir -p src/shared/hooks
mkdir -p src/shared/utils
mkdir -p src/shared/types
```

Your final structure should look like this:

```
src/
├── app/                     ← routing only
│   ├── layout.tsx
│   ├── page.tsx
│   └── (routes)/
│
├── features/                ← all domain logic
│   ├── auth/
│   ├── marketing/
│   └── platform/
│
└── shared/                  ← domain-agnostic code
    ├── components/
    ├── hooks/
    ├── utils/
    └── types/
```

## 3. Configure Path Aliases

Make sure your `tsconfig.json` includes the correct path aliases:

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

## 4. Create Your First Feature

Every piece of domain logic lives inside `features/`. Here is how to create a new feature:

```bash
mkdir -p src/features/my-feature/components
mkdir -p src/features/my-feature/services
mkdir -p src/features/my-feature/hooks
mkdir -p src/features/my-feature/types
mkdir -p src/features/my-feature/utils
touch src/features/my-feature/index.ts
```

Export everything public through `index.ts`:

```typescript
// src/features/my-feature/index.ts
export { MyFeatureCard } from "./components/MyFeatureCard"
export { MyFeatureCardSkeleton } from "./components/MyFeatureCardSkeleton"
export type { MyFeature } from "./types/my-feature.types"
```

## 5. Create Your First Server Component

Server Components are the default. They fetch their own data and pass it down as props to Client Components.

```typescript
// src/features/my-feature/components/MyFeatureCard.tsx
import { MyFeatureCardClient } from "./MyFeatureCard.client"
import { myFeatureService } from "../services/my-feature.service"

interface Props {
  id: string
}

export async function MyFeatureCard({ id }: Props) {
  const data = await myFeatureService.getById(id)
  return <MyFeatureCardClient data={data} />
}
```

## 6. Create a Client Component

Client Components have the `.client.tsx` suffix and receive all data via props:

```typescript
// src/features/my-feature/components/MyFeatureCard.client.tsx
"use client"

import { useState } from "react"
import type { MyFeature } from "../types/my-feature.types"

interface Props {
  data: MyFeature
}

export function MyFeatureCardClient({ data }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <h2>{data.title}</h2>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? "Show less" : "Show more"}
      </button>
      {expanded && <p>{data.description}</p>}
    </div>
  )
}
```

## 7. Create a Skeleton

Every Server Component that fetches data needs a Skeleton for its Suspense boundary:

```typescript
// src/features/my-feature/components/MyFeatureCardSkeleton.tsx
import { Skeleton } from "@shared/components/Skeleton"

export function MyFeatureCardSkeleton() {
  return (
    <div>
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}
```

## 8. Wire It Up in page.tsx

The `page.tsx` composes features and wraps each one in its own Suspense boundary:

```typescript
// src/app/my-route/page.tsx
import { Suspense } from "react"
import { MyFeatureCard, MyFeatureCardSkeleton } from "@features/my-feature"

interface Props {
  params: { id: string }
}

export default function Page({ params }: Props) {
  return (
    <main>
      <Suspense fallback={<MyFeatureCardSkeleton />}>
        <MyFeatureCard id={params.id} />
      </Suspense>
    </main>
  )
}
```

## Next Steps

- Read [File Structure](./file-structure.md) for a deep dive into where everything belongs
- Read [Patterns](./patterns.md) for common implementation patterns
- Check [FAQ](./faq.md) if you have questions
