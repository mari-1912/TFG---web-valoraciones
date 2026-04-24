import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "@/components/sections/footer";
import { Skeleton } from "@/components/ui/skeleton";
import ContentCard from "@/components/content-card";
import { buildDetailPath } from "@/lib/detail-route";
import { getMe } from "@/services/auth-service";
import { getCommunityFeed, resolveAssetUrl } from "@/services/apiCommunity";
import {
  addContentToList,
  getListContents,
  removeContentFromList,
  type BackendContenidoListado,
  type BackendLista,
} from "@/services/lists-service";
import { fetchMyProfile, fetchUserProfile } from "@/services/profile-service";
import { useBaseLists } from "@/hooks/lists/use-my-lists";

type CategoryKey = "pelicula" | "serie" | "libro" | "videojuego";
type StatusKey = "watchlist" | "in_progress" | "completed" | "dropped";
type CategoryFilter = "all" | CategoryKey;

type StatusEntry = {
  key: string;
  id: number;
  status: StatusKey;
  category: CategoryKey | null;
  title: string;
  image?: string;
  timestamp: number;
};

type ContentSnapshot = {
  id: number;
  title: string;
  image?: string;
  category: CategoryKey | null;
  status: StatusKey | null;
  statusUserId: number | null;
  statusTimestamp: number;
  resolved: boolean;
};

type StatusListBinding = {
  status: StatusKey;
  category: CategoryKey;
  listName: string;
  label: string;
  aliases: string[];
  list: BackendLista | null;
  contents: BackendContenidoListado[];
};

type StatusListDefinition = {
  status: StatusKey;
  listName: string;
  label: string;
  aliases: string[];
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

const STATUS_DEFINITIONS: StatusListDefinition[] = [
  {
    status: "watchlist",
    listName: "pendientes",
    label: "Pendientes",
    aliases: [
      "pendientes",
      "proximamente",
      "próximamente",
      "watchlist",
    ],
  },
  {
    status: "in_progress",
    listName: "en_progreso",
    label: "En progreso",
    aliases: ["en_progreso", "en progreso", "in_progress"],
  },
  {
    status: "completed",
    listName: "completado",
    label: "Completado",
    aliases: ["completado", "completed"],
  },
  {
    status: "dropped",
    listName: "abandonado",
    label: "Abandonado",
    aliases: ["abandonado", "dropped"],
  },
];

const CATEGORY_ORDER: CategoryKey[] = [
  "pelicula",
  "serie",
  "libro",
  "videojuego",
];

const CATEGORY_SUFFIXES: Record<CategoryKey, string[]> = {
  pelicula: ["peliculas", "pelicula"],
  serie: ["series", "serie"],
  libro: ["libros", "libro"],
  videojuego: ["videojuegos", "videojuego"],
};

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: "Todos los tipos",
  pelicula: "Películas",
  serie: "Series",
  libro: "Libros",
  videojuego: "Videojuegos",
};

const STATUS_ORDER: StatusKey[] = [
  "watchlist",
  "in_progress",
  "completed",
  "dropped",
];

const STATUS_LABELS: Record<StatusKey, string> = {
  watchlist: "Pendientes",
  in_progress: "En progreso",
  completed: "Completado",
  dropped: "Abandonado",
};

// Evita cambios de listas al simplemente abrir estadísticas.
const ENABLE_LIST_SYNC_ON_READ = false;

