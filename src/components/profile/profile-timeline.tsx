import { ListPlus, MessageSquareText, PlusCircle, Star } from "lucide-react";

export type TimelineItem = {
  id: string;
  type: "comment" | "rating" | "service" | "list";
  title: string;
  detail?: string;
  date: string;
};

type ProfileTimelineProps = {
  items: TimelineItem[];
  actionLabel?: string;
  showAction?: boolean;
  onAction?: () => void;
  titleClassName?: string;
  centerTitle?: boolean;
};

export function ProfileTimeline({
  items,
  actionLabel = "Ver más",
  showAction = false,
  onAction,
  titleClassName,
  centerTitle = false,
}: ProfileTimelineProps) {
  const headingClassName = titleClassName ?? "text-xl font-semibold text-gray-900";

  return (
    <section>
      {centerTitle ? (
        <h2 className={headingClassName}>Actividad reciente</h2>
      ) : (
        <h2 className={headingClassName}>Actividad reciente</h2>
      )}

      <div className="relative mt-4 pl-8">
        <div className="absolute left-3 top-0 h-full w-px bg-violet-100" />
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-6 text-sm text-gray-600">
              Aquí aparecerán tus últimas valoraciones, comentarios y categorías
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

      {showAction ? (
        <div className={`mt-4 flex ${centerTitle ? "justify-center" : "justify-end"}`}>
          <button
            type="button"
            onClick={onAction}
            className="text-sm font-medium text-violet-700 hover:text-violet-800"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}
