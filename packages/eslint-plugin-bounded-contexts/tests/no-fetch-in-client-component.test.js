"use strict"

const { RuleTester } = require("eslint")
const rule = require("../rules/no-fetch-in-client-component")

const tester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
})

tester.run("no-fetch-in-client-component", rule, {
  valid: [
    {
      code: `
        "use client"
        import { useState } from "react"
        export function Card({ data }) {
          const [open, setOpen] = useState(false)
          return null
        }
      `,
      filename: "/src/features/influencer/components/InfluencerCard.client.tsx",
    },
    {
      code: `
        export async function InfluencerCard({ id }) {
          const res = await fetch("/api/influencers/" + id)
          const data = await res.json()
          return data
        }
      `,
      filename: "/src/features/influencer/components/InfluencerCard.tsx",
    },
    {
      code: `
        "use client"
        export function Button({ onClick, children }) {
          return null
        }
      `,
      filename: "/src/shared/components/Button.client.tsx",
    },
  ],

  invalid: [
    {
      code: `
        "use client"
        export function InfluencerCard({ id }) {
          const data = fetch("/api/influencers/" + id)
          return null
        }
      `,
      filename: "/src/features/influencer/components/InfluencerCard.client.tsx",
      errors: [{ messageId: "noFetchCall" }],
    },
    {
      code: `
        "use client"
        import { useState, useEffect } from "react"
        export function InfluencerCard({ id }) {
          const [data, setData] = useState(null)
          useEffect(() => {
            fetch("/api/influencers/" + id).then(r => r.json()).then(setData)
          }, [id])
          return null
        }
      `,
      filename: "/src/features/influencer/components/InfluencerCard.client.tsx",
      errors: [{ messageId: "noUseEffectFetch" }],
    },
  ],
})

console.log("✓ no-fetch-in-client-component: all tests passed")
