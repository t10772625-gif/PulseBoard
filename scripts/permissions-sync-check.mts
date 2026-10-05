// Checks that the role defaults in the app (src/lib/permissions.ts) and in the database
// (default_permission() in supabase/migrations/26_granular-permissions/…2610) are the same,
// and that every permission key is allowed by the role_permissions CHECK in that file.
// Usage: node --experimental-strip-types scripts/permissions-sync-check.mts
//        add --print to print the SQL lists to paste into …2610 after changing the defaults.
import { readFileSync, readdirSync } from "node:fs";
import { DEFAULT_PERMISSIONS, PERMISSIONS, type Role } from "../src/lib/permissions.ts";

const dir = "supabase/migrations/26_granular-permissions";
const file = readdirSync(dir).find((f) => f.includes("_update_default_permissions"));
if (!file) throw new Error("…2610_update_default_permissions.sql not found");
const sql = readFileSync(`${dir}/${file}`, "utf8");

const keysFor = (role: Role) => PERMISSIONS.map((p) => p.key).filter((k) => DEFAULT_PERMISSIONS[role][k]);
const sqlList = (keys: string[]) => keys.map((k) => `'${k}'`).join(", ");

if (process.argv.includes("--print")) {
  for (const r of ["Sub Admin", "Member", "Viewer"] as Role[]) console.log(`-- ${r}\n${sqlList(keysFor(r))}\n`);
  process.exit(0);
}

let failed = 0;
const fail = (msg: string) => {
  failed++;
  console.log("FAIL", msg);
};

// when r = 'Sub Admin' then perm in (...)   /   else perm in (...)
const block = (label: string) => {
  const re = label === "Viewer" ? /else perm in \(([^)]*)\)/ : new RegExp(`when r = '${label}' then perm in \\(([^)]*)\\)`);
  const m = sql.match(re);
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).filter((k) => !k.endsWith(".manage")); // legacy aliases
};
for (const r of ["Sub Admin", "Member", "Viewer"] as Role[]) {
  const db = block(r);
  if (!db) {
    fail(`${r}: list not found in ${file}`);
    continue;
  }
  const app = keysFor(r);
  for (const k of app) if (!db.includes(k)) fail(`${r}: '${k}' is on in the app but not in the database`);
  for (const k of db) if (!app.includes(k)) fail(`${r}: '${k}' is on in the database but not in the app`);
}

const check = sql.match(/permission ~ '([^']+)'/);
if (!check) fail("role_permissions CHECK regex not found");
else {
  const re = new RegExp(check[1].replace(/\\\\/g, "\\"));
  for (const p of PERMISSIONS) if (!re.test(p.key)) fail(`'${p.key}' is rejected by the role_permissions CHECK`);
}

console.log(failed ? `${failed} problem(s)` : `OK: ${PERMISSIONS.length} permissions, app and database defaults match`);
process.exit(failed ? 1 : 0);
