import { useEffect, useState } from "react";
import { getMe } from "@/services/auth-service";
import { getListContents } from "@/services/lists-service";
import type { ContenidoItem, Lista } from "@/types/list-detail";

type UseListDetailDataOptions = {
  id?: string;
  isLoggedIn: boolean;
  onUnauthorized: () => void;
};

export function useCurrentUserId(isLoggedIn: boolean) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentUserId(null);
      return;
    }

    getMe()
      .then((res) => {
        if (res.success && res.user) setCurrentUserId(res.user.user_id);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  return currentUserId;
}

export function useListDetailData({
  id,
  isLoggedIn,
  onUnauthorized,
}: UseListDetailDataOptions) {
  const [list, setList] = useState<Lista | null>(null);
  const [contenidos, setContenidos] = useState<ContenidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (!isLoggedIn) {
        setList(null);
        setContenidos([]);
        setLoading(false);
        return;
      }

      const listaId = Number(id);
      if (!Number.isFinite(listaId)) {
        setError("ID de lista inválido");
        setLoading(false);
        return;
      }

      try {
        const data = await getListContents(listaId);
        setList({
          listaId: data.lista.listaId,
          userId: data.lista.userId,
          nombre: data.lista.nombre,
          descripcion: data.lista.descripcion,
          tipoContenidos: data.lista.tipoContenidos,
          visibilidad: data.lista.visibilidad,
          imagen: data.lista.imagen,
        });
        setContenidos(data.contenidos ?? []);
      } catch (e: unknown) {
        const msg = String((e as Error)?.message ?? "");
        if (msg.startsWith("401")) {
          onUnauthorized();
          return;
        }
        setError(msg || "Error cargando la lista");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, isLoggedIn, onUnauthorized]);

  return {
    list,
    setList,
    contenidos,
    setContenidos,
    loading,
    error,
    setError,
  };
}
