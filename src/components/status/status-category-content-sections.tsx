import ContentCard from "@/components/content-card";
import { buildDetailPath } from "@/lib/detail-route";
import {
  CATEGORY_LABELS,
  type CategoryKey,
} from "@/lib/status-lists";
import type { BackendContenidoListado } from "@/services/lists-service";

export type StatusCategorySection = {
  category: CategoryKey;
  items: Array<BackendContenidoListado & { tipo: string }>;
};

export function StatusCategoryContentSections({
  sections,
}: {
  sections: StatusCategorySection[];
}) {
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.category}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight" style={{ color: "hsl(258 24% 16%)" }}>
              {CATEGORY_LABELS[section.category]}
            </h2>
            <span className="text-xs" style={{ color: "hsl(258 16% 45%)" }}>
              {section.items.length} {section.items.length === 1 ? "contenido" : "contenidos"}
            </span>
          </div>

          {section.items.length === 0 ? (
            <div
              className="rounded-3xl p-6 max-w-md"
              style={{
                background: "hsl(270 40% 96%)",
                border: "1.5px solid hsl(270 30% 88%)",
              }}
            >
              <p className="text-sm" style={{ color: "hsl(258 16% 40%)" }}>
                No hay contenidos en esta categoría.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 items-stretch">
              {section.items.map((item, i) => (
                <div
                  key={`${section.category}-${item.id}`}
                  className="flex"
                  style={{ animation: `fadeUp 0.35s ease ${i * 0.04}s both` }}
                >
                  <ContentCard
                    title={item.titulo}
                    image={item.portada ?? undefined}
                    type={item.tipo}
                    score={item.puntuacion ?? item.puntuacionApi}
                    to={buildDetailPath(item.tipo, item.id, item.titulo)}
                    state={{ item: { id: item.id, titulo: item.titulo, tipo: item.tipo } }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
