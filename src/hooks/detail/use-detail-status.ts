import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ContentStatus,
  updateContentStatus,
} from "@/services/content-status";
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
  statusCacheKey: string;
  sessionUsername: string;
  title: string;
  statusOptions: StatusOption[];
};

export function useDetailStatus({
  item,
  isLoggedIn,
  normalizedId,
  statusCacheKey,
  sessionUsername,
  title,
  statusOptions,
}: UseDetailStatusArgs) {
  const [currentStatus, setCurrentStatus] = useState<ContentStatus | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const statusInitializedRef = useRef(false);

  useEffect(() => {
    statusInitializedRef.current = false;
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
    if (!item || statusInitializedRef.current) return;
    const candidate = parseStoredStatus(
      pickString(
        item?.estado,
        item?.status,
        item?.userStatus,
        item?.estado?.estado,
        item?.estadoUsuario?.estado
      )
    );
    if (candidate != null) {
      setCurrentStatus(candidate);
      if (statusCacheKey) {
        localStorage.setItem(statusCacheKey, candidate);
      }
    }
    statusInitializedRef.current = true;
  }, [item, statusCacheKey]);

  const handleSetStatus = useCallback(
    async (estado: ContentStatus | null) => {
      if (!isLoggedIn) {
        setStatusMessage("Inicia sesión para guardar el estado.");
        return;
      }
      if (!normalizedId) return;
      if (estado === null) {
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
