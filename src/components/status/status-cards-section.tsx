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
  title?: string;
  helperText?: string;
  stackHeader?: boolean;
  titleClassName?: string;
  helperTextClassName?: string;
};

export function StatusCardsSection({
  groups,
  buildStatusHref = (status) => `/listas/mis-listas/estado/${status}`,
  title = "Estados",
  helperText = "Aquí aparecen las listas de progreso y las listas creadas por el usuario",
  stackHeader = false,
  titleClassName,
  helperTextClassName,
}: StatusCardsSectionProps) {
  const hasHelperText =
    typeof helperText === "string" ? helperText.trim().length > 0 : Boolean(helperText);
  const resolvedTitleClassName =
    titleClassName ?? "text-xl font-black tracking-tight";
  const resolvedHelperClassName =
    helperTextClassName ??
    (stackHeader
      ? "mt-1 text-sm text-gray-600"
      : "text-xs");

  return (
    <section>
      {stackHeader ? (
        <div className="mb-4 text-center">
          <h2 className={resolvedTitleClassName} style={{ color: "hsl(258 24% 16%)" }}>
            {title}
          </h2>
          {hasHelperText ? (
            <p className={resolvedHelperClassName}>{helperText}</p>
          ) : null}
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <h2 className={resolvedTitleClassName} style={{ color: "hsl(258 24% 16%)" }}>
            {title}
          </h2>
          {hasHelperText ? (
            <span className={resolvedHelperClassName} style={{ color: "hsl(258 16% 45%)" }}>
              {helperText}
            </span>
          ) : null}
        </div>
      )}
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
