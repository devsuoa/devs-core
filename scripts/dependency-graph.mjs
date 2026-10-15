// Generates kb/assets/dependency-graph.svg: every module in apps/web/src and what it imports.
// Graphviz runs as WebAssembly (@viz-js/viz), so no system install of `dot` is needed.
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cruise } from "dependency-cruiser";
import extractTSConfig from "dependency-cruiser/config-utl/extract-ts-config";
import { instance } from "@viz-js/viz";

const OUTPUT = "kb/assets/dependency-graph.svg";
const outputPath = resolve(OUTPUT);

// dependency-cruiser resolves tsconfig `include` paths from the cwd, so cruise from inside the app.
process.chdir("apps/web");

const result = await cruise(
  ["src"],
  {
    includeOnly: "^src",
    outputType: "dot",
    tsConfig: { fileName: "tsconfig.json" },
  },
  {},
  { tsConfig: extractTSConfig("tsconfig.json") },
);

const viz = await instance();
await writeFile(outputPath, viz.renderString(result.output, { format: "svg" }));
console.log(`Dependency graph written to ${OUTPUT}`);
