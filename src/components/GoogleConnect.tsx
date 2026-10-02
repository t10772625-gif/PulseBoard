"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { disconnectGoogle, googleConnection, serverSetup, type GoogleConnection } from "@/lib/integrations";
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
    <div className="card">
      <h2>{t("int.gTitle")}</h2>
      <p className="mute" style={{ fontSize: 13, marginBottom: 8 }}>
        {t("int.gHint")}
      </p>
      {result && RESULT[result] && <p className={result === "connected" ? "approval approved" : "warn"}>{t(RESULT[result])}</p>}
      {conn ? (
        <div className="sugg">
          <span>
            <b dir="ltr">{conn.account_email}</b>
            <br />
            <span className="mute" style={{ fontSize: 12 }}>
              {[conn.scopes.includes("gmail.send") && t("int.gSend"), conn.scopes.includes("calendar.freebusy") && t("int.gBusy")].filter(Boolean).join(" · ")}
            </span>
          </span>
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
      ) : configured === false ? (
        <p className="mute">{t("int.gSetup")}</p>
      ) : (
        // Full page navigation: the server route sets the OAuth state cookie and redirects to Google
        <a className="btn sm" href="/api/integrations/google/start">
          {t("int.gConnect")}
        </a>
      )}
      <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>
        {t("int.gPrivacy")}
      </p>
    </div>
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
