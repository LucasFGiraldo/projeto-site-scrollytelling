// Renderiza frames de verificacao (PNG) da composicao, reaproveitando um unico bundle.
// Uso: node scripts/stills.mjs 80 183 285 ...   (numeros de frame)
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const publicDir = path.resolve(root, "../assets/videos");
const outDir = path.resolve(root, "../_tmp/stills");

const frames = process.argv.slice(2).map(Number);
if (frames.length === 0) throw new Error("Passe ao menos um numero de frame.");

const serveUrl = await bundle({
  entryPoint: path.join(root, "src/index.ts"),
  publicDir,
});
const composition = await selectComposition({
  serveUrl,
  id: "PlanoSequencia",
});

for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(4, "0")}.png`);
  await renderStill({
    composition,
    serveUrl,
    frame,
    output,
    overwrite: true,
    imageFormat: "png",
  });
  console.log("ok", frame);
}