function parseUserId(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function parseTimestamp(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value > 10_000_000_000 ? value : value * 1000;
    }
    if (typeof value !== "string" || !value.trim()) continue;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeCategory(value: unknown): CategoryKey | null {
  const key = normalizeKey(typeof value === "string" ? value : "");
  if (!key) return null;
  if (["pelicula", "peliculas", "movie", "movies"].includes(key)) return "pelicula";
  if (["serie", "series", "tv"].includes(key)) return "serie";
  if (["libro", "libros", "book", "books"].includes(key)) return "libro";
  if (["videojuego", "videojuegos", "game", "games"].includes(key)) return "videojuego";
  return null;
}

function normalizeStatus(value: unknown): StatusKey | null {
  const raw =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? pickString(
            (value as { estado?: unknown }).estado,
            (value as { status?: unknown }).status,
            (value as { value?: unknown }).value
          )
        : "";
  const key = normalizeKey(raw);
  if (!key) return null;

  if (key === "watchlist") return "watchlist";
  if (key === "in_progress") return "in_progress";
  if (key === "completed") return "completed";
  if (key === "dropped") return "dropped";
  if (key === "pendientes") return "watchlist";
  if (key === "proximamente") return "watchlist";
  if (key === "en_progreso") return "in_progress";
  if (key === "completado") return "completed";
  if (key === "abandonado") return "dropped";
  return null;
}

function normalizeFetchedContent(data: any) {
  return data?.contenido ?? data?.item ?? data;
}

function extractRowUserId(row: any): number | null {
  if (!row || typeof row !== "object") return null;
  return parseUserId(
    row?.userId ??
      row?.user_id ??
      row?.usuarioId ??
      row?.usuario_id ??
      row?.usuario?.userId ??
      row?.usuario?.user_id ??
      row?.usuario?.id ??
      row?.metadata?.userId ??
      row?.metadata?.usuarioId ??
      row?.metadata?.usuario?.userId
  );
}

function extractRowContentId(row: any): number | null {
  if (!row || typeof row !== "object") return null;
  return pickNumber(
    row?.contenidoId,
    row?.contentId,
    row?.idContenido,
    row?.contenido?.id,
    row?.content?.id,
    row?.metadata?.contenidoId,
    row?.metadata?.contentId,
    row?.metadata?.idContenido,
    row?.metadata?.contenido?.id,
    row?.metadata?.content?.id
  );
}

function collectRows(payload: any) {
  const root = payload ?? {};
  const perfil = root?.perfil ?? {};
  const candidates = [
    root?.actividad,
    root?.actividadReciente,
    root?.timeline,
    root?.estados,
    root?.statuses,
    root?.contenidosEstado,
    perfil?.actividad,
    perfil?.actividadReciente,
    perfil?.timeline,
    perfil?.estados,
    perfil?.statuses,
    perfil?.contenidosEstado,
  ];
  return candidates.flatMap((candidate) => (Array.isArray(candidate) ? candidate : []));
}

function buildListName(baseName: string, category: CategoryKey) {
  const [plural] = CATEGORY_SUFFIXES[category];
  return `${baseName}_${plural}`;
}

function buildListAliases(baseAliases: string[], category: CategoryKey): string[] {
  const suffixes = CATEGORY_SUFFIXES[category];
  const aliases = new Set<string>();

  for (const alias of baseAliases) {
    for (const suffix of suffixes) {
      aliases.add(`${alias}_${suffix}`);
      aliases.add(`${alias} ${suffix}`);
    }
  }

  // Compatibilidad con listas antiguas de solo películas: "completado", etc.
  if (category === "pelicula") {
    for (const alias of baseAliases) {
      aliases.add(alias);
      aliases.add(alias.replace(/_/g, " "));
    }
  }

  return [...aliases];
}

function findListByAliases(
  lists: BackendLista[],
  aliases: string[],
  category: CategoryKey
): BackendLista | null {
  const normalizedAliases = new Set(aliases.map((alias) => normalizeKey(alias)));
  return (
    lists.find((list) => {
      const listCategory = normalizeCategory(list.tipoContenidos);
      if (listCategory !== category) return false;
      return normalizedAliases.has(normalizeKey(list.nombre ?? ""));
    }) ??
    null
  );
}

async function fetchGenericContentById(contenidoId: number, signal?: AbortSignal) {
  const base = `${API_URL}/contenidos/`.replace(/\/+$/, "/");
  const url = `${base}${contenidoId}`;
  const res = await fetch(url, {
    signal,
    credentials: "include",
  });
  if (!res.ok) throw new Error(`fetchGenericContentById failed: ${res.status}`);
  return res.json();
}

async function fetchContentSnapshot(
  contenidoId: number,
  targetUserId: number | null,
  signal?: AbortSignal
): Promise<ContentSnapshot> {
  try {
    const payload = await fetchGenericContentById(contenidoId, signal);
    const item = normalizeFetchedContent(payload);
    const statusNode =
      item?.estado ??
      payload?.estado ??
      item?.estadoUsuario ??
      payload?.estadoUsuario ??
      null;

    const statusUserId = parseUserId(
      statusNode?.userId ?? statusNode?.usuarioId ?? statusNode?.user_id
    );
    const belongsToTargetUser =
      targetUserId == null || statusUserId === targetUserId;

    return {
      id: contenidoId,
      title:
        pickString(
          item?.titulo,
          item?.title,
          item?.nombre,
          payload?.titulo,
          payload?.title,
          payload?.nombre
        ) || `Contenido ${contenidoId}`,
      image: resolveAssetUrl(
        pickString(
          item?.portada,
          item?.poster,
          item?.image,
          item?.imagen,
          item?.cover,
          payload?.portada,
          payload?.poster,
          payload?.image
        ) || undefined
      ),
      category:
        normalizeCategory(
          pickString(
            item?.tipo,
            item?.tipoContenido,
            item?.category,
            item?.categoria,
            payload?.tipo,
            payload?.tipoContenido
          )
        ) ?? null,
      status: belongsToTargetUser ? normalizeStatus(statusNode) : null,
      statusUserId,
      statusTimestamp: parseTimestamp(
        statusNode?.updateDate,
        statusNode?.updatedAt,
        statusNode?.createDate,
        statusNode?.createdAt
      ),
      resolved: true,
    };
  } catch {
    return {
      id: contenidoId,
      title: `Contenido ${contenidoId}`,
      image: undefined,
      category: null,
      status: null,
      statusUserId: null,
      statusTimestamp: 0,
      resolved: false,
    };
  }
}

async function fetchCommunityContentIdsForUser(
  userId: number,
  signal?: AbortSignal
): Promise<Set<number>> {
  const PAGE_SIZE = 100;
  const MAX_PAGES = 12;
  const ids = new Set<number>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const payload = await getCommunityFeed({ page, pageSize: PAGE_SIZE, signal });
    const rows = Array.isArray(payload?.actividades) ? payload.actividades : [];

    for (const row of rows) {
      if (extractRowUserId(row) !== userId) continue;
      const contenidoId = extractRowContentId(row);
      if (contenidoId != null) ids.add(contenidoId);
    }

    const pages = Number(payload?.pagination?.pages ?? 0);
    if (Number.isFinite(pages) && pages > 0 && page >= pages) break;
    if (rows.length < PAGE_SIZE) break;
  }

  return ids;
}

