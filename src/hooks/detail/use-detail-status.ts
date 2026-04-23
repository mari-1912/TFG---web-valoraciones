import { useCallback, useEffect, useState } from "react";
import {
  type ContentStatus,
  updateContentStatus,
} from "@/services/content-status";
import { syncContentInStatusLists } from "@/services/status-lists-sync";
import { parseStoredStatus, pickString } from "@/pages/detail-page.helpers";

type UseDetailStatusArgs = {
  item: any;
  isLoggedIn: boolean;
  normalizedId: string;
  normalizedType: string;
};

export function useDetailStatus({
  item,
  isLoggedIn,
  normalizedId,
  normalizedType,
}: UseDetailStatusArgs) {
  const [currentStatus, setCurrentStatus] = useState<ContentStatus | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStatus(null);
    setStatusMessage(null);
  }, [normalizedId]);

  useEffect(() => {
    if (!item) return;
    const candidate = parseStoredStatus(
      pickString(
        item?.estado,
        item?.status,
        item?.userStatus,
        item?.personalStatus,
        item?.estadoPersonal,
        item?.estado?.estado,
        item?.estadoUsuario?.estado,
        item?.estado_personal?.estado
      )
    );
    if (candidate == null) return;

    setCurrentStatus((prev) => (prev === candidate ? prev : candidate));
  }, [item]);

  const handleSetStatus = useCallback(
    async (estado: ContentStatus | null) => {
      if (!isLoggedIn) {
        setStatusMessage("Inicia sesión para guardar el estado.");
        return;
      }
      if (!normalizedId) return;
      if (estado === null) {
        await syncContentInStatusLists(normalizedId, normalizedType, null).catch(
          () => undefined
        );
        setCurrentStatus(null);
        setStatusMessage(null);
        return;
      }

      setStatusUpdating(true);
      setStatusMessage(null);
      try {
        await updateContentStatus(normalizedId, estado);
        await syncContentInStatusLists(normalizedId, normalizedType, estado).catch(
          () => undefined
        );
        setCurrentStatus(estado);
      } catch (err) {
        setStatusMessage(
          err instanceof Error ? err.message : "No se pudo actualizar el estado."
        );
      } finally {
        setStatusUpdating(false);
      }
    },
    [
      isLoggedIn,
      normalizedId,
      normalizedType,
    ]
  );

  return {
    currentStatus,
    statusUpdating,
    statusMessage,
    handleSetStatus,
  };
}
