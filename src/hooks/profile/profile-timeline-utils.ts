import type { TimelineItem } from "@/components/profile/profile-timeline";

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
  if (
    text.includes("comment") ||
    text.includes("coment") ||
    text.includes("reply") ||
    text.includes("respuest")
  ) {
    return "comment";
  }
  if (text.includes("rating") || text.includes("valor")) return "rating";
  if (text.includes("list") || text.includes("lista")) return "list";
  return "service";
}

function statusLabel(value: unknown) {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  if (normalized === "watchlist") return "Pendientes";
  if (normalized === "in_progress") return "Viendo";
  if (normalized === "completed") return "Visto";
  if (normalized === "dropped") return "Abandonado";
  return pickString(value) ?? "";
}

function formatListName(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (
    normalized.startsWith("pendientes") ||
    normalized.startsWith("watchlist")
  ) {
    return "Pendientes";
  }
  if (
    normalized.startsWith("en_progreso") ||
    normalized.startsWith("en progreso") ||
    normalized.startsWith("in_progress")
  ) {
    return "En progreso";
  }
  if (
    normalized.startsWith("completado") ||
    normalized.startsWith("completados") ||
    normalized.startsWith("finalizado") ||
    normalized.startsWith("finalizados") ||
    normalized.startsWith("completed")
  ) {
    return "Finalizado";
  }
  if (
    normalized.startsWith("abandonado") ||
    normalized.startsWith("abandonados") ||
    normalized.startsWith("dropped")
  ) {
    return "Abandonado";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("es-ES"));
}

function truncate(value: string, max = 120) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function collectActivityArrays(payload: unknown) {
  const root = (payload ?? {}) as Record<string, unknown>;
  const perfil = (root?.perfil ?? {}) as Record<string, unknown>;
  const result: unknown[] = [];
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
  pushArray(root?.actividades);
  pushArray(root?.timeline);
  pushArray(root?.recentActivity);
  pushArray(root?.eventos);
  pushArray(root?.ultimasAcciones);
  pushArray(root?.comentarios, "comment");
  pushArray(root?.valoraciones, "rating");
  pushArray(root?.estados, "service");
  pushArray(perfil?.actividadReciente);
  pushArray(perfil?.actividad);
  pushArray(perfil?.actividades);
  pushArray(perfil?.timeline);
  pushArray(perfil?.comentarios, "comment");
  pushArray(perfil?.valoraciones, "rating");
  pushArray(perfil?.estados, "service");
  return result;
}

