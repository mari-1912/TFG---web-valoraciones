import { ListPlus, MessageSquareText, PlusCircle, Star } from "lucide-react";

export type TimelineItem = {
  id: string;
  type: "comment" | "rating" | "service" | "list";
  title: string;
  detail?: string;
  date: string;
};

export const DEFAULT_TIMELINE: TimelineItem[] = [
  {
    id: "t-1",
    type: "comment",
    title: "Comentaste en Dune",
    detail: "“Fotografía impecable y ritmo constante.”",
    date: "Hace 2 días",
  },
  {
    id: "t-2",
    type: "rating",
    title: "Valoraste Arcane",
    detail: "4.5/5",
    date: "Hace 4 días",
  },
  {
    id: "t-3",
    type: "service",
    title: "Añadiste a favoritos: The Witcher 3",
    detail: "Videojuegos",
    date: "Hace 1 semana",
  },
  {
    id: "t-4",
    type: "list",
    title: "Añadiste un servicio a tu lista",
    detail: "Mis listas • Fantasía oscura",
    date: "Hace 2 semanas",
  },
];

type ProfileTimelineProps = {
  items: TimelineItem[];
};

export function ProfileTimeline({ items }: ProfileTimelineProps) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Actividad reciente
        </h2>
        <button
          type="button"
          className="text-sm font-medium text-violet-700 hover:text-violet-800"
        >
          Ver todo
        </button>
      </div>

      <div className="relative mt-4 pl-8">
        <div className="absolute left-3 top-0 h-full w-px bg-violet-100" />
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-6 text-sm text-gray-600">
              Aquí aparecerán tus últimas valoraciones, comentarios y servicios
              añadidos.
            </div>
          ) : (
            items.map((item) => {
              const Icon =
                item.type === "comment"
                  ? MessageSquareText
                  : item.type === "rating"
                  ? Star
                  : item.type === "service"
                  ? PlusCircle
                  : ListPlus;
              return (
                <div key={item.id} className="relative">
                  <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-600 shadow-sm">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.title}
                          </p>
                          {item.detail && (
                            <p className="mt-1 text-sm text-gray-600">
                              {item.detail}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
