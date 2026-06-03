import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";

// Resolve the next pnpm dir dynamically — its version is in the folder name,
// so a hardcoded path breaks on every Next.js bump.
const pnpmDir = ".open-next/server-functions/default/node_modules/.pnpm";
const nextInstrumentationTargets = existsSync(pnpmDir)
  ? readdirSync(pnpmDir)
      .filter((d) => d.startsWith("next@"))
      .map(
        (d) =>
          `${pnpmDir}/${d}/node_modules/next/dist/server/lib/router-utils/instrumentation-globals.external.js`,
      )
  : [];

const targets = [
  ".open-next/server-functions/default/handler.mjs",
  ...nextInstrumentationTargets,
];

const dynamicInstrumentationRequire =
  /return cachedInstrumentationModule=\(0,_interopdefault\.interopDefault\)\(await require\(_nodepath\.default\.join\([^)]*\)\)\),cachedInstrumentationModule/g;

let replacements = 0;

for (const target of targets) {
  if (!existsSync(target)) {
    continue;
  }

  const before = readFileSync(target, "utf8");
  const after = before.replace(
    dynamicInstrumentationRequire,
    "return cachedInstrumentationModule={},cachedInstrumentationModule",
  );

  if (after !== before) {
    writeFileSync(target, after);
    replacements += 1;
  }
}

if (replacements === 0) {
  const handler = readFileSync(targets[0], "utf8");
  if (handler.includes("require(_nodepath.default.join")) {
    throw new Error("OpenNext instrumentation patch did not match generated output");
  }

  console.log("OpenNext instrumentation dynamic require already patched.");
} else {
  console.log(`Patched OpenNext instrumentation dynamic require (${replacements} file(s)).`);
}
