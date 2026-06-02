import { existsSync, readFileSync, writeFileSync } from "node:fs";

const targets = [
  ".open-next/server-functions/default/handler.mjs",
  ".open-next/server-functions/default/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/lib/router-utils/instrumentation-globals.external.js",
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
