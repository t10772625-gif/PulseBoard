// Unit cases for the CSV formula-injection guard in src/lib/csv.ts.
// Usage: node --experimental-strip-types scripts/csv-safety-test.mts
import { toCsv, safeCell } from "../src/lib/csv.ts";
const cases: [string|number, string][] = [["=SUM(A1)", "'=SUM(A1)"], ["+1", "'+1"], ["-cmd", "'-cmd"], ["@x", "'@x"], [-5, "-5"], ["Hello", "Hello"], ["a,b", "a,b"]];
let f=0; for (const [i,w] of cases) { const g=safeCell(i); if (g!==w) { f++; console.log("FAIL",i,g,w);} }
if (toCsv([["=1+1","x"]]) !== "'=1+1,x") { f++; console.log("FAIL row", toCsv([["=1+1","x"]])); }
console.log((cases.length+1-f)+"/"+(cases.length+1)+" passed"); if (f) process.exit(1);
