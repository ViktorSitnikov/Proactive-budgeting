import { createRequire } from "module"

const require = createRequire(import.meta.url)
/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = require("eslint-config-next/core-web-vitals")

export default eslintConfig
