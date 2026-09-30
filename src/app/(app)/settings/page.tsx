"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import { download, toCsv } from "@/lib/csv";
import Link from "next/link";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { CustomFieldDef, Plan } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import { SettingRow, Switch } from "@/components/ui";


const API: [string, string, string][] = [
  ["GET", "/api/boards", "List boards you can access"],
  ["POST", "/api/boards", "Create a board"],
  ["GET", "/api/boards/:id/tasks", "List tasks (supports ?q= search)"],
  ["POST", "/api/tasks", "Create a task"],
  ["PATCH", "/api/tasks/:id", "Update fields (status, priority, assignee…)"],
  ["POST", "/api/tasks/:id/assign/smart", "Smart Matching suggestion"],
  ["POST", "/api/webhooks", "Register an outgoing webhook"],
];

export default function Settings() {
  const s = useStore();
  const router = useRouter();
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldDef["type"]>("text");
  const [fieldOpts, setFieldOpts] = useState("");
  const [otp, setOtp] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const setupCode = "JBSW Y3DP EHPK 3PXP";

  const counts = {
    boards: Object.keys(s.projects).length,
    members: Object.keys(s.members).length,
  };

  return (
    <>
      <div className="top">
        <div>
          <h1>Settings</h1>
          <p className="mute">Workspace plan, permissions, security, branding and data.</p>
        </div>
      </div>

      <div className="grid g2">
        <div className="card" id="plan">
          <h2>Plan</h2>
          <p className="mute" style={{ fontSize: 12, marginBottom: 10 }}>
            Demo switcher: no payment is taken (billing isn&apos;t connected yet). Free = basic core, Pro = AI, views and integrations, Legendary = Smart Matching and the big features.
          </p>
          <div className="grid g2">
            {(Object.keys(PLANS) as Plan[]).map((p) => (
              <button key={p} className={`card pc ${s.plan === p ? "sel-plan" : ""}`} disabled={s.myRole !== "Owner" || s.realMode} onClick={() => s.setPlan(p)}>
                <b>{PLANS[p].name}</b>
                <p className="mute">{PLANS[p].price}</p>
                <p className="mute" style={{ fontSize: 11 }}>
                  {PLANS[p].boards === Infinity ? "Unlimited boards" : `${PLANS[p].boards} boards`} ·{" "}
                  {PLANS[p].members === Infinity ? "unlimited members" : `${PLANS[p].members} members`} · {PLANS[p].storageGb} GB · AI {PLANS[p].aiPerMonth === 0 ? "off" : `${PLANS[p].aiPerMonth}/mo`} · {PLANS[p].support} support
                </p>
              </button>
            ))}
          </div>
          <p className="mute" style={{ fontSize: 13, marginTop: 10 }}>
            Usage: {counts.boards} boards · {counts.members} members · {s.aiUses} AI actions this month
            {s.plan === "free" && (counts.boards > PLANS.free.boards || counts.members > PLANS.free.members) && <b style={{ color: "var(--bad)" }}> · over Free limits</b>}
          </p>
        </div>

        <div className="card">
          <h2>Roles &amp; permissions</h2>
          <SettingRow title={`Your role: ${s.myRole}`} hint="Pages and actions for each role are set in the permission matrix. The database enforces the same rules (Row Level Security).">
            {s.allowed("member.manage") ? (
              <Link className="btn sm" href="/settings/permissions">
                Open matrix
              </Link>
            ) : (
              <span className="chip">View only</span>
            )}
          </SettingRow>
          <table className="tbl" style={{ marginTop: 8 }}>
            <tbody>
              <tr>
                <th>Role</th>
                <th>Pages</th>
                <th>Actions</th>
              </tr>
              {ROLES.map((r) => {
                const row = s.permissions[r];
                const pages = PERMISSIONS.filter((p) => p.group === "Pages" && (r === "Owner" || row[p.key])).length;
                const actions = PERMISSIONS.filter((p) => p.group !== "Pages" && (r === "Owner" || row[p.key])).length;
                return (
                  <tr key={r} style={{ cursor: "default" }}>
                    <td>
                      <b>{r}</b>
                    </td>
                    <td>
                      {pages}/{PERMISSIONS.filter((p) => p.group === "Pages").length}
                    </td>
                    <td>
                      {actions}/{PERMISSIONS.filter((p) => p.group !== "Pages").length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(s.myRole === "Owner" || s.myRole === "Admin") && (
            <label style={{ marginTop: 12 }}>
              Preview the app as
              <Dropdown
                value={s.viewAsRole}
                onChange={s.setViewAsRole}
                // You can only preview your own role or a lower one
                options={ROLES.slice(ROLES.indexOf(s.myRole)).map((r) => ({ value: r, label: r === s.myRole ? `${r} (you)` : r }))}
              />
            </label>
          )}
          <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>
            Editing the matrix needs the{" "}
            <Gate id="SEC-05" compact>
              <b>Legendary</b>
            </Gate>{" "}
            plan; lower plans use the default permissions.
          </p>
        </div>

        <div className="card">
          <h2>Security</h2>
          <SettingRow title="Two-factor authentication" hint={s.twoFactor ? "On — a code from your authenticator app is required at sign-in." : "Add a second step at sign-in with an authenticator app."}>
            <Switch
              label="Two-factor authentication"
              checked={s.twoFactor || setupOpen}
              onChange={(v) => {
                if (v) {
                  setOtp("");
                  setSetupOpen(true);
                } else {
                  s.setTwoFactor(false);
                  setSetupOpen(false);
                  s.toast("Two-factor authentication turned off");
                }
              }}
            />
          </SettingRow>
          {setupOpen && !s.twoFactor && (
            <div className="ai-out">
              <p style={{ fontSize: 13 }}>Add this key to Google Authenticator, then enter the 6-digit code:</p>
              <p className="code" style={{ margin: "6px 0" }}>
                {setupCode}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input inputMode="numeric" maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                <button
                  className="btn sm"
                  onClick={() => {
                    if (otp.length !== 6) return s.toast("Enter the 6-digit code");
                    s.setTwoFactor(true);
                    setSetupOpen(false);
                    s.toast("2FA enabled (demo — real TOTP verification comes with Supabase Auth)");
                  }}
                >
                  Verify
                </button>
              </div>
            </div>
          )}
          <h3 style={{ marginTop: 14 }}>Active sessions</h3>
          {[
            ["This browser", "Windows · now", true],
            ["iPhone · Safari", "2 hours ago", false],
          ].map(([d, w, current]) => (
            <div key={String(d)} className="sugg">
              <span>
                <b>{d}</b> <span className="mute">{w}</span>
              </span>
              {current ? <span className="chip">current</span> : <button className="ghost sm" onClick={() => s.toast("Session signed out (demo)")}>Sign out</button>}
            </div>
          ))}
          <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>Google / GitHub sign-in and password reset arrive with Supabase Auth.</p>
        </div>

        <div className="card">
          <h2>Custom fields</h2>
          <Gate id="CORE-19">
            {s.customFields.map((f) => (
              <div key={f.id} className="sugg">
                <span>
                  <b>{f.name}</b> <span className="mute">{f.type}{f.options ? `: ${f.options.join(", ")}` : ""}</span>
                </span>
                <button className="ghost sm danger" disabled={!s.canEdit} onClick={() => s.removeCustomField(f.id)}>
                  Remove
                </button>
              </div>
            ))}
            <div className="f2" style={{ marginTop: 10 }}>
              <input placeholder="Field name" value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
              <Dropdown
                value={fieldType}
                onChange={setFieldType}
                options={[
                  { value: "text", label: "Text" },
                  { value: "number", label: "Number" },
                  { value: "select", label: "Dropdown" },
                ]}
              />
            </div>
            {fieldType === "select" && <input style={{ marginTop: 8 }} placeholder="Options, comma separated" value={fieldOpts} onChange={(e) => setFieldOpts(e.target.value)} />}
            <button
              className="ghost sm"
              style={{ marginTop: 8 }}
              disabled={!s.canEdit}
              onClick={() => {
                if (!fieldName.trim()) return s.toast("Name the field");
                s.addCustomField({ name: fieldName.trim(), type: fieldType, options: fieldType === "select" ? fieldOpts.split(",").map((o) => o.trim()).filter(Boolean) : undefined });
                setFieldName("");
                setFieldOpts("");
              }}
            >
              Add field
            </button>
          </Gate>
        </div>

        <div className="card">
          <h2>Branding &amp; white label</h2>
          <Gate id="ADV-02">
            <div className="f2">
              <label>
                Brand name
                <input value={s.branding.name} onChange={(e) => s.setBranding({ name: e.target.value })} />
              </label>
              <label>
                Brand color
                <input type="color" value={s.branding.color} onChange={(e) => s.setBranding({ color: e.target.value })} />
              </label>
            </div>
            <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>Used on client portals, shared links and client reports.</p>
          </Gate>
          <h3 style={{ marginTop: 14 }}>Custom domain</h3>
          <Gate id="ADV-01">
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="clients.youragency.com" value={s.branding.domain} onChange={(e) => s.setBranding({ domain: e.target.value.trim().toLowerCase(), domainStatus: "none" })} />
              <button
                className="ghost sm"
                onClick={() => {
                  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s.branding.domain)) return s.toast("Enter a valid domain");
                  s.setBranding({ domainStatus: "pending" });
                }}
              >
                Verify
              </button>
            </div>
            {s.branding.domainStatus === "pending" && (
              <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>
                Add a CNAME record <span className="code">{s.branding.domain} → portals.pulseboard.app</span>. Verification and the TLS certificate are issued by the hosting provider once the backend is live.
              </p>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>Language</h2>
          <Dropdown
            value={s.language}
            onChange={(v) => {
              s.setLanguage(v);
              document.documentElement.lang = v;
              document.documentElement.dir = v === "ur" ? "rtl" : "ltr";
            }}
            options={[
              { value: "en", label: "English" },
              { value: "ur", label: "اردو (Urdu, right-to-left)" },
            ]}
          />
          <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>Urdu switches the layout direction and translates the navigation. Full translation of every screen is still to do.</p>
        </div>

        <div className="card">
          <h2>Your data</h2>
          <div className="pill-row">
            <button
              className="ghost sm"
              disabled={!s.allowed("data.export")}
              title={s.allowed("data.export") ? undefined : "Your role can't export workspace data"}
              onClick={() => {
                download("pulseboard-export.json", s.exportData(), "application/json");
                s.toast("Your data was exported");
              }}
            >
              ⬇ Export all my data (GDPR)
            </button>
          </div>
          <h3 style={{ marginTop: 14 }}>Backup &amp; restore</h3>
          <Gate id="ADV-05">
            <div className="pill-row">
              <button className="ghost sm" onClick={() => download(`backup-${new Date().toISOString().slice(0, 10)}.json`, s.exportData(), "application/json")}>
                Create backup
              </button>
              <label className="ghost sm" style={{ cursor: "pointer" }}>
                Restore from backup
                <input
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (!window.confirm("Restore replaces everything in this workspace with the backup. Continue?")) return;
                    f.text().then((t) => s.toast(s.importData(t) ? "Workspace restored" : "That file isn't a PulseBoard backup"));
                  }}
                />
              </label>
            </div>
          </Gate>
          <h3 style={{ marginTop: 14 }}>Account</h3>
          <div className="pill-row">
            <button
              className="ghost sm"
              onClick={async () => {
                if (!window.confirm("Deactivate your account? You can reactivate by signing in again.")) return;
                await s.logout();
                router.push("/login");
              }}
            >
              Deactivate
            </button>
            <button
              className="ghost sm danger"
              onClick={() => {
                if (window.prompt('Type "DELETE" to permanently delete your account') !== "DELETE") return;
                s.toast("Deletion requested (demo): personal data would be erased and audit entries anonymized");
              }}
            >
              Delete account
            </button>
          </div>
        </div>

        <div className="card">
          <div className="meta">
            <h2 style={{ margin: 0 }}>Audit log</h2>
            <Gate id="CORE-17-EXPORT" compact>
              <button
                className="ghost sm"
                onClick={() => download("audit-log.csv", toCsv([["Time", "Actor", "Event", "Task"], ...s.audit.map((a) => [new Date(a.at).toISOString(), s.members[a.actor].name, a.message, a.taskId ?? ""])]))}
              >
                Export CSV
              </button>
            </Gate>
          </div>
          {s.audit.length ? (
            s.audit.slice(0, 12).map((a) => (
              <p key={a.id} className="act-item" style={{ fontSize: 13 }}>
                <span className="mute">{new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> {s.members[a.actor].name}: {a.message}
              </p>
            ))
          ) : (
            <p className="mute">Changes you make this session appear here.</p>
          )}
        </div>

        <div className="card">
          <h2>API</h2>
          <Gate id="ADV-03">
            <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>Planned REST endpoints (the Node/Express backend isn&apos;t built yet). Rate limited per key.</p>
            <table className="tbl">
              <tbody>
                {API.map(([m, p, d]) => (
                  <tr key={m + p}>
                    <td>
                      <b>{m}</b>
                    </td>
                    <td className="code">{p}</td>
                    <td>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Gate>
        </div>
      </div>
    </>
  );
}
