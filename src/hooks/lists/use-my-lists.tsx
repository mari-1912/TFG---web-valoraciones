import { useEffect, useMemo, useState } from "react";
import type { BackendLista } from "@/services/lists-service";
import { resolveBaseLists } from "@/services/listas/my-lists";

type UseBaseListsInput = {
  requestedUserId: number | null;
  targetUserId: number | null;
  myUserId: number | null;
  enabled?: boolean;
};

export function useBaseLists({
  requestedUserId,
  targetUserId,
  myUserId,
  enabled = true,
}: UseBaseListsInput) {
  const [lists, setLists] = useState<BackendLista[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageLists = useMemo(
    () =>
      requestedUserId == null ||
      (targetUserId != null && myUserId != null && targetUserId === myUserId),
    [requestedUserId, targetUserId, myUserId]
  );

  useEffect(() => {
    let cancelled = false;
    if (!enabled) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await resolveBaseLists({ targetUserId, canManageLists });
        if (!cancelled) setLists(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error cargando listas");
          setLists([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetUserId, canManageLists, enabled]);

  return { lists, loading, error, canManageLists };
}
