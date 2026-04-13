import type { TimelineItem } from "@/components/profile/profile-timeline";
import { readProfileActivity } from "@/services/profile-activity";

export type TimelineRecord = TimelineItem & { timestamp: number };

export const PROFILE_TIMELINE_DEFAULT_LIMIT = 5;
export const PROFILE_TIMELINE_HISTORY_HOURS = 72;

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateMs(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 10_000_000_000 ? value : value * 1000;
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTimelineDate(value: unknown) {
  const parsed = parseDateMs(value);
  if (!parsed) return "hace poco";
  const diffMs = Date.now() - parsed;
  if (diffMs < 60 * 1000) return "ahora";
  if (diffMs < 60 * 60 * 1000) return "hace unos minutos";
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 7) return `hace ${diffDays} días`;
  return new Date(parsed).toLocaleDateString("es-ES");
}

function normalizeTimelineType(value: unknown): TimelineItem["type"] {
  if (
    value === "comment" ||
    value === "rating" ||
    value === "service" ||
    value === "list"
  ) {
    return value;
  }
  const text = typeof value === "string" ? value.toLowerCase() : "";
  if (text.includes("comment") || text.includes("coment")) return "comment";
  if (text.includes("rating") || text.includes("valor")) return "rating";
  if (text.includes("list")) return "list";
  return "service";
}

function statusLabel(value: unknown) {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  if (normalized === "watchlist") return "Quiero ver";
  if (normalized === "in_progress") return "Viendo";
  if (normalized === "completed") return "Visto";
  if (normalized === "dropped") return "Abandonado";
  return pickString(value) ?? "";
}

function truncate(value: string, max = 120) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function collectActivityArrays(payload: any) {
  const root = payload ?? {};
  const perfil = root?.perfil ?? {};
  const result: any[] = [];
  const pushArray = (items: unknown, forcedType?: TimelineItem["type"]) => {
    if (!Array.isArray(items)) return;
    if (!forcedType) {
      result.push(...items);
      return;
    }
    result.push(
      ...items.map((item) => ({ ...(item as object), __forcedType: forcedType }))
    );
  };

  pushArray(root?.actividadReciente);
  pushArray(root?.actividad);
  pushArray(root?.timeline);
  pushArray(root?.recentActivity);
  pushArray(root?.eventos);
  pushArray(root?.ultimasAcciones);
  pushArray(root?.comentarios, "comment");
  pushArray(root?.valoraciones, "rating");
  pushArray(root?.estados, "service");
  pushArray(perfil?.actividadReciente);
  pushArray(perfil?.actividad);
  pushArray(perfil?.timeline);
  pushArray(perfil?.comentarios, "comment");
  pushArray(perfil?.valoraciones, "rating");
  pushArray(perfil?.estados, "service");
  return result;
}

function mapActivityRecord(record: any, index: number): TimelineRecord | null {
  if (!record || typeof record !== "object") return null;

  const forcedType = record.__forcedType
    ? normalizeTimelineType(record.__forcedType)
    : null;
  const inferredType =
    record?.mensaje != null ||
    record?.comentario != null ||
    record?.commentId != null
      ? "comment"
      : record?.puntuacion != null ||
          record?.rating != null ||
          record?.valoracion != null
        ? "rating"
        : record?.estado != null
          ? "service"
          : normalizeTimelineType(
              record?.type ??
                record?.tipo ??
                record?.eventType ??
                record?.accionTipo
            );
  const type = forcedType ?? inferredType;

  const contentTitle = pickString(
    record?.contenidoTitulo,
    record?.tituloContenido,
    record?.contenido?.titulo,
    record?.contenido?.title,
    record?.content?.titulo,
    record?.content?.title
  );
  const rawMessage = pickString(
    record?.mensaje,
    record?.comentario,
    record?.texto,
    record?.text
  );
  const rawStatus = statusLabel(record?.estado ?? record?.status);
  const rawRating = parseNumber(
    record?.puntuacion ?? record?.rating ?? record?.valoracion
  );

  let title =
    pickString(
      record?.title,
      record?.titulo,
      record?.accion,
      record?.label,
      record?.name
    ) ?? "";
  let detail = pickString(
    record?.detail,
    record?.detalle,
    record?.descripcion
  ) ?? "";

  if (!title) {
    if (type === "comment") {
      title = `Comentaste${contentTitle ? ` en ${contentTitle}` : ""}`;
    } else if (type === "rating") {
      title = `Valoraste${contentTitle ? ` ${contentTitle}` : " un título"}`;
    } else if (type === "list") {
      title = contentTitle
        ? `Actualizaste una lista con ${contentTitle}`
        : "Actualizaste una lista";
    } else {
      title = `Actualizaste estado${contentTitle ? ` en ${contentTitle}` : ""}`;
    }
  }

  if (!detail) {
    if (type === "comment" && rawMessage) {
      detail = `“${truncate(rawMessage)}”`;
    } else if (type === "rating" && rawRating != null) {
      detail = `${rawRating}/5`;
    } else if (type === "service" && rawStatus) {
      detail = rawStatus;
    }
  }

  const dateValue =
    record?.date ??
    record?.fecha ??
    record?.timestamp ??
    record?.createDate ??
    record?.createdAt ??
    record?.updateDate ??
    record?.updatedAt;
  const timestamp = parseDateMs(dateValue) ?? Date.now() - index;

  return {
    id: String(
      record?.id ??
        record?.commentId ??
        record?.estadoId ??
        record?.valoracionId ??
        `timeline-${index}`
    ),
    type,
    title,
    detail: detail || undefined,
    date: formatTimelineDate(timestamp),
    timestamp,
  };
}

export function mergeTimelineRecords(records: TimelineRecord[]) {
  const seen = new Set<string>();
  return records
    .filter((record) => record.title.trim())
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((record) => {
      const key = `${record.type}|${record.title}|${record.detail ?? ""}|${Math.floor(
        record.timestamp / 1000
      )}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 120);
}

export function buildTimelineFromPayload(payload: any) {
  const activityRows = collectActivityArrays(payload);
  return activityRows
    .map((record, index) => mapActivityRecord(record, index))
    .filter((record): record is TimelineRecord => record != null);
}

export function buildTimelineFromLocalActivity(username: string) {
  const rows = readProfileActivity(username);
  return rows.map((row, index) => {
    const timestamp = parseDateMs(row.date) ?? Date.now() - index;
    return {
      ...row,
      date: formatTimelineDate(timestamp),
      timestamp,
    };
  });
}
