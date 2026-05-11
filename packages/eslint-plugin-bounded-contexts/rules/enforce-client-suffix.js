"use strict"

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        'Files containing "use client" must use the .client.tsx or .client.ts suffix',
      recommended: true,
      url: "https://github.com/petrinks/bounded-contexts/blob/main/docs/rules/enforce-client-suffix.md",
    },
    messages: {
      missingSuffix:
        '"use client" found in "{{ filename }}" — rename it to "{{ suggested }}".',
    },
    schema: [],
  },

  create(context) {
    return {
      ExpressionStatement(node) {
        const isUseClientDirective =
          node.expression.type === "Literal" &&
          node.expression.value === "use client"

        if (!isUseClientDirective) return

        const filename = context.getFilename()

        const isClientFile =
          filename.endsWith(".client.tsx") ||
          filename.endsWith(".client.ts") ||
          filename.endsWith(".client.jsx") ||
          filename.endsWith(".client.js")

        if (!isClientFile) {
          const suggested = filename
            .replace(/\.tsx$/, ".client.tsx")
            .replace(/\.ts$/, ".client.ts")
            .replace(/\.jsx$/, ".client.jsx")
            .replace(/\.js$/, ".client.js")

          const shortFilename = filename.split("/").pop()
          const shortSuggested = suggested.split("/").pop()

          context.report({
            node,
            messageId: "missingSuffix",
            data: {
              filename: shortFilename,
              suggested: shortSuggested,
            },
          })
        }
      },
    }
  },
}
