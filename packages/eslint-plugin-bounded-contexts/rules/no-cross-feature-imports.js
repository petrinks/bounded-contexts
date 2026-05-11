"use strict"

const path = require("path")

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Features must not import from other features' internal paths — only from their index",
      recommended: true,
      url: "https://github.com/petrinks/bounded-contexts/blob/main/docs/rules/no-cross-feature-imports.md",
    },
    messages: {
      noInternalCrossFeatureImport:
        'Importing from "{{ importPath }}" breaks feature encapsulation. Import from "{{ suggested }}" instead.',
    },
    schema: [
      {
        type: "object",
        properties: {
          featuresDir: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {}
    const featuresDir = options.featuresDir || "features"

    const filename = context.getFilename().replace(/\\/g, "/")

    const isInFeatures = filename.includes(`/${featuresDir}/`)
    if (!isInFeatures) return {}

    const currentFeatureMatch = filename.match(
      new RegExp(`/${featuresDir}/([^/]+)/`)
    )
    if (!currentFeatureMatch) return {}

    const currentFeature = currentFeatureMatch[1]

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value
        const normalizedImport = importPath.replace(/\\/g, "/")

        // Check alias imports: @features/other-feature/internal/path
        const aliasMatch = normalizedImport.match(
          new RegExp(`@?${featuresDir}/([^/]+)/(.+)`)
        )

        if (aliasMatch) {
          const importedFeature = aliasMatch[1]
          if (importedFeature !== currentFeature) {
            const suggested = `@${featuresDir}/${importedFeature}`
            context.report({
              node,
              messageId: "noInternalCrossFeatureImport",
              data: { importPath, suggested },
            })
          }
          return
        }

        // Check relative imports: ../other-feature/components/...
        if (!normalizedImport.startsWith(".")) return

        const currentDir = path.dirname(filename)
        const resolvedImport = path
          .resolve(currentDir, normalizedImport)
          .replace(/\\/g, "/")

        const importedFeatureMatch = resolvedImport.match(
          new RegExp(`/${featuresDir}/([^/]+)/(.+)`)
        )

        if (!importedFeatureMatch) return

        const importedFeature = importedFeatureMatch[1]
        const importedSubpath = importedFeatureMatch[2]

        // same feature — allowed
        if (importedFeature === currentFeature) return

        // importing from index — allowed
        if (
          importedSubpath === "index" ||
          importedSubpath === "index.ts" ||
          importedSubpath === "index.tsx"
        ) {
          return
        }

        const suggested = `@${featuresDir}/${importedFeature}`
        context.report({
          node,
          messageId: "noInternalCrossFeatureImport",
          data: { importPath, suggested },
        })
      },
    }
  },
}