async function ensureStatusLists(
  existingLists: BackendLista[]
): Promise<StatusListBinding[]> {
  const resolved: StatusListBinding[] = [];

  for (const definition of STATUS_DEFINITIONS) {
    for (const category of CATEGORY_ORDER) {
      const aliases = buildListAliases(definition.aliases, category);
      const listName = buildListName(definition.listName, category);
      resolved.push({
        status: definition.status,
        category,
        listName,
        label: definition.label,
        aliases,
        list: findListByAliases(existingLists, aliases, category),
        contents: [],
      });
    }
  }

  return resolved;
}

async function loadStatusListContents(
  bindings: StatusListBinding[]
): Promise<StatusListBinding[]> {
  const enriched = await Promise.all(
    bindings.map(async (binding) => {
      if (!binding.list) return binding;
      try {
        const data = await getListContents(binding.list.listaId);
        return {
          ...binding,
          contents: Array.isArray(data?.contenidos) ? data.contenidos : [],
        };
      } catch {
        return {
          ...binding,
          contents: [],
        };
      }
    })
  );

  return enriched;
}

async function collectIdsFromLists(lists: BackendLista[]): Promise<Set<number>> {
  const ids = new Set<number>();

  await Promise.all(
    lists.map(async (list) => {
      try {
        const data = await getListContents(list.listaId);
        const contenidos = Array.isArray(data?.contenidos) ? data.contenidos : [];
        for (const item of contenidos) {
          const id = parseUserId(item.id);
          if (id != null) ids.add(id);
        }
      } catch {
        // Ignoramos listas que fallen para no bloquear estadísticas.
      }
    })
  );

  return ids;
}

