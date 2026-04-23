import type { ContentStatus } from "@/services/content-status";
import {
  addContentToList,
  createUserList,
  getListContents,
  getMyListsWithFallback,
  removeContentFromList,
  type BackendLista,
} from "@/services/lists-service";

type CategoryKey = "pelicula" | "serie" | "libro" | "videojuego";
type StatusKey = ContentStatus;

type StatusListDefinition = {
  status: StatusKey;
  baseName: string;
  label: string;
};

const STATUS_DEFINITIONS: StatusListDefinition[] = [
  { status: "watchlist", baseName: "pendientes", label: "Pendientes" },
  { status: "in_progress", baseName: "en_progreso", label: "En progreso" },
  { status: "completed", baseName: "completado", label: "Completado" },
  { status: "dropped", baseName: "abandonado", label: "Abandonado" },
];

const CATEGORY_SUFFIXES: Record<CategoryKey, string[]> = {
  pelicula: ["peliculas", "pelicula"],
  serie: ["series", "serie"],
  libro: ["libros", "libro"],
  videojuego: ["videojuegos", "videojuego"],
};

const BASE_NAME_ALIASES: Record<string, string[]> = {
  pendientes: ["pendientes", "proximamente", "watchlist"],
  en_progreso: ["en_progreso", "enprogreso", "in_progress"],
  completado: ["completado", "completed"],
  abandonado: ["abandonado", "dropped", "dejado"],
};

let statusSyncQueue: Promise<void> = Promise.resolve();

function enqueueStatusSync<T>(job: () => Promise<T>): Promise<T> {
  const run = statusSyncQueue.then(job, job);
  statusSyncQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function parseContentId(value: string | number) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function parseUserId(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
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
  if (["videojuego", "videojuegos", "game", "games", "juego_mesa"].includes(key)) {
    return "videojuego";
  }
  return null;
}

function buildListName(baseName: string, category: CategoryKey) {
  const [plural] = CATEGORY_SUFFIXES[category];
  return `${baseName}_${plural}`;
}

function buildListAliases(baseName: string, category: CategoryKey) {
  const suffixes = CATEGORY_SUFFIXES[category];
  const baseAliases = BASE_NAME_ALIASES[baseName] ?? [baseName];
  const aliases = new Set<string>();

  for (const baseAlias of baseAliases) {
    for (const suffix of suffixes) {
      aliases.add(`${baseAlias}_${suffix}`);
      aliases.add(`${baseAlias} ${suffix}`);
    }
  }

  if (category === "pelicula") {
    for (const baseAlias of baseAliases) {
      aliases.add(baseAlias);
      aliases.add(baseAlias.replace(/_/g, " "));
    }
    // Compatibilidad con nombres antiguos concretos.
    if (baseName === "pendientes") aliases.add("próximamente");
  }

  return [...aliases];
}

function findListsByNameAndCategory(
  lists: BackendLista[],
  aliases: string[],
  category: CategoryKey
): BackendLista[] {
  const normalizedAliases = new Set(aliases.map((alias) => normalizeKey(alias)));

  return lists
    .filter((list) => {
      const listCategory = normalizeCategory(list.tipoContenidos);
      if (listCategory !== category) return false;
      return normalizedAliases.has(normalizeKey(list.nombre ?? ""));
    })
    .sort((a, b) => Number(a.listaId) - Number(b.listaId));
}

type EnsureResult = {
  status: StatusKey;
  primaryList: BackendLista;
  allLists: BackendLista[];
};

async function ensureStatusListsForCategory(
  existingLists: BackendLista[],
  category: CategoryKey
): Promise<EnsureResult[]> {
  const ensured: EnsureResult[] = [];

  for (const definition of STATUS_DEFINITIONS) {
    const aliases = buildListAliases(definition.baseName, category);
    const existing = findListsByNameAndCategory(existingLists, aliases, category);

    if (existing.length > 0) {
      ensured.push({
        status: definition.status,
        primaryList: existing[0],
        allLists: existing,
      });
      continue;
    }

    const created = await createUserList({
      nombre: buildListName(definition.baseName, category),
      tipoContenidos: category,
      descripcion: `Lista automática de estado: ${definition.label}`,
      visibilidad: "publica",
      imagen: "",
    });

    ensured.push({
      status: definition.status,
      primaryList: created,
      allLists: [created],
    });
  }

  return ensured;
}

export async function syncContentInStatusLists(
  contentId: string | number,
  contentType: string,
  nextStatus: ContentStatus | null
): Promise<void> {
  return enqueueStatusSync(async () => {
    const numericId = parseContentId(contentId);
    const category = normalizeCategory(contentType);

    if (numericId == null || category == null) return;

    const myLists = await getMyListsWithFallback();
    const ensuredLists = await ensureStatusListsForCategory(myLists, category);

    const membership = new Map<number, Set<number>>();

    const uniqueLists = new Map<number, BackendLista>();
    for (const ensured of ensuredLists) {
      for (const list of ensured.allLists) {
        const listId = Number(list.listaId);
        if (!Number.isFinite(listId) || listId <= 0) continue;
        if (!uniqueLists.has(listId)) uniqueLists.set(listId, list);
      }
    }

    await Promise.all(
      [...uniqueLists.values()].map(async (list) => {
        try {
          const data = await getListContents(list.listaId);
          const ids = new Set<number>();
          const contenidos = Array.isArray(data?.contenidos) ? data.contenidos : [];
          for (const contenido of contenidos) {
            const id = parseUserId(contenido.id);
            if (id != null) ids.add(id);
          }
          membership.set(list.listaId, ids);
        } catch {
          membership.set(list.listaId, new Set<number>());
        }
      })
    );

    for (const { status, primaryList, allLists } of ensuredLists) {
      for (const list of allLists) {
        const ids = membership.get(list.listaId) ?? new Set<number>();
        const shouldBeHere =
          nextStatus != null &&
          status === nextStatus &&
          Number(list.listaId) === Number(primaryList.listaId);
        const isHere = ids.has(numericId);

        if (shouldBeHere && !isHere) {
          try {
            await addContentToList(list.listaId, numericId);
          } catch {
            // Evitamos romper la UX si falla la sincronización secundaria.
          }
          continue;
        }

        if (!shouldBeHere && isHere) {
          try {
            await removeContentFromList(list.listaId, numericId);
          } catch {
            // Evitamos romper la UX si falla la sincronización secundaria.
          }
        }
      }
    }
  });
}
