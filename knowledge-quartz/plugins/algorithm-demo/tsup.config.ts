import { defineConfig } from "tsup"
import type { Plugin } from "esbuild"
import path from "node:path"

const inlineScriptPlugin: Plugin = {
  name: "inline-script-loader",
  setup(parentBuild) {
    const absWorkingDir = parentBuild.initialOptions.absWorkingDir ?? process.cwd()

    parentBuild.onLoad({ filter: /\.inline\.ts$/ }, async (args) => {
      const esbuild = await import("esbuild")
      const fs = await import("node:fs/promises")
      let text = await fs.readFile(args.path, "utf8")
      text = text.replace(/^export default /gm, "").replace(/^export /gm, "")

      const result = await esbuild.build({
        stdin: {
          contents: text,
          loader: "ts",
          resolveDir: path.dirname(args.path),
          sourcefile: path.relative(absWorkingDir, args.path),
        },
        write: false,
        bundle: true,
        minify: true,
        platform: "browser",
        format: "esm",
        target: "es2020",
        sourcemap: false,
      })

      const js = result.outputFiles?.[0]?.text
      if (!js) throw new Error(`No browser output for ${args.path}`)
      return { contents: js, loader: "text" }
    })
  },
}

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "components/index": "src/components/index.ts",
  },
  format: ["esm"],
  dts: true,
  tsconfig: "tsconfig.build.json",
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  splitting: false,
  outDir: "dist",
  platform: "node",
  external: ["preact", "preact/hooks", "preact/jsx-runtime", "@quartz-community/types"],
  esbuildOptions(options) {
    options.jsx = "automatic"
    options.jsxImportSource = "preact"
  },
  esbuildPlugins: [inlineScriptPlugin],
})
