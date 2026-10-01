"use client";
import { Check, Minus } from "lucide-react";
import { PRICING_GROUPS, type Cell, type FeatureStatus } from "@/lib/pricing";
import { useT } from "@/i18n/I18nProvider";
import { PLAN_ORDER } from "./PlanCards";

function CellView({ v }: { v: Cell }) {
  const { t } = useT();
  if (v === true)
    return (
      <span className="pr-yes">
        <Check size={16} aria-hidden />
        <span className="sr">{t("pricing.included")}</span>
      </span>
    );
  if (v === false)
    return (
      <span className="pr-no">
        <Minus size={16} aria-hidden />
        <span className="sr">{t("pricing.notIncluded")}</span>
      </span>
    );
  return <span className="pr-val">{t(v)}</span>;
}

export function StatusChip({ s }: { s: FeatureStatus }) {
  const { t } = useT();
  return (
    <span className={`pr-status pr-st-${s}`} title={t(`pricing.statusHint.${s}`)}>
      {t(`pricing.status.${s}`)}
    </span>
  );
}

export default function CompareTable() {
  const { t } = useT();
  return (
    <div className="pr-table-wrap">
      <table className="pr-table">
        <caption className="sr">{t("pricing.tableCaption")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("pricing.colFeature")}</th>
            {PLAN_ORDER.map((p) => (
              <th scope="col" key={p} className={`pr-col-${p}`}>
                {t(`plan.${p}`)}
              </th>
            ))}
            <th scope="col">{t("pricing.colStatus")}</th>
          </tr>
        </thead>
        {PRICING_GROUPS.map((g) => (
          <tbody key={g.title}>
            <tr className="pr-group">
              <th scope="colgroup" colSpan={5}>
                {t(g.title)}
              </th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">
                  {t(r.label)}
                  {r.note && <small>{t(r.note)}</small>}
                </th>
                <td>
                  <CellView v={r.basic} />
                </td>
                <td>
                  <CellView v={r.pro} />
                </td>
                <td className="pr-col-enterprise">
                  <CellView v={r.enterprise} />
                </td>
                <td>
                  <StatusChip s={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
