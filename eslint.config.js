import pluginVue from "eslint-plugin-vue"
import prettierRecommended from "eslint-plugin-prettier/recommended"

export default [
  ...pluginVue.configs["flat/essential"],
  prettierRecommended,
  {
    rules: {
      "prettier/prettier": "warn",
    },
  },
]
