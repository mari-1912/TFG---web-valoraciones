import { useCallback, useEffect, useState } from "react";
import {
  deleteContentRating,
  setContentRating,
} from "@/services/content-rating";
import { appendProfileActivity } from "@/services/profile-activity";
import { parseRating } from "@/pages/detail-page.helpers";

type UseDetailRatingArgs = {
  item: any;
  isLoggedIn: boolean;
  normalizedId: string;
  ratingCacheKey: string;
  sessionUsername: string;
  title: string;
};

export function useDetailRating({
  item,
  isLoggedIn,
  normalizedId,
  ratingCacheKey,
  sessionUsername,
  title,
}: UseDetailRatingArgs) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingUpdating, setRatingUpdating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);

  useEffect(() => {
    setUserRating(null);
    setRatingMessage(null);
    if (!normalizedId) return;
    try {
      const cachedRating = parseRating(localStorage.getItem(ratingCacheKey));
      if (cachedRating != null) {
        setUserRating(cachedRating);
      }
    } catch {
      // Si localStorage falla, seguimos sin caché.
    }
  }, [normalizedId, ratingCacheKey]);

  useEffect(() => {
    if (!item) return;
    const candidate = parseRating(
      item?.puntuacion_usuario ??
        item?.valoracion_usuario ??
        item?.userRating ??
        item?.personalRating ??
        item?.miValoracion ??
        item?.puntuacionPersonal ??
        item?.mi_puntuacion ??
        item?.rating_user ??
        item?.valoracion?.puntuacion ??
        item?.valoracionUsuario?.puntuacion ??
        item?.valoracion_personal?.puntuacion
    );
    if (candidate == null) return;

    setUserRating((prev) => (prev === candidate ? prev : candidate));
    if (ratingCacheKey) {
      localStorage.setItem(ratingCacheKey, String(candidate));
    }
  }, [item, ratingCacheKey]);

  const handleSetRating = useCallback(
    async (value: number) => {
      if (!isLoggedIn) {
        setRatingMessage("Inicia sesión para valorar.");
        return;
      }
      if (!normalizedId) {
        setRatingMessage("No se pudo identificar el contenido para valorar.");
        return;
      }
      setRatingUpdating(true);
      setRatingMessage(null);
      try {
        await setContentRating(normalizedId, value);
        setUserRating(value);
        if (ratingCacheKey) {
          localStorage.setItem(ratingCacheKey, String(value));
        }
        appendProfileActivity(sessionUsername, {
          type: "rating",
          title: `Valoraste ${title}`,
          detail: `${value}/10`,
          date: new Date().toISOString(),
        });
      } catch (err) {
        setRatingMessage(
          err instanceof Error ? err.message : "No se pudo guardar la valoración."
        );
      } finally {
        setRatingUpdating(false);
      }
    },
    [isLoggedIn, normalizedId, ratingCacheKey, sessionUsername, title]
  );

  const handleClearRating = useCallback(async () => {
    if (!isLoggedIn) {
      setRatingMessage("Inicia sesión para valorar.");
      return;
    }
    if (!normalizedId) {
      setRatingMessage("No se pudo identificar el contenido para valorar.");
      return;
    }
    setRatingUpdating(true);
    setRatingMessage(null);
    try {
      await deleteContentRating(normalizedId);
      setUserRating(null);
      if (ratingCacheKey) {
        localStorage.removeItem(ratingCacheKey);
      }
      appendProfileActivity(sessionUsername, {
        type: "rating",
        title: `Quitaste tu valoración en ${title}`,
        date: new Date().toISOString(),
      });
    } catch (err) {
      setRatingMessage(
        err instanceof Error ? err.message : "No se pudo eliminar la valoración."
      );
    } finally {
      setRatingUpdating(false);
    }
  }, [isLoggedIn, normalizedId, ratingCacheKey, sessionUsername, title]);

  return {
    userRating,
    ratingUpdating,
    ratingMessage,
    handleSetRating,
    handleClearRating,
  };
}
