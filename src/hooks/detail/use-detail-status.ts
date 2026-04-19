import { useCallback, useEffect, useState } from "react";
import {
  type ContentStatus,
  updateContentStatus,
} from "@/services/content-status";
import { syncContentInStatusLists } from "@/services/status-lists-sync";
import { appendProfileActivity } from "@/services/profile-activity";
import { parseStoredStatus, pickString } from "@/pages/detail-page.helpers";

type StatusOption = {
  value: ContentStatus;
  label: string;
};

type UseDetailStatusArgs = {
  item: any;
  isLoggedIn: boolean;
  normalizedId: string;
  normalizedType: string;
  statusCacheKey: string;
  sessionUsername: string;
  title: string;
  statusOptions: StatusOption[];
};

export function useDetailStatus({
  item,
  isLoggedIn,
  normalizedId,
  normalizedType,
  statusCacheKey,
  sessionUsername,
  title,
  statusOptions,
}: UseDetailStatusArgs) {
  const [currentStatus, setCurrentStatus] = useState<ContentStatus | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStatus(null);
    setStatusMessage(null);
    if (!normalizedId) return;
    try {
      const cachedStatus = parseStoredStatus(localStorage.getItem(statusCacheKey));
      if (cachedStatus) {
        setCurrentStatus(cachedStatus);
      }
    } catch {
      // Si localStorage falla, seguimos sin caché.
    }
  }, [normalizedId, statusCacheKey]);

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
    if (statusCacheKey) {
      localStorage.setItem(statusCacheKey, candidate);
    }
  }, [item, statusCacheKey]);

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
        if (statusCacheKey) {
          localStorage.removeItem(statusCacheKey);
        }
        appendProfileActivity(sessionUsername, {
          type: "service",
          title: `Quitaste el estado de ${title}`,
          date: new Date().toISOString(),
        });
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
        if (statusCacheKey) {
          localStorage.setItem(statusCacheKey, estado);
        }
        const statusOption = statusOptions.find((option) => option.value === estado);
        appendProfileActivity(sessionUsername, {
          type: "service",
          title: `Actualizaste estado en ${title}`,
          detail: statusOption?.label ?? estado,
          date: new Date().toISOString(),
        });
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
      statusCacheKey,
      sessionUsername,
      title,
      statusOptions,
    ]
  );

  return {
    currentStatus,
    statusUpdating,
    statusMessage,
    handleSetStatus,
  };
}
