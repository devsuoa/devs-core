// Generates kb/assets/dependency-graph.svg: every module in src/ and what it imports.
// Graphviz runs as WebAssembly (@viz-js/viz), so no system install of `dot` is needed.
import { writeFile } from "node:fs/promises";
import { cruise } from "dependency-cruiser";
import extractTSConfig from "dependency-cruiser/config-utl/extract-ts-config";
import { instance } from "@viz-js/viz";

const OUTPUT = "kb/assets/dependency-graph.svg";

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
await writeFile(OUTPUT, viz.renderString(result.output, { format: "svg" }));
console.log(`Dependency graph written to ${OUTPUT}`);
