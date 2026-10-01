// Unit cases for the ICU message subset in src/i18n/icu.ts (no test runner needed).
// Usage: node --experimental-strip-types scripts/i18n-icu-test.mts
import { formatMessage as f } from "../src/i18n/icu.ts";
const cases: [string, Record<string, string | number>, string, string][] = [
  ["Hello {name}", { name: "Sara" }, "en", "Hello Sara"],
  ["{n, plural, =0 {No tasks} one {# task} other {# tasks}}", { n: 0 }, "en", "No tasks"],
  ["{n, plural, =0 {No tasks} one {# task} other {# tasks}}", { n: 1 }, "en", "1 task"],
  ["{n, plural, =0 {No tasks} one {# task} other {# tasks}}", { n: 1234 }, "en", "1,234 tasks"],
  ["{n, plural, one {# کام} other {# کام}}", { n: 3 }, "ur-PK", "3 کام"],
  ["{r, select, owner {Owner {name}} other {Member}}", { r: "owner", name: "A" }, "en", "Owner A"],
  ["{r, select, owner {Owner} other {Member}}", { r: "x" }, "en", "Member"],
  ["Due {d} · {n, plural, one {# comment} other {# comments}} by {who}", { d: "Oct 1", n: 2, who: "Ali" }, "en", "Due Oct 1 · 2 comments by Ali"],
  ["It's #1 rank", {}, "en", "It's #1 rank"],
  ["{missing} ok", {}, "en", " ok"],
];
let fail = 0;
for (const [m, v, l, want] of cases) { const got = f(m, v, l); if (got !== want) { fail++; console.log("FAIL", JSON.stringify(m), "=>", JSON.stringify(got), "want", JSON.stringify(want)); } }
console.log(`${cases.length - fail}/${cases.length} passed`);
if (fail) process.exit(1);
