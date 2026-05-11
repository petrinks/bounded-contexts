🧠 Architecture Rules (Feature-Based System)
1. All code must be organized by feature/domain, never by file type (no global components/, hooks/, services/ folders)
2. Before creating any file, you MUST determine if it belongs to a feature or is shared (domain-agnostic)
3. All business/domain-related code must live inside features/<feature-name>/
4. Each feature must be self-contained and may include: components, hooks, services, types, utils
5. The shared/ folder must contain ONLY reusable, domain-agnostic code that can be used across multiple features
6. Components inside shared/ must NEVER contain business logic or domain knowledge (e.g. no Influencer, Revenue, Auth logic)
7. The app/ directory must be used ONLY for routing (page.tsx), layouts (layout.tsx), and route groups
8. page.tsx must only handle routing concerns (params, searchParams, metadata) and component composition — it must NEVER contain fetch calls, data logic, or business knowledge
9. Features can import from shared/ but shared/ must NEVER import from features/
10. Features should NOT depend on other features unless strictly necessary — avoid cross-feature coupling
11. If a component contains business meaning (e.g. InfluencerCard, RevenueChart), it MUST be placed inside its respective feature
12. If a component is purely visual and reusable (e.g. Button, Input, Modal, LineChart base), it MUST be placed inside shared/
13. Domain-specific variations of shared components must be implemented inside features using composition, never by modifying shared components
14. All charts must follow this rule: chart base (LineChart, BarChart) → shared/ · domain chart (RevenueChart, FollowersChart) → features/
15. All forms must follow this rule: input fields → shared/ · form logic and validation → features/
16. Layout structures must follow this rule: global UI structure (dashboard shell) → features/platform/ · landing page layout → features/marketing/
17. Marketing (landing pages, hero, pricing, footer, header) must always live inside features/marketing/
18. Authentication logic must be centralized inside features/auth/, but role-specific flows must live in their respective features
19. Before creating any component, you MUST ask: "Is this generic or domain-specific?"
20. If unsure where something belongs, default to placing it inside a feature, NOT in shared/
21. Never create files directly in the root or outside the defined architecture structure

⚛️ Server and Client Components
22. All components must be Server Components by default — only add "use client" when strictly necessary (useState, useEffect, browser APIs, event handlers with local logic)
23. The "use client" directive must ONLY appear in files with the .client.tsx suffix — never in a file without it
24. Server Components inside features/ are responsible for fetching their own data directly — each component owns its data fetching
25. Client Components (.client.tsx) must NEVER fetch data directly — they receive all data via props from their parent Server Component
26. Prefer always the Server Component version of a shared component — only use .client.tsx when the component needs to manage its own state or access browser APIs
27. The "use client" contamination rule: never add "use client" to a shared base component if a Server version can coexist — always create a .client.tsx sibling instead, preserving the Server version for consumers that don't need interactivity

⏳ Data Fetching and Suspense
28. page.tsx is responsible for wrapping each feature Server Component in its own <Suspense> boundary with an explicit fallback — never rely on loading.tsx as a global fallback
29. Each <Suspense> boundary must receive a specific skeleton component as fallback, never a generic spinner or null
30. Every feature component that fetches data must have a corresponding Skeleton component inside its own feature folder (e.g. InfluencerCardSkeleton.tsx)
31. Skeleton base components (generic shimmer/animated blocks) must live in shared/ — feature Skeletons compose from these base components
32. Skeleton components may use "use client" and carry the .client.tsx suffix if browser APIs are needed for animation — this is acceptable since they contain no data fetching or business logic
33. Multiple Server Components on the same page must fetch data independently and in parallel — never chain or block fetches sequentially unless there is an explicit data dependency between them
