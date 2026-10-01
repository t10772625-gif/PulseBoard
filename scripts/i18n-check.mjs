// Checks every enabled language file against the English source:
// missing keys, extra keys, and {placeholder} names that don't match.
// Usage: node scripts/i18n-check.mjs   (exit code 1 on any problem)
import { readFileSync, existsSync } from "node:fs";

const registry = JSON.parse(readFileSync("src/i18n/locales.json", "utf8")).locales;
const en = JSON.parse(readFileSync("src/i18n/messages/en.json", "utf8"));
// Argument names used by an ICU message ({name}, {n, plural, …}, {r, select, …}).
// Branch selectors (one, other, =0, …) and branch text are not arguments.
function argNames(src) {
  const names = new Set();
  let i = 0;
  function text(stopAtBrace) {
    while (i < src.length) {
      if (src[i] === "}" && stopAtBrace) return;
      if (src[i] === "{") {
        i++;
        arg();
      } else i++;
    }
  }
  function arg() {
    let name = "";
    while (i < src.length && !",}".includes(src[i])) name += src[i++];
    names.add(name.trim());
    if (src[i] === "}") return void i++;
    i++; // ,
    // skip the type (plural / select); only argument names matter here
    while (i < src.length && !",}".includes(src[i])) i++;
    if (src[i] === "}") return void i++;
    i++; // ,
    // options: selector {branch} selector {branch} … }
    while (i < src.length) {
      while (/\s/.test(src[i] ?? "")) i++;
      if (src[i] === "}") return void i++;
      while (i < src.length && src[i] !== "{" && src[i] !== "}") i++;
      if (src[i] !== "{") continue;
      i++;
      text(true);
      i++; // }
    }
  }
  text(false);
  return [...names].sort().join(",");
}
const vars = (s) => argNames(String(s));

let problems = 0;
for (const l of registry) {
  if (l.code === "en") continue;
  const file = `public/locales/${l.code}.json`;
  if (!existsSync(file)) {
    console.log(`${l.code}: missing file ${file}`);
    problems++;
    continue;
  }
  const d = JSON.parse(readFileSync(file, "utf8"));
  const missing = Object.keys(en).filter((k) => !(k in d));
  const extra = Object.keys(d).filter((k) => !(k in en));
  const badVars = Object.keys(en).filter((k) => k in d && vars(en[k]) !== vars(d[k]));
  const same = Object.keys(en).filter((k) => k in d && d[k] === en[k] && /[A-Za-z]{3,}/.test(en[k]));
  console.log(`${l.code} (${l.enabled ? "enabled" : "hidden"}, qa: ${l.qa}): ${Object.keys(d).length}/${Object.keys(en).length} keys, missing ${missing.length}, extra ${extra.length}, placeholder mismatch ${badVars.length}, identical to English ${same.length}`);
  for (const k of missing.slice(0, 20)) console.log(`  missing: ${k}`);
  for (const k of extra.slice(0, 20)) console.log(`  extra: ${k}`);
  for (const k of badVars.slice(0, 20)) console.log(`  placeholders differ: ${k}`);
  if (l.enabled) problems += missing.length + extra.length + badVars.length;
}
console.log(problems ? `FAIL: ${problems} problem(s)` : "OK");
process.exit(problems ? 1 : 0);