async function syncStatusLists(
  bindings: StatusListBinding[],
  snapshots: Map<number, ContentSnapshot>,
  canManageLists: boolean
): Promise<boolean> {
  if (!canManageLists) return false;

  const listByStatusAndCategory = new Map<string, BackendLista>();
  const membership = new Map<number, Set<number>>();

  for (const binding of bindings) {
    if (!binding.list) continue;
    listByStatusAndCategory.set(
      `${binding.status}:${binding.category}`,
      binding.list
    );
    membership.set(
      binding.list.listaId,
      new Set(
        binding.contents
          .map((item) => parseUserId(item.id))
          .filter((id): id is number => id != null)
      )
    );
  }

  let changed = false;

  for (const snapshot of snapshots.values()) {
    if (snapshot.status == null || snapshot.category == null) continue;

    const targetList = listByStatusAndCategory.get(
      `${snapshot.status}:${snapshot.category}`
    );
    if (!targetList) continue;

    for (const binding of bindings) {
      if (!binding.list || binding.category !== snapshot.category) continue;
      const currentList = binding.list;
      const ids = membership.get(currentList.listaId);
      if (!ids) continue;

      const shouldBeHere = currentList.listaId === targetList.listaId;
      const isHere = ids.has(snapshot.id);

      if (shouldBeHere && !isHere) {
        try {
          await addContentToList(currentList.listaId, snapshot.id);
          ids.add(snapshot.id);
          changed = true;
        } catch {
          // Ignoramos errores de duplicado o validación puntual.
        }
      }

      if (!shouldBeHere && isHere) {
        try {
          await removeContentFromList(currentList.listaId, snapshot.id);
          ids.delete(snapshot.id);
          changed = true;
        } catch {
          // Ignoramos errores para no romper la carga.
        }
      }
    }
  }

  return changed;
}

