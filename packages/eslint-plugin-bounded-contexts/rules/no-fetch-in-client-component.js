"use strict"

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Client Components (.client.tsx) must not fetch data directly",
      recommended: true,
      url: "https://github.com/petrinks/bounded-contexts/blob/main/docs/rules/no-fetch-in-client-component.md",
    },
    messages: {
      noFetchCall:
        "Avoid calling fetch() directly in a Client Component. Fetch data in a Server Component and pass it as props.",
      noUseEffectFetch:
        "Avoid fetching data inside useEffect() in a Client Component. Fetch data in a Server Component and pass it as props.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    const isClientFile =
      filename.endsWith(".client.tsx") ||
      filename.endsWith(".client.ts") ||
      filename.endsWith(".client.jsx") ||
      filename.endsWith(".client.js")

    if (!isClientFile) return {}

    // Track nodes that are already reported as part of a useEffect+fetch
    // so we don't double-report them as noFetchCall
    const reportedNodes = new Set()

    function isFetchCall(node) {
      return (
        node.type === "CallExpression" &&
        node.callee.type === "Identifier" &&
        node.callee.name === "fetch"
      )
    }

    function findFetchNode(node) {
      if (!node) return null
      if (isFetchCall(node)) return node
      if (node.type === "AwaitExpression") return findFetchNode(node.argument)
      return null
    }

    function findFetchInTree(node) {
      if (!node) return null
      if (isFetchCall(node)) return node

      for (const key of Object.keys(node)) {
        if (key === "parent") continue
        const child = node[key]
        if (!child || typeof child !== "object") continue
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === "object" && item.type) {
              const found = findFetchInTree(item)
              if (found) return found
            }
          }
        } else if (child.type) {
          const found = findFetchInTree(child)
          if (found) return found
        }
      }
      return null
    }

    function isUseEffectCall(node) {
      return (
        node.type === "CallExpression" &&
        node.callee.type === "Identifier" &&
        node.callee.name === "useEffect"
      )
    }

    return {
      CallExpression(node) {
        // Check useEffect with fetch inside
        if (isUseEffectCall(node)) {
          const callback = node.arguments[0]
          if (!callback) return

          const body =
            callback.type === "ArrowFunctionExpression" ||
            callback.type === "FunctionExpression"
              ? callback.body
              : null

          if (!body) return

          const fetchNode = findFetchInTree(body)
          if (fetchNode) {
            context.report({ node, messageId: "noUseEffectFetch" })
            reportedNodes.add(fetchNode)
          }
          return
        }

        // Check bare fetch() calls not already reported via useEffect
        if (isFetchCall(node) && !reportedNodes.has(node)) {
          context.report({ node, messageId: "noFetchCall" })
        }
      },
    }
  },
}
