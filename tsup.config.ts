import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig([
  // Library — tree-shakeable ESM with full type declarations
  {
    entry: { index: "src/index.ts" },
    outDir: "dist",
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "node18",
    external: Object.keys(pkg.dependencies),
  },
  // CLI — CJS for universal Node + Bun compatibility (avoids ESM/CJS interop issues)
  {
    entry: { cli: "cli/index.ts" },
    outDir: "dist",
    format: ["cjs"],
    dts: false,
    sourcemap: false,
    target: "node18",
    banner: { js: "#!/usr/bin/env node" },
    define: { __CLI_VERSION__: JSON.stringify(pkg.version) },
  },
]);
