import { Link } from "react-router-dom";
import {
  STATUS_META,
  type StatusKey,
} from "@/lib/status-lists";

export type StatusCardGroup = {
  status: StatusKey;
  totalItems: number;
};

function StatusGroupCard({
  group,
  href,
}: {
  group: StatusCardGroup;
  href: string | null;
}) {
  const meta = STATUS_META[group.status];
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: meta.badgeBg, color: meta.color }}
        >
          {meta.subtitle}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-black tracking-tight" style={{ color: "hsl(258 24% 16%)" }}>
        {meta.title}
      </h3>
      <p className="mt-2 text-sm" style={{ color: "hsl(258 16% 40%)" }}>
        {group.totalItems} {group.totalItems === 1 ? "contenido" : "contenidos"}
      </p>
      {href ? (
        <p className="mt-4 text-xs font-semibold" style={{ color: meta.color }}>
          Ver contenidos →
        </p>
      ) : null}
    </>
  );

  if (!href) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          display: "block",
          background: "hsl(270 40% 96%)",
          border: `1.5px solid ${meta.border}`,
          boxShadow: "0 4px 20px rgba(80,15,120,0.10)",
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={href}
      className="group rounded-2xl p-5 transition-all duration-300"
      style={{
        display: "block",
        background: "hsl(270 40% 96%)",
        border: `1.5px solid ${meta.border}`,
        boxShadow: "0 4px 20px rgba(80,15,120,0.10)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(80,15,120,0.18)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(80,15,120,0.10)";
      }}
    >
      {content}
    </Link>
  );
}

type StatusCardsSectionProps = {
  groups: StatusCardGroup[];
  buildStatusHref?: (status: StatusKey) => string | null;
};

export function StatusCardsSection({
  groups,
  buildStatusHref = (status) => `/listas/mis-listas/estado/${status}`,
}: StatusCardsSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight" style={{ color: "hsl(258 24% 16%)" }}>
          Estados
        </h2>
        <span className="text-xs" style={{ color: "hsl(258 16% 45%)" }}>
          Dentro verás Películas, Series, Libros y Videojuegos
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group, i) => (
          <div key={group.status} style={{ animation: `fadeUp 0.4s ease ${i * 0.05}s both` }}>
            <StatusGroupCard group={group} href={buildStatusHref(group.status)} />
          </div>
        ))}
      </div>
    </section>
  );
}
