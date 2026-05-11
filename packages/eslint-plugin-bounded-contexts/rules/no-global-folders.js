"use strict"

const path = require("path")

const FORBIDDEN_GLOBAL_FOLDERS = ["components", "hooks", "services", "utils", "types"]

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow global folders (components/, hooks/, services/) outside of features/ or shared/",
      recommended: true,
      url: "https://github.com/petrinks/bounded-contexts/blob/main/docs/rules/no-global-folders.md",
    },
    messages: {
      noGlobalFolder:
        '"{{ folder }}/" must live inside features/ or shared/, not at the root src/ level. Move it to the appropriate feature.',
    },
    schema: [
      {
        type: "object",
        properties: {
          srcDir: { type: "string" },
          forbiddenFolders: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {}
    const srcDir = options.srcDir || "src"
    const forbiddenFolders = options.forbiddenFolders || FORBIDDEN_GLOBAL_FOLDERS

    const filename = context.getFilename()
    const normalizedFilename = filename.replace(/\\/g, "/")

    const isInFeatures = normalizedFilename.includes("/features/")
    const isInShared = normalizedFilename.includes("/shared/")

    if (isInFeatures || isInShared) return {}

    for (const folder of forbiddenFolders) {
      const globalPattern = `/${srcDir}/${folder}/`
      const altPattern = `/src/${folder}/`

      if (
        normalizedFilename.includes(globalPattern) ||
        normalizedFilename.includes(altPattern)
      ) {
        return {
          Program(node) {
            context.report({
              node,
              messageId: "noGlobalFolder",
              data: { folder },
            })
          },
        }
      }
    }

    return {}
  },
}