function buildEntriesFromBindings(
  bindings: StatusListBinding[],
  snapshots: Map<number, ContentSnapshot>,
  strictBySnapshotStatus: boolean
): StatusEntry[] {
  const entries: StatusEntry[] = [];
  const dedupe = new Set<string>();

  for (const binding of bindings) {
    const seen = new Set<number>();

    for (const item of binding.contents) {
      const id = parseUserId(item.id);
      if (id == null || seen.has(id)) continue;
      seen.add(id);

      const snapshot = snapshots.get(id);
      const category =
        snapshot?.category ?? normalizeCategory(item.tipo) ?? binding.category;
      const status = snapshot?.status ?? binding.status;
      if (strictBySnapshotStatus && status !== binding.status) continue;
      if (strictBySnapshotStatus && category !== binding.category) continue;

      const title = pickString(item.titulo, snapshot?.title) || `Contenido ${id}`;
      const image = resolveAssetUrl(item.portada ?? snapshot?.image ?? undefined);
      const timestamp = snapshot?.statusTimestamp ?? 0;
      const dedupeKey = `${status}:${id}`;
      if (dedupe.has(dedupeKey)) continue;
      dedupe.add(dedupeKey);

      entries.push({
        key: dedupeKey,
        id,
        status,
        category,
        title,
        image,
        timestamp,
      });
    }
  }

  // Fallback: si por cualquier motivo fallan las lecturas de /listas/{id}/contenidos
  // pero sí tenemos snapshot con estado/categoría, mostramos igualmente la entrada.
  for (const snapshot of snapshots.values()) {
    if (snapshot.status == null || snapshot.category == null) continue;
    const dedupeKey = `${snapshot.status}:${snapshot.id}`;
    if (dedupe.has(dedupeKey)) continue;
    dedupe.add(dedupeKey);

    entries.push({
      key: dedupeKey,
      id: snapshot.id,
      status: snapshot.status,
      category: snapshot.category,
      title: snapshot.title || `Contenido ${snapshot.id}`,
      image: resolveAssetUrl(snapshot.image ?? undefined),
      timestamp: snapshot.statusTimestamp ?? 0,
    });
  }

  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

export default function ProfileStatsPage() {
  const [searchParams] = useSearchParams();
  const requestedUserId = useMemo(
    () => parseUserId(searchParams.get("userId")),
    [searchParams]
  );

  const [entries, setEntries] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Usuario");
  const [activeStatus, setActiveStatus] = useState<StatusKey>("completed");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [profileRows, setProfileRows] = useState<unknown[]>([]);
  const [profileReady, setProfileReady] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(true);

  const {
    lists: baseLists,
    loading: listsLoading,
    error: listsError,
    canManageLists,
  } = useBaseLists({
    requestedUserId,
    targetUserId,
    myUserId,
    enabled: targetUserId != null || requestedUserId == null,
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadIdentity = async () => {
      setIdentityLoading(true);
      setProfileReady(false);
      setError(null);

      try {
        const profilePayload =
          requestedUserId != null
            ? await fetchUserProfile(requestedUserId, controller.signal)
            : await fetchMyProfile(controller.signal);
        if (cancelled) return;

        const resolvedTargetUserId = parseUserId(
          profilePayload?.perfil?.userId ?? requestedUserId
        );
        const resolvedProfileName =
          pickString(profilePayload?.perfil?.username) || "Usuario";

        setProfileName(resolvedProfileName);
        setTargetUserId(resolvedTargetUserId);
        setProfileRows(collectRows(profilePayload));

        const me = await getMe().catch(() => null);
        if (cancelled) return;
        const resolvedMyUserId = parseUserId(me?.success ? me.user?.user_id : null);
        setMyUserId(resolvedMyUserId);
        setProfileReady(true);
      } catch (err) {
        if (cancelled) return;
        setEntries([]);
        setProfileRows([]);
        setProfileReady(false);
        setTargetUserId(null);
        setMyUserId(null);
        setProfileName("Usuario");
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las estadísticas detalladas."
        );
      } finally {
        if (!cancelled) setIdentityLoading(false);
      }
    };

    void loadIdentity();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [requestedUserId]);

  useEffect(() => {
    if (!profileReady) return;
    if (listsLoading) return;
    if (listsError) {
      setEntries([]);
      setError(listsError);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        let bindings = await ensureStatusLists(
          baseLists
        );
        bindings = await loadStatusListContents(bindings);

        const knownIds = new Set<number>();

        for (const binding of bindings) {
          for (const item of binding.contents) {
            const id = parseUserId(item.id);
            if (id != null) knownIds.add(id);
          }
        }

        // Para el propio usuario, usamos únicamente lo que hay en listas de estado,
        // igual que en list-categories-page.
        // Para perfiles ajenos, mantenemos ayudas de perfil/comunidad.
        if (!canManageLists) {
          const idsFromAllLists = await collectIdsFromLists(baseLists);
          for (const id of idsFromAllLists) knownIds.add(id);

          for (const row of profileRows) {
            if (targetUserId != null) {
              const rowUserId = extractRowUserId(row);
              if (rowUserId != null && rowUserId !== targetUserId) continue;
            }
            const id = extractRowContentId(row);
            if (id != null) knownIds.add(id);
          }

          if (targetUserId != null) {
            const communityIds = await fetchCommunityContentIdsForUser(
              targetUserId,
              controller.signal
            ).catch(() => new Set<number>());
            for (const id of communityIds) knownIds.add(id);
          }
        }

        const snapshots = new Map<number, ContentSnapshot>();
        await Promise.all(
          [...knownIds].map(async (id) => {
            const snapshot = await fetchContentSnapshot(
              id,
              targetUserId,
              controller.signal
            );
            snapshots.set(id, snapshot);
          })
        );

        if (ENABLE_LIST_SYNC_ON_READ) {
          const changed = await syncStatusLists(bindings, snapshots, canManageLists);
          if (changed) {
            bindings = await loadStatusListContents(bindings);
          }
        }

        const nextEntries = buildEntriesFromBindings(
          bindings,
          snapshots,
          !canManageLists
        );
        if (!cancelled) {
          setEntries(nextEntries);
        }
      } catch (err) {
        if (cancelled) return;
        setEntries([]);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las estadísticas detalladas."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadStats();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    profileReady,
    listsLoading,
    listsError,
    baseLists,
    canManageLists,
    targetUserId,
    profileRows,
  ]);

  const grouped = useMemo(() => {
    const init: Record<StatusKey, StatusEntry[]> = {
      watchlist: [],
      in_progress: [],
      completed: [],
      dropped: [],
    };
    for (const entry of entries) {
      init[entry.status].push(entry);
    }
    return init;
  }, [entries]);

  const groupedByCategory = useMemo(() => {
    const init: Record<StatusKey, Record<CategoryKey, StatusEntry[]>> = {
      watchlist: {
        pelicula: [],
        serie: [],
        libro: [],
        videojuego: [],
      },
      in_progress: {
        pelicula: [],
        serie: [],
        libro: [],
        videojuego: [],
      },
      completed: {
        pelicula: [],
        serie: [],
        libro: [],
        videojuego: [],
      },
      dropped: {
        pelicula: [],
        serie: [],
        libro: [],
        videojuego: [],
      },
    };

    for (const entry of entries) {
      if (entry.category == null) continue;
      init[entry.status][entry.category].push(entry);
    }

    return init;
  }, [entries]);

  useEffect(() => {
    if (!entries.length) return;
    if (grouped[activeStatus].length > 0) return;
    const firstWithContent =
      STATUS_ORDER.find((status) => grouped[status].length > 0) ?? "completed";
    if (firstWithContent !== activeStatus) {
      setActiveStatus(firstWithContent);
    }
  }, [entries, grouped, activeStatus]);

  useEffect(() => {
    if (activeCategory === "all") return;
    if (groupedByCategory[activeStatus][activeCategory].length > 0) return;

    const firstWithContent = CATEGORY_ORDER.find(
      (category) => groupedByCategory[activeStatus][category].length > 0
    );
    setActiveCategory(firstWithContent ?? "all");
  }, [activeCategory, activeStatus, groupedByCategory]);

  const profileBackLink =
    requestedUserId != null ? `/perfil?userId=${requestedUserId}` : "/perfil";
  const selectedEntries =
    activeCategory === "all"
      ? grouped[activeStatus]
      : groupedByCategory[activeStatus][activeCategory];
  const isLoading = identityLoading || listsLoading || loading;

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-12">
          <div className="mb-8">
            <div className="mb-2 text-xs text-gray-500">
              <Link to={profileBackLink} className="text-violet-700 hover:underline">
                Perfil
              </Link>{" "}
              / Estadísticas detalladas
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Estadísticas detalladas
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {`Listas de estado de ${profileName}: Pendientes, En progreso, Completado y Abandonado.`}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <section
                    key={`stats-skeleton-status-${idx}`}
                    className="rounded-2xl border border-violet-100 bg-white p-4"
                  >
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="mt-3 h-7 w-12" />
                  </section>
                ))}
              </div>
              <section className="rounded-2xl border border-violet-100 bg-white p-4">
                <Skeleton className="h-6 w-56" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((__, cardIdx) => (
                    <Skeleton
                      key={`stats-skeleton-card-${cardIdx}`}
                      className="h-44 w-full"
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : entries.length === 0 ? (
            <p className="rounded-2xl border border-violet-200 bg-white p-6 text-sm text-gray-600">
              No hay contenidos en las listas de estado.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {STATUS_ORDER.map((status) => {
                  const count = grouped[status].length;
                  const isActive = activeStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setActiveStatus(status)}
                      className={[
                        "rounded-2xl border p-4 text-left transition",
                        isActive
                          ? "border-violet-400 bg-violet-50 shadow-sm"
                          : "border-violet-100 bg-white hover:border-violet-300",
                      ].join(" ")}
                    >
                      <h2
                        className={`text-lg font-semibold ${
                          isActive ? "text-violet-800" : "text-violet-700"
                        }`}
                      >
                        {STATUS_LABELS[status]}
                      </h2>
                      <p className="mt-2 text-3xl font-semibold text-gray-900">
                        {count}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {count === 1 ? "título" : "títulos"}
                      </p>
                    </button>
                  );
                })}
              </div>

              <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-violet-700">
                      {STATUS_LABELS[activeStatus]}
                    </h3>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
                      {selectedEntries.length}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    Tipo
                    <select
                      value={activeCategory}
                      onChange={(event) =>
                        setActiveCategory(event.target.value as CategoryFilter)
                      }
                      className="rounded-md border border-violet-200 bg-white px-2 py-1 text-xs text-gray-700"
                    >
                      <option value="all">
                        {`${CATEGORY_LABELS.all} (${grouped[activeStatus].length})`}
                      </option>
                      {CATEGORY_ORDER.map((category) => (
                        <option key={category} value={category}>
                          {`${CATEGORY_LABELS[category]} (${groupedByCategory[activeStatus][category].length})`}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedEntries.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    {activeCategory === "all"
                      ? "No hay títulos en este estado."
                      : `No hay títulos de ${CATEGORY_LABELS[activeCategory].toLowerCase()} en este estado.`}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 items-stretch gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {selectedEntries.map((entry) => {
                      const to =
                        entry.category != null
                          ? buildDetailPath(entry.category, entry.id, entry.title)
                          : undefined;
                      return (
                        <div key={entry.key} className="flex">
                          <ContentCard
                            title={entry.title}
                            image={entry.image}
                            type={entry.category}
                            className="w-full"
                            to={to}
                            state={
                              entry.category != null
                                ? {
                                    item: {
                                      id: entry.id,
                                      titulo: entry.title,
                                      tipo: entry.category,
                                    },
                                  }
                                : undefined
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
