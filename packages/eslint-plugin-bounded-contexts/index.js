"use strict"

const enforceClientSuffix = require("./rules/enforce-client-suffix")
const noImportFeaturesFromShared = require("./rules/no-import-features-from-shared")
const noFetchInClientComponent = require("./rules/no-fetch-in-client-component")
const noGlobalFolders = require("./rules/no-global-folders")
const noCrossFeatureImports = require("./rules/no-cross-feature-imports")

module.exports = {
  meta: {
    name: "eslint-plugin-bounded-contexts",
    version: "0.1.0",
  },

  rules: {
    "enforce-client-suffix": enforceClientSuffix,
    "no-import-features-from-shared": noImportFeaturesFromShared,
    "no-fetch-in-client-component": noFetchInClientComponent,
    "no-global-folders": noGlobalFolders,
    "no-cross-feature-imports": noCrossFeatureImports,
  },

  configs: {
    recommended: {
      plugins: ["bounded-contexts"],
      rules: {
        "bounded-contexts/enforce-client-suffix": "error",
        "bounded-contexts/no-import-features-from-shared": "error",
        "bounded-contexts/no-fetch-in-client-component": "warn",
        "bounded-contexts/no-global-folders": "error",
        "bounded-contexts/no-cross-feature-imports": "warn",
      },
    },

    strict: {
      plugins: ["bounded-contexts"],
      rules: {
        "bounded-contexts/enforce-client-suffix": "error",
        "bounded-contexts/no-import-features-from-shared": "error",
        "bounded-contexts/no-fetch-in-client-component": "error",
        "bounded-contexts/no-global-folders": "error",
        "bounded-contexts/no-cross-feature-imports": "error",
      },
    },
  },
}
