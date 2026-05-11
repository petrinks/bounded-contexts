"use strict"

const path = require("path")

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "shared/ must never import from features/",
      recommended: true,
      url: "https://github.com/petrinks/bounded-contexts/blob/main/docs/rules/no-import-features-from-shared.md",
    },
    messages: {
      noImportFeaturesFromShared:
        'shared/ must not import from features/. Found: "{{ importPath }}".',
    },
    schema: [
      {
        type: "object",
        properties: {
          sharedDir: { type: "string" },
          featuresDir: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {}
    const sharedDir = options.sharedDir || "shared"
    const featuresDir = options.featuresDir || "features"

    const filename = context.getFilename()
    const normalizedFilename = filename.replace(/\\/g, "/")

    const isInShared = normalizedFilename.includes(`/${sharedDir}/`)
    if (!isInShared) return {}

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value

        const importsFromFeatures =
          importPath.includes(`/${featuresDir}/`) ||
          importPath.includes(`@${featuresDir}/`) ||
          importPath.startsWith(`${featuresDir}/`)

        if (importsFromFeatures) {
          context.report({
            node,
            messageId: "noImportFeaturesFromShared",
            data: { importPath },
          })
        }
      },
    }
  },
}
