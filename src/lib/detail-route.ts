function toAsciiLower(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function slugifyDetailTitle(value: unknown): string {
  if (typeof value !== "string") return "";
  return toAsciiLower(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isNumericDetailSegment(value: string | undefined): boolean {
  if (!value) return false;
  return /^\d+$/.test(value.trim());
}

export function buildDetailPath(
  type: string | undefined | null,
  id: string | number | undefined | null,
  title?: string | null
): string {
  const normalizedType = (type ?? "").trim().toLowerCase() || "pelicula";
  const fallback = String(id ?? "").trim();
  const slug = slugifyDetailTitle(title ?? "");
  const idSegment = fallback || slug || "detalle";
  const path = `/detail/${encodeURIComponent(normalizedType)}/${encodeURIComponent(idSegment)}`;
  return fallback && slug ? `${path}/${encodeURIComponent(slug)}` : path;
}
