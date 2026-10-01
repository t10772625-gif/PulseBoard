"use client";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";

// Embeddable public roadmap (COL-06): titles and status only, nothing internal.
export default function EmbedRoadmap() {
  const { id } = useParams<{ id: string }>();
  const { projects, tasks, getColumns, columnLabel, branding } = useStore();
  const { t } = useT();
  const p = projects[id];
  if (!p) return <p style={{ padding: 16 }}>{t("embed.notFound")}</p>;
  const cols = getColumns(id);
  return (
    <div style={{ padding: 12, fontFamily: "inherit" }}>
      <b style={{ color: branding.color }}>{t("embed.roadmap", { name: p.name })}</b>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`, gap: 8, marginTop: 8 }}>
        {cols.map(([s]) => (
          <div key={s} className="col" style={{ minWidth: 0, padding: 8 }}>
            <h3 style={{ fontSize: 13 }}>{columnLabel(id, s)}</h3>
            {tasks
              .filter((t) => t.projectId === id && t.status === s)
              .map((t) => (
                <div key={t.id} className="task" style={{ cursor: "default", padding: 8 }}>
                  <p style={{ margin: 0, fontSize: 12 }}>{t.title}</p>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
