"use strict"

const { RuleTester } = require("eslint")
const rule = require("../rules/enforce-client-suffix")

const tester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
})

tester.run("enforce-client-suffix", rule, {
  valid: [
    {
      code: `"use client"\nexport function Button() {}`,
      filename: "/src/shared/components/Button.client.tsx",
    },
    {
      code: `"use client"\nexport function InfluencerCard() {}`,
      filename: "/src/features/influencer/components/InfluencerCard.client.tsx",
    },
    {
      code: `export async function InfluencerCard() { const data = await fetch("/api"); return data }`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
    },
    {
      code: `export function Button() { return null }`,
      filename: "/src/shared/components/Button.tsx",
    },
  ],

  invalid: [
    {
      code: `"use client"\nexport function Button() {}`,
      filename: "/src/shared/components/Button.tsx",
      errors: [{ messageId: "missingSuffix" }],
    },
    {
      code: `"use client"\nexport function InfluencerCard() {}`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
      errors: [{ messageId: "missingSuffix" }],
    },
    {
      code: `"use client"\nexport function Modal() {}`,
      filename: "/src/shared/components/Modal.ts",
      errors: [{ messageId: "missingSuffix" }],
    },
  ],
})

console.log("✓ enforce-client-suffix: all tests passed")
