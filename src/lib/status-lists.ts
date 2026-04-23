import type { BackendLista } from "@/services/lists-service";

export type StatusKey = "watchlist" | "in_progress" | "completed" | "dropped";
export type CategoryKey = "pelicula" | "serie" | "libro" | "videojuego";

export const STATUS_ORDER: StatusKey[] = [
  "watchlist",
  "in_progress",
  "completed",
  "dropped",
];

export const CATEGORY_ORDER: CategoryKey[] = [
  "pelicula",
  "serie",
  "libro",
  "videojuego",
];

export const STATUS_META: Record<
  StatusKey,
  { title: string; subtitle: string; color: string; border: string; badgeBg: string }
> = {
  watchlist: {
    title: "Pendientes",
    subtitle: "Pendientes",
    color: "hsl(44 92% 50%)",
    border: "hsl(44 95% 84%)",
    badgeBg: "rgba(234,179,8,0.14)",
  },
  in_progress: {
    title: "En progreso",
    subtitle: "Actualmente viendo/leyendo/jugando",
    color: "hsl(199 89% 48%)",
    border: "hsl(199 90% 84%)",
    badgeBg: "rgba(14,165,233,0.14)",
  },
  completed: {
    title: "Finalizado",
    subtitle: "Completados",
    color: "hsl(142 76% 36%)",
    border: "hsl(142 76% 84%)",
    badgeBg: "rgba(22,163,74,0.14)",
  },
  dropped: {
    title: "Abandonado",
    subtitle: "Dejados",
    color: "hsl(0 84% 60%)",
    border: "hsl(0 90% 86%)",
    badgeBg: "rgba(239,68,68,0.14)",
  },
};

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  pelicula: "Películas",
  serie: "Series",
  libro: "Libros",
  videojuego: "Videojuegos",
};

export function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeCategory(value: unknown): CategoryKey | null {
  const key = normalizeKey(typeof value === "string" ? value : "");
  if (!key) return null;
  if (["pelicula", "peliculas", "movie", "movies"].includes(key)) return "pelicula";
  if (["serie", "series", "tv"].includes(key)) return "serie";
  if (["libro", "libros", "book", "books"].includes(key)) return "libro";
  if (["videojuego", "videojuegos", "game", "games", "juego_mesa"].includes(key)) {
    return "videojuego";
  }
  return null;
}

export function parseManagedStatus(
  name: string,
  description?: string | null | undefined
): StatusKey | null {
  const resolve = (value: string): StatusKey | null => {
    const normalized = normalizeKey(value);
    if (!normalized) return null;
    const tokens = `_${normalized}_`;
    if (
      tokens.includes("_pendientes_") ||
      tokens.includes("_proximamente_") ||
      tokens.includes("_watchlist_")
    ) {
      return "watchlist";
    }
    if (
      tokens.includes("_en_progreso_") ||
      tokens.includes("_enprogreso_") ||
      tokens.includes("_in_progress_")
    ) {
      return "in_progress";
    }
    if (tokens.includes("_completado_") || tokens.includes("_completed_")) {
      return "completed";
    }
    if (
      tokens.includes("_abandonado_") ||
      tokens.includes("_dropped_") ||
      tokens.includes("_dejado_")
    ) {
      return "dropped";
    }
    return null;
  };

  return resolve(name) ?? resolve(description ?? "");
}

export function isManagedStatusList(
  name: string,
  description: string | null | undefined
): boolean {
  if (parseManagedStatus(name, description) != null) return true;
  const normalizedDescription = normalizeKey(description ?? "");
  return normalizedDescription.startsWith("lista_automatica_de_estado");
}

export function groupManagedStatusListIds(
  lists: BackendLista[]
): Record<StatusKey, number[]> {
  const statusToListIds: Record<StatusKey, number[]> = {
    watchlist: [],
    in_progress: [],
    completed: [],
    dropped: [],
  };

  for (const list of lists) {
    const listName = String(list.nombre ?? "");
    if (!isManagedStatusList(listName, list.descripcion)) continue;
    const status = parseManagedStatus(listName, list.descripcion);
    const category = normalizeCategory(list.tipoContenidos);
    if (!status || !category) continue;
    const id = Number(list.listaId);
    if (Number.isFinite(id) && id > 0) {
      statusToListIds[status].push(id);
    }
  }

  return statusToListIds;
}