function mapActivityRecord(record: unknown, index: number): TimelineRecord | null {
  if (!record || typeof record !== "object") return null;
  const r = record as Record<string, unknown>;
  const meta = (r?.metadata ?? {}) as Record<string, unknown>;

  const forcedType = r.__forcedType
    ? normalizeTimelineType(r.__forcedType)
    : null;
  const rawTypeValue =
    r?.type ?? r?.tipo ?? r?.eventType ?? r?.accionTipo;
  const normalizedTypeText =
    typeof rawTypeValue === "string" ? rawTypeValue.toLowerCase() : "";
  const isReplyLikeType =
    normalizedTypeText.includes("reply") ||
    normalizedTypeText.includes("respuest");
  const hasParentReference =
    r?.parentId != null ||
    r?.parent_id != null ||
    r?.comentarioPadreId != null;
  const hasCommentPayload =
    r?.mensaje != null ||
    r?.comentario != null ||
    r?.textoComentario != null ||
    r?.texto != null ||
    r?.comment != null ||
    r?.body != null ||
    r?.commentId != null ||
    r?.comentarioId != null ||
    hasParentReference;
  const inferredType =
    hasCommentPayload
      ? "comment"
      : r?.puntuacion != null ||
          r?.rating != null ||
          r?.valoracion != null
        ? "rating"
        : r?.estado != null
          ? "service"
          : normalizeTimelineType(rawTypeValue);
  const type = forcedType ?? inferredType;

  const contentTitle = pickString(
    r?.contenidoTitulo,
    r?.tituloContenido,
    (r?.contenido as Record<string, unknown> | undefined)?.titulo,
    (r?.contenido as Record<string, unknown> | undefined)?.title,
    (r?.content as Record<string, unknown> | undefined)?.titulo,
    (r?.content as Record<string, unknown> | undefined)?.title
  );
  const listName = pickString(
    r?.listaNombre,
    r?.nombreLista,
    r?.listName,
    r?.lista_name,
    r?.nombre_lista,
    (r?.lista as Record<string, unknown> | undefined)?.nombre,
    (r?.lista as Record<string, unknown> | undefined)?.name,
    (r?.list as Record<string, unknown> | undefined)?.nombre,
    (r?.list as Record<string, unknown> | undefined)?.name,
    meta?.listaNombre,
    meta?.nombreLista,
    meta?.listName,
    (meta?.lista as Record<string, unknown> | undefined)?.nombre,
    (meta?.lista as Record<string, unknown> | undefined)?.name,
    (meta?.list as Record<string, unknown> | undefined)?.nombre,
    (meta?.list as Record<string, unknown> | undefined)?.name
  );
  const displayListName = listName ? formatListName(listName) : null;
  const rawMessage = pickString(
    r?.mensaje,
    r?.comentario,
    r?.textoComentario,
    r?.texto,
    r?.text,
    r?.comment,
    r?.body,
    meta?.textoComentario,
    (meta?.comment as Record<string, unknown> | undefined)?.mensaje,
    (meta?.comentario as Record<string, unknown> | undefined)?.mensaje
  );
  const rawStatus = statusLabel(r?.estado ?? r?.status);
  const rawRating = parseNumber(
    r?.puntuacion ?? r?.rating ?? r?.valoracion
  );

  let title =
    pickString(
      r?.title,
      r?.titulo,
      r?.accion,
      r?.label,
      r?.name
    ) ?? "";
  let detail = pickString(
    r?.detail,
    r?.detalle,
    r?.descripcion
  ) ?? "";

  if (!title) {
    if (type === "comment") {
      title = isReplyLikeType || hasParentReference
        ? `Respondiste${contentTitle ? ` en ${contentTitle}` : ""}`
        : `Comentaste${contentTitle ? ` en ${contentTitle}` : ""}`;
    } else if (type === "rating") {
      title = `Valoraste${contentTitle ? ` ${contentTitle}` : " un título"}`;
    } else if (type === "list") {
      if (contentTitle && displayListName) {
        title = `Añadiste ${contentTitle} a la lista de ${displayListName}`;
      } else if (contentTitle) {
        title = `Añadiste ${contentTitle} a una lista`;
      } else if (displayListName) {
        title = `Actualizaste la lista de ${displayListName}`;
      } else {
        title = "Actualizaste una lista";
      }
    } else {
      title = `Actualizaste estado${contentTitle ? ` en ${contentTitle}` : ""}`;
    }
  }

  if (!detail) {
    if (type === "comment" && rawMessage) {
      detail = `"${truncate(rawMessage)}"`;
    } else if (type === "rating" && rawRating != null) {
      detail = `${rawRating}/10`;
    } else if (type === "service" && rawStatus) {
      detail = rawStatus;
    }
  }

  const dateValue =
    r?.date ??
    r?.fecha ??
    r?.timestamp ??
    r?.createDate ??
    r?.createdAt ??
    r?.updateDate ??
    r?.updatedAt;
  const timestamp = parseDateMs(dateValue) ?? Date.now() - index;

  return {
    id: String(
      r?.id ??
        r?.actividadId ??
        r?.commentId ??
        r?.comentarioId ??
        r?.estadoId ??
        r?.valoracionId ??
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

export function buildTimelineFromPayload(payload: unknown) {
  const activityRows = collectActivityArrays(payload);
  return activityRows
    .map((record, index) => mapActivityRecord(record, index))
    .filter((record): record is TimelineRecord => record != null);
}
