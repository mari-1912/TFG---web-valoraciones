export type WatchlistItem = {
  id: string;
  type: string;
  title: string;
  image?: string;
  addedAt: string;
};

const STORAGE_PREFIX = "watchlist:";
const WATCHED_PREFIX = "watchedlist:";

function normalizeUser(value: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "anon";
}

export function getCurrentUser() {
  return normalizeUser(localStorage.getItem("currentUser"));
}

function storageKey(prefix: string, user?: string) {
  const resolvedUser = normalizeUser(user ?? getCurrentUser());
  return `${prefix}${resolvedUser}`;
}

function safeParse(raw: string | null): WatchlistItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WatchlistItem[]) : [];
  } catch {
    return [];
  }
}

function loadList(prefix: string, user?: string) {
  return safeParse(localStorage.getItem(storageKey(prefix, user)));
}

function saveList(items: WatchlistItem[], prefix: string, user?: string) {
  localStorage.setItem(storageKey(prefix, user), JSON.stringify(items));
}

function isInList(prefix: string, id: string, type: string, user?: string) {
  const list = loadList(prefix, user);
  return list.some((entry) => entry.id === id && entry.type === type);
}

function addToList(
  prefix: string,
  item: Omit<WatchlistItem, "addedAt">,
  user?: string
) {
  const list = loadList(prefix, user);
  const exists = list.some(
    (entry) => entry.id === item.id && entry.type === item.type
  );
  if (exists) {
    return { added: false, items: list };
  }
  const next = [
    ...list,
    { ...item, addedAt: new Date().toISOString() },
  ];
  saveList(next, prefix, user);
  return { added: true, items: next };
}

export function loadWatchlist(user?: string) {
  return loadList(STORAGE_PREFIX, user);
}

export function saveWatchlist(items: WatchlistItem[], user?: string) {
  saveList(items, STORAGE_PREFIX, user);
}

export function isInWatchlist(id: string, type: string, user?: string) {
  return isInList(STORAGE_PREFIX, id, type, user);
}

export function addToWatchlist(
  item: Omit<WatchlistItem, "addedAt">,
  user?: string
) {
  return addToList(STORAGE_PREFIX, item, user);
}

export function loadWatchedList(user?: string) {
  return loadList(WATCHED_PREFIX, user);
}

export function saveWatchedList(items: WatchlistItem[], user?: string) {
  saveList(items, WATCHED_PREFIX, user);
}

export function isInWatchedList(id: string, type: string, user?: string) {
  return isInList(WATCHED_PREFIX, id, type, user);
}

export function addToWatchedList(
  item: Omit<WatchlistItem, "addedAt">,
  user?: string
) {
  return addToList(WATCHED_PREFIX, item, user);
}
