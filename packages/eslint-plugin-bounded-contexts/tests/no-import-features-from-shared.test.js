"use strict"

const { RuleTester } = require("eslint")
const rule = require("../rules/no-import-features-from-shared")

const tester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
})

tester.run("no-import-features-from-shared", rule, {
  valid: [
    {
      code: `import { Button } from "../components/Button"`,
      filename: "/src/shared/components/Card.tsx",
    },
    {
      code: `import { influencerService } from "../services/influencer.service"`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
    },
    {
      code: `import { Button } from "@shared/components/Button"`,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
    },
    {
      code: `import { InfluencerCard } from "@features/influencer"`,
      filename: "/src/app/page.tsx",
    },
  ],

  invalid: [
    {
      code: `import { influencerService } from "@features/influencer/services/influencer.service"`,
      filename: "/src/shared/components/Card.tsx",
      errors: [{ messageId: "noImportFeaturesFromShared" }],
    },
    {
      code: `import { Influencer } from "../features/influencer/types/influencer.types"`,
      filename: "/src/shared/utils/formatData.ts",
      errors: [{ messageId: "noImportFeaturesFromShared" }],
    },
    {
      code: `import { useInfluencer } from "features/influencer/hooks/useInfluencer"`,
      filename: "/src/shared/hooks/useGeneric.ts",
      errors: [{ messageId: "noImportFeaturesFromShared" }],
    },
  ],
})

console.log("✓ no-import-features-from-shared: all tests passed")
