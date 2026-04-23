import { useCallback, useEffect, useState } from "react";
import {
  deleteContentRating,
  setContentRating,
} from "@/services/content-rating";
import { parseRating } from "@/pages/detail-page.helpers";

type UseDetailRatingArgs = {
  item: any;
  isLoggedIn: boolean;
  canRate: boolean;
  normalizedId: string;
};

export function useDetailRating({
  item,
  isLoggedIn,
  canRate,
  normalizedId,
}: UseDetailRatingArgs) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingUpdating, setRatingUpdating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);

  useEffect(() => {
    setUserRating(null);
    setRatingMessage(null);
  }, [normalizedId]);

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
  }, [item]);

  const handleSetRating = useCallback(
    async (value: number) => {
      if (!isLoggedIn) {
        setRatingMessage("Inicia sesión para valorar.");
        return;
      }
      if (!canRate) {
        setRatingMessage("Marca el contenido como completado para poder puntuar.");
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
      } catch (err) {
        setRatingMessage(
          err instanceof Error ? err.message : "No se pudo guardar la valoración."
        );
      } finally {
        setRatingUpdating(false);
      }
    },
    [isLoggedIn, canRate, normalizedId]
  );

  const handleClearRating = useCallback(async () => {
    if (!isLoggedIn) {
      setRatingMessage("Inicia sesión para valorar.");
      return;
    }
    if (!canRate) {
      setRatingMessage("Marca el contenido como completado para gestionar tu puntuación.");
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
    } catch (err) {
      setRatingMessage(
        err instanceof Error ? err.message : "No se pudo eliminar la valoración."
      );
    } finally {
      setRatingUpdating(false);
    }
  }, [isLoggedIn, canRate, normalizedId]);

  return {
    userRating,
    ratingUpdating,
    ratingMessage,
    handleSetRating,
    handleClearRating,
  };
}
