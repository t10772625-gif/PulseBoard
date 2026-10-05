"use client";
import { useState } from "react";
import { Hash, Info, ListChecks, Plus, SlidersHorizontal, Trash2, Type } from "lucide-react";
import { useStore } from "@/lib/store";
import { CustomFieldDef } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate, { PlanTag } from "@/components/Gate";
import SettingsHeader from "@/components/SettingsHeader";
import { EmptyState } from "@/components/ui";
import FieldError, { invalid } from "@/components/FieldError";
import type { FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

const TYPE_ICON = { text: Type, number: Hash, select: ListChecks } as const;

export default function CustomFieldsSettings() {
  const s = useStore();
  const { t } = useT();
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldDef["type"]>("text");
  const [fieldOpts, setFieldOpts] = useState("");
  const [nameErr, setNameErr] = useState<FieldMsg>(null);
  const typeLabel = (type: CustomFieldDef["type"]) => (type === "text" ? t("fields.typeText") : type === "number" ? t("fields.typeNumber") : t("fields.typeSelect"));

  function add() {
    if (!fieldName.trim()) return setNameErr({ key: "fields.nameIt" });
    s.addCustomField({ name: fieldName.trim(), type: fieldType, options: fieldType === "select" ? fieldOpts.split(",").map((o) => o.trim()).filter(Boolean) : undefined });
    setFieldName("");
    setFieldOpts("");
    s.toast(t("fields.added"));
  }

  return (
    <>
      <SettingsHeader title={t("fields.title")} hint={t("fields.hint")} />
      <div className="ux-page">
        <section className="card ux-sec" aria-labelledby="cf-add">
          <div className="ux-sec-head">
            <span className="ux-icon sm" aria-hidden>
              <Plus size={18} />
            </span>
            <h2 id="cf-add">{t("fields.add")}</h2>
            <div className="ux-pills">
              <PlanTag id="CORE-19" />
            </div>
          </div>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {t("fields.addHint")}
          </p>
          <Gate id="CORE-19">
            <div className="ux-form">
              <div className="ux-inline">
                <label>
                  {t("fields.nameLabel")}
                  <input
                    placeholder={t("fields.namePlaceholder")}
                    value={fieldName}
                    maxLength={40}
                    disabled={!s.allowed("field.create")}
                    onChange={(e) => {
                      setFieldName(e.target.value);
                      setNameErr(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && add()}
                    {...invalid("err-cf-name", nameErr)}
                  />
                  <FieldError id="err-cf-name" msg={nameErr} />
                </label>
                <label>
                  {t("fields.typeLabel")}
                  <Dropdown
                    value={fieldType}
                    onChange={setFieldType}
                    disabled={!s.allowed("field.create")}
                    options={[
                      { value: "text", label: t("fields.typeText") },
                      { value: "number", label: t("fields.typeNumber") },
                      { value: "select", label: t("fields.typeSelect") },
                    ]}
                  />
                </label>
              </div>
              {fieldType === "select" && (
                <label>
                  {t("fields.optionsLabel")}
                  <input placeholder={t("fields.optionsPlaceholder")} value={fieldOpts} disabled={!s.allowed("field.create")} onChange={(e) => setFieldOpts(e.target.value)} />
                </label>
              )}
              <div className="ux-actions">
                <button className="btn" disabled={!s.allowed("field.create")} onClick={add}>
                  <Plus size={16} aria-hidden /> {t("fields.add")}
                </button>
              </div>
            </div>
          </Gate>
        </section>

        <section className="card ux-sec" aria-labelledby="cf-list">
          <div className="ux-sec-head">
            <span className="ux-icon sm" aria-hidden>
              <SlidersHorizontal size={18} />
            </span>
            <h2 id="cf-list">{t("fields.listTitle")}</h2>
            <div className="ux-pills">
              <span className="ux-conf">{t("fields.count", { n: s.customFields.length })}</span>
            </div>
          </div>
          {s.customFields.length ? (
            <div className="ux-rows">
              {s.customFields.map((f) => {
                const Icon = TYPE_ICON[f.type];
                return (
                  <div key={f.id} className="st-row">
                    <span className="st-ic" aria-hidden>
                      <Icon size={18} />
                    </span>
                    <div className="st-row-main">
                      <b>{f.name}</b>
                      {f.options?.length ? <p className="mute">{f.options.join(" · ")}</p> : null}
                    </div>
                    <span className="int-st">{typeLabel(f.type)}</span>
                    <button className="ghost sm danger" disabled={!s.allowed("field.delete")} onClick={() => s.removeCustomField(f.id)} aria-label={`${t("common.remove")}: ${f.name}`}>
                      <Trash2 size={14} aria-hidden /> {t("common.remove")}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState compact icon={<SlidersHorizontal size={26} />} title={t("fields.emptyTitle")} message={t("fields.emptyText")} />
          )}
          <p className="mute st-foot">
            <Info size={14} aria-hidden /> {s.realMode ? t("fields.savedNote") : t("fields.demoNote")}
          </p>
        </section>
      </div>
    </>
  );
}
