import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMembersToList,
  getListMembers,
  removeMembersFromList,
  type ListaMiembro,
} from "@/services/lists-service";
import { searchUsers, type UserSearchItem } from "@/services/search-service";

export function useListMembers(listaId: number) {
  const [miembros, setMiembros] = useState<ListaMiembro[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingMembers(true);
    getListMembers(listaId)
      .then((data) => {
        if (!cancelled) setMiembros(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingMembers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listaId]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchUsers(searchQuery);
        setSearchResults(res.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [searchQuery]);

  const memberIds = useMemo(() => new Set(miembros.map((member) => member.userId)), [miembros]);

  const handleAdd = async (user: UserSearchItem) => {
    setAddingId(user.userId);
    setMessage(null);
    try {
      await addMembersToList(listaId, [user.userId]);
      setMiembros((prev) => [
        ...prev,
        { userId: user.userId, username: user.username, rol: "colaborador", foto: user.avatarUrl },
      ]);
      setMessage({ text: `@${user.username} añadido.`, ok: true });
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: unknown) {
      setMessage({ text: (err as Error)?.message ?? "No se pudo añadir.", ok: false });
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (userId: number, username: string) => {
    setRemovingId(userId);
    setMessage(null);
    try {
      await removeMembersFromList(listaId, [userId]);
      setMiembros((prev) => prev.filter((member) => member.userId !== userId));
      setMessage({ text: `@${username} eliminado.`, ok: true });
    } catch (err: unknown) {
      setMessage({ text: (err as Error)?.message ?? "No se pudo eliminar.", ok: false });
    } finally {
      setRemovingId(null);
    }
  };

  return {
    miembros,
    loadingMembers,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    addingId,
    removingId,
    message,
    memberIds,
    handleAdd,
    handleRemove,
  };
}
