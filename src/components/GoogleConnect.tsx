"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Info, Mail, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { disconnectGoogle, googleConnection, serverSetup, type GoogleConnection } from "@/lib/integrations";
import { SecHead } from "./FeaturePage";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

const RESULT: Record<string, MessageKey> = {
  connected: "int.gConnected",
  error: "int.gError",
  scopes: "int.gScopes",
  setup: "int.gSetup",
};

function Inner() {
  const { toast } = useStore();
  const { t } = useT();
  const params = useSearchParams();
  const [conn, setConn] = useState<GoogleConnection>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const reload = useCallback(() => googleConnection().then(setConn), []);
  useEffect(() => {
    void reload();
    void serverSetup().then((s) => setConfigured(!!s?.google));
  }, [reload]);
  const result = params.get("google");

  return (
    <section className="card ux-sec" aria-labelledby="gc-h">
      <SecHead id="gc-h" icon={Mail} title={t("int.gTitle")}>
        {conn ? <span className="int-st connected">{t("int.st.connected")}</span> : configured === false ? <span className="int-st setup">{t("int.st.setup")}</span> : <span className="int-st available">{t("int.st.available")}</span>}
      </SecHead>
      <p className="mute" style={{ margin: 0, fontSize: 13 }}>
        {t("int.gHint")}
      </p>
      {result && RESULT[result] && <p className={result === "connected" ? "approval approved" : "warn"}>{t(RESULT[result])}</p>}
      {conn ? (
        <div className="ux-result">
          <b dir="ltr" style={{ textAlign: "start" }}>
            {conn.account_email}
          </b>
          <span className="mute" style={{ fontSize: 12 }}>
            {[conn.scopes.includes("gmail.send") && t("int.gSend"), conn.scopes.includes("calendar.freebusy") && t("int.gBusy")].filter(Boolean).join(" · ")}
          </span>
          <div className="ux-actions">
            <button
              className="ghost sm danger"
              onClick={async () => {
                if (!window.confirm(t("int.gDisconnectConfirm"))) return;
                const res = await disconnectGoogle();
                if (!res.ok) return toast(t("store.saveFailed"));
                void reload();
                toast(t("int.gDisconnected"));
              }}
            >
              {t("int.gDisconnect")}
            </button>
          </div>
        </div>
      ) : configured === false ? (
        <p className="st-demo-warn" style={{ margin: 0 }}>
          <Info size={14} aria-hidden /> {t("int.gSetup")}
        </p>
      ) : (
        <div className="ux-actions">
          {/* Full page navigation: the server route sets the OAuth state cookie and redirects to Google */}
          <a className="btn" href="/api/integrations/google/start">
            {t("int.gConnect")}
          </a>
        </div>
      )}
      <p className="mute st-foot" style={{ marginTop: 0 }}>
        <ShieldCheck size={14} aria-hidden /> {t("int.gPrivacy")}
      </p>
    </section>
  );
}

// Your own Google account: send task emails from your Gmail, share free/busy times
export default function GoogleConnect() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
