import { useEffect, useMemo, useState } from "react";
import { normalizeDetailItem } from "@/pages/detail-page.helpers";

type UseDetailContentArgs = {
  id?: string;
  type?: string;
  stateItem: any | null;
  localItem: any | null;
  apiUrl: string;
  typeEndpoints: Record<string, string>;
};

export function useDetailContent({
  id,
  type,
  stateItem,
  localItem,
  apiUrl,
  typeEndpoints,
}: UseDetailContentArgs) {
  const [remoteItem, setRemoteItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !id) return;

    const endpoint = typeEndpoints[type];
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const loadJson = async (url: string) => {
          const res = await fetch(url, {
            signal: controller.signal,
            credentials: "include",
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Error ${res.status}. ${text}`);
          }
          const data = await res.json().catch(() => ({}));
          return normalizeDetailItem(data);
        };

        const genericPromise = loadJson(`${apiUrl}/contenidos/${id}`);
        const typedPromise = endpoint
          ? loadJson(`${apiUrl}/${endpoint}/${id}`)
          : Promise.resolve(null);

        const [genericResult, typedResult] = await Promise.allSettled([
          genericPromise,
          typedPromise,
        ]);

        const genericItem =
          genericResult.status === "fulfilled" ? genericResult.value : null;
        const typedItem =
          typedResult.status === "fulfilled" ? typedResult.value : null;

        if (!genericItem && !typedItem) {
          const genericReason =
            genericResult.status === "rejected"
              ? genericResult.reason
              : new Error("Error cargando contenido.");
          throw genericReason;
        }

        setRemoteItem({
          ...(typedItem ?? {}),
          ...(genericItem ?? {}),
        });
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Error cargando el detalle."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [type, id, stateItem, localItem, apiUrl, typeEndpoints]);

  const item = useMemo(
    () => remoteItem ?? stateItem ?? localItem,
    [remoteItem, stateItem, localItem]
  );
  const resolvedId =
    item?.id ??
    item?._id ??
    item?.contenidoId ??
    item?.contenido_id ??
    id;
  const normalizedId = resolvedId != null ? String(resolvedId) : "";
  const normalizedType = type && type.trim() ? type : "pelicula";

  return {
    item,
    loading,
    error,
    normalizedId,
    normalizedType,
  };
}
