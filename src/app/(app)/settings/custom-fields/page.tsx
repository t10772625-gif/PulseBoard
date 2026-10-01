"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { CustomFieldDef } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";

export default function CustomFieldsSettings() {
  const s = useStore();
  const { t } = useT();
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldDef["type"]>("text");
  const [fieldOpts, setFieldOpts] = useState("");
  const typeLabel = (type: CustomFieldDef["type"]) => (type === "text" ? t("fields.typeText") : type === "number" ? t("fields.typeNumber") : t("fields.typeSelect"));

  return (
    <>
      <SettingsHeader title={t("fields.title")} hint={t("fields.hint")} />
      <div className="card">
        <h2>{t("fields.title")}</h2>
        <Gate id="CORE-19">
          {s.customFields.map((f) => (
            <div key={f.id} className="sugg">
              <span>
                <b>{f.name}</b> <span className="mute">{typeLabel(f.type)}{f.options ? `: ${f.options.join(", ")}` : ""}</span>
              </span>
              <button className="ghost sm danger" disabled={!s.canEdit} onClick={() => s.removeCustomField(f.id)}>
                {t("common.remove")}
              </button>
            </div>
          ))}
          <div className="f2" style={{ marginTop: 10 }}>
            <input placeholder={t("fields.namePlaceholder")} value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
            <Dropdown
              value={fieldType}
              onChange={setFieldType}
              options={[
                { value: "text", label: t("fields.typeText") },
                { value: "number", label: t("fields.typeNumber") },
                { value: "select", label: t("fields.typeSelect") },
              ]}
            />
          </div>
          {fieldType === "select" && <input style={{ marginTop: 8 }} placeholder={t("fields.optionsPlaceholder")} value={fieldOpts} onChange={(e) => setFieldOpts(e.target.value)} />}
          <button
            className="ghost sm"
            style={{ marginTop: 8 }}
            disabled={!s.canEdit}
            onClick={() => {
              if (!fieldName.trim()) return s.toast(t("fields.nameIt"));
              s.addCustomField({ name: fieldName.trim(), type: fieldType, options: fieldType === "select" ? fieldOpts.split(",").map((o) => o.trim()).filter(Boolean) : undefined });
              setFieldName("");
              setFieldOpts("");
            }}
          >
            {t("fields.add")}
          </button>
        </Gate>
      </div>
    </>
  );
}
