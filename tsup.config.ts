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
  // CLI — ESM, external deps (Node 18 handles CJS/ESM interop natively)
  {
    entry: { cli: "cli/index.ts" },
    outDir: "dist",
    format: ["esm"],
    dts: false,
    sourcemap: false,
    target: "node18",
    external: Object.keys(pkg.dependencies),
    banner: { js: "#!/usr/bin/env node" },
    define: { __CLI_VERSION__: JSON.stringify(pkg.version) },
  },
]);
