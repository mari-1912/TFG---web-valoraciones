export type ProfileActivityType = "comment" | "rating" | "service" | "list";

export type ProfileActivityEntry = {
  id: string;
  type: ProfileActivityType;
  title: string;
  detail?: string;
  date: string;
};

const STORAGE_PREFIX = "profile-activity:";
const MAX_ACTIVITY_ITEMS = 80;

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function storageKey(username: string) {
  return `${STORAGE_PREFIX}${normalizeUsername(username)}`;
}

function parseDateMs(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeEntry(raw: unknown, index: number): ProfileActivityEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const typeValue = item.type;
  const type: ProfileActivityType =
    typeValue === "comment" ||
    typeValue === "rating" ||
    typeValue === "service" ||
    typeValue === "list"
      ? typeValue
      : "service";
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!title) return null;
  const detail = typeof item.detail === "string" ? item.detail.trim() : "";
  const date = typeof item.date === "string" ? item.date : new Date().toISOString();
  const id =
    typeof item.id === "string" && item.id.trim()
      ? item.id
      : `activity-${date}-${index}`;
  return {
    id,
    type,
    title,
    detail: detail || undefined,
    date,
  };
}

function loadEntries(username: string): ProfileActivityEntry[] {
  if (typeof window === "undefined") return [];
  const key = storageKey(username);
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => sanitizeEntry(item, index))
      .filter((item): item is ProfileActivityEntry => item != null)
      .sort((a, b) => (parseDateMs(b.date) ?? 0) - (parseDateMs(a.date) ?? 0));
  } catch {
    return [];
  }
}

function saveEntries(username: string, entries: ProfileActivityEntry[]) {
  if (typeof window === "undefined") return;
  const key = storageKey(username);
  localStorage.setItem(key, JSON.stringify(entries));
}

export function readProfileActivity(username: string): ProfileActivityEntry[] {
  if (!username.trim()) return [];
  return loadEntries(username);
}

export function appendProfileActivity(
  username: string,
  entry: Omit<ProfileActivityEntry, "id">
) {
  const normalized = normalizeUsername(username);
  if (!normalized || normalized === "anon") return;

  const current = loadEntries(normalized);
  const nextEntry: ProfileActivityEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `activity-${Date.now()}`,
    type: entry.type,
    title: entry.title.trim(),
    detail: entry.detail?.trim() || undefined,
    date: entry.date,
  };
  if (!nextEntry.title) return;

  const deduped = current.filter((item) => {
    if (item.type !== nextEntry.type) return true;
    if (item.title !== nextEntry.title) return true;
    if ((item.detail ?? "") !== (nextEntry.detail ?? "")) return true;
    const prevDate = parseDateMs(item.date) ?? 0;
    const nextDate = parseDateMs(nextEntry.date) ?? Date.now();
    return Math.abs(nextDate - prevDate) > 3000;
  });

  saveEntries(normalized, [nextEntry, ...deduped].slice(0, MAX_ACTIVITY_ITEMS));
}
