"use strict"

const { RuleTester } = require("eslint")
const noGlobalFolders = require("../rules/no-global-folders")
const noCrossFeatureImports = require("../rules/no-cross-feature-imports")

const tester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
})

tester.run("no-global-folders", noGlobalFolders, {
  valid: [
    {
      code: `export function InfluencerCard() {}`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
    },
    {
      code: `export function Button() {}`,
      filename: "/src/shared/components/Button.tsx",
    },
    {
      code: `export default function Page() {}`,
      filename: "/src/app/page.tsx",
    },
  ],

  invalid: [
    {
      code: `export function InfluencerCard() {}`,
      filename: "/src/components/InfluencerCard.tsx",
      errors: [{ messageId: "noGlobalFolder" }],
    },
    {
      code: `export function useData() {}`,
      filename: "/src/hooks/useData.ts",
      errors: [{ messageId: "noGlobalFolder" }],
    },
    {
      code: `export const api = {}`,
      filename: "/src/services/api.ts",
      errors: [{ messageId: "noGlobalFolder" }],
    },
  ],
})

console.log("✓ no-global-folders: all tests passed")

tester.run("no-cross-feature-imports", noCrossFeatureImports, {
  valid: [
    {
      // same feature — allowed
      code: `import { influencerService } from "../services/influencer.service"`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
    },
    {
      // shared import — allowed
      code: `import { Button } from "@shared/components/Button"`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
    },
    {
      // cross-feature but from index — allowed
      code: `import { RevenueChart } from "@features/revenue"`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
    },
    {
      // from app/ — not restricted
      code: `import { InfluencerCard } from "@features/influencer"`,
      filename: "/src/app/page.tsx",
    },
  ],

  invalid: [
    {
      // alias import to internal path — bad
      code: `import { revenueService } from "@features/revenue/services/revenue.service"`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
      errors: [{ messageId: "noInternalCrossFeatureImport" }],
    },
    {
      // relative import resolving to another feature's internals — bad
      code: `import { RevenueChart } from "../../revenue/components/RevenueChart"`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
      errors: [{ messageId: "noInternalCrossFeatureImport" }],
    },
  ],
})

console.log("✓ no-cross-feature-imports: all tests passed")
