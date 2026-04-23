import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Camera, Pencil, Plus, Search, Trash2, UserPlus, X, Check } from "lucide-react";
import PageLayout from "@/layouts/layout";
import {
  getListContents,
  updateUserList,
  deleteUserList,
  uploadListImage,
  clearListImage,
  getListMembers,
  addMembersToList,
  removeMembersFromList,
  addContentToList,
  removeContentFromList,
  type BackendContenidoListado,
  type ListaMiembro,
} from "@/services/lists-service";
import { searchContents } from "@/services/search-service";
import { searchUsers, type UserSearchItem } from "@/services/search-service";
import { buildDetailPath } from "@/lib/detail-route";
import ContentCard from "@/components/content-card";
import { getMe } from "@/services/auth-service";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Lista = {
  listaId: number;
  userId: number;
  nombre: string;
  descripcion?: string | null;
  tipoContenidos?: string;
  visibilidad?: string;
  imagen?: string | null;
};

type ContenidoItem = BackendContenidoListado & { tipo?: string | null };

// ── Helpers ───────────────────────────────────────────────────────────────────

const VISIBILIDAD_OPTIONS = [
  { value: "publica",         label: "Pública" },
  { value: "privada",         label: "Privada" },
  { value: "solo_seguidores", label: "Solo seguidores" },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ContentSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}
    >
      <div
        style={{
          aspectRatio: "2/3",
          background: "linear-gradient(90deg, hsl(270 40% 92%) 25%, hsl(270 40% 96%) 50%, hsl(270 40% 92%) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite linear",
        }}
      />
      <div className="p-3 flex flex-col gap-2">
        <div style={{ height: 13, width: "55%", borderRadius: 99, background: "hsl(270 30% 88%)" }} />
        <div style={{ height: 16, width: "85%", borderRadius: 6, background: "hsl(270 30% 90%)" }} />
      </div>
    </div>
  );
}

// ── Modal editar lista ────────────────────────────────────────────────────────

function EditListModal({
  lista,
  onClose,
  onSaved,
}: {
  lista: Lista;
  onClose: () => void;
  onSaved: (updated: Lista) => void;
}) {
  const [nombre, setNombre] = useState(lista.nombre);
  const [descripcion, setDescripcion] = useState(lista.descripcion ?? "");
  const [visibilidad, setVisibilidad] = useState(lista.visibilidad ?? "publica");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setLoading(true);
    setError(null);
    try {
      const updated = await updateUserList(lista.listaId, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        visibilidad: visibilidad as Lista["visibilidad"],
      });
      onSaved({ ...lista, ...updated, nombre: nombre.trim(), descripcion: descripcion.trim() || null, visibilidad });
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,0,30,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "#fff", boxShadow: "0 24px 60px rgba(80,15,120,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ color: "hsl(258 24% 16%)" }}>Editar lista</h2>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "hsl(270 40% 94%)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "hsl(258 16% 40%)" }}>Nombre *</label>
          <input
            type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid hsl(270 30% 85%)", background: "hsl(270 40% 98%)", color: "hsl(258 24% 16%)" }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "hsl(258 16% 40%)" }}>Visibilidad</label>
          <div className="flex gap-2 flex-wrap">
            {VISIBILIDAD_OPTIONS.map((o) => (
              <button
                key={o.value} onClick={() => setVisibilidad(o.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                style={{
                  background: visibilidad === o.value ? "hsl(268 84% 62%)" : "hsl(270 40% 94%)",
                  color: visibilidad === o.value ? "#fff" : "hsl(258 24% 30%)",
                }}
              >{o.label}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "hsl(258 16% 40%)" }}>
            Descripción <span style={{ color: "hsl(258 16% 60%)" }}>(opcional)</span>
          </label>
          <textarea
            value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={300} rows={3}
            placeholder="Describe tu lista…" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
            style={{ border: "1.5px solid hsl(270 30% 85%)", background: "hsl(270 40% 98%)", color: "hsl(258 24% 16%)" }}
          />
        </div>

        {error && <p className="text-xs font-medium" style={{ color: "#dc2626" }}>{error}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "hsl(270 40% 94%)", color: "hsl(258 24% 30%)" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading || !nombre.trim()} className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "hsl(268 84% 62%)", color: "#fff", opacity: loading || !nombre.trim() ? 0.65 : 1 }}>
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panel imagen de portada ───────────────────────────────────────────────────

function CoverImagePanel({
  lista,
  onUpdated,
}: {
  lista: Lista;
  onUpdated: (updated: Lista) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const updated = await uploadListImage(lista.listaId, file);
      onUpdated({ ...lista, ...updated });
      setMessage({ text: "Imagen actualizada.", ok: true });
    } catch (err: unknown) {
      setMessage({ text: (err as Error)?.message ?? "No se pudo subir la imagen.", ok: false });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setMessage(null);
    try {
      const updated = await clearListImage(lista.listaId);
      onUpdated({ ...lista, ...updated, imagen: null });
      setMessage({ text: "Imagen eliminada.", ok: true });
    } catch (err: unknown) {
      setMessage({ text: (err as Error)?.message ?? "No se pudo eliminar la imagen.", ok: false });
    } finally {
      setClearing(false);
    }
  };

  return (
    <section
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "hsl(270 40% 97%)", border: "1.5px solid hsl(270 30% 88%)" }}
    >
      <h3 className="text-sm font-bold" style={{ color: "hsl(258 24% 22%)" }}>Imagen de portada</h3>

      {lista.imagen && (
        <img
          src={lista.imagen} alt="Portada" loading="lazy"
          className="w-full rounded-xl object-cover"
          style={{ maxHeight: 180, objectPosition: "top" }}
        />
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition"
          style={{ background: "hsl(268 84% 62%)", color: "#fff", opacity: uploading ? 0.65 : 1 }}
        >
          <Camera size={13} />
          {uploading ? "Subiendo…" : lista.imagen ? "Cambiar imagen" : "Subir imagen"}
        </button>

        {lista.imagen && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition"
            style={{ background: "hsl(270 40% 92%)", color: "#dc2626", opacity: clearing ? 0.65 : 1 }}
          >
            <Trash2 size={13} />
            {clearing ? "Eliminando…" : "Quitar imagen"}
          </button>
        )}
      </div>

      {message && (
        <p className="text-xs font-medium" style={{ color: message.ok ? "#16a34a" : "#dc2626" }}>
          {message.text}
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
    </section>
  );
}

// ── Panel miembros ────────────────────────────────────────────────────────────

function MembersPanel({ listaId }: { listaId: number }) {
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
      .then((data) => { if (!cancelled) setMiembros(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingMembers(false); });
    return () => { cancelled = true; };
  }, [listaId]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
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

  const memberIds = useMemo(() => new Set(miembros.map((m) => m.userId)), [miembros]);

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
      setMiembros((prev) => prev.filter((m) => m.userId !== userId));
      setMessage({ text: `@${username} eliminado.`, ok: true });
    } catch (err: unknown) {
      setMessage({ text: (err as Error)?.message ?? "No se pudo eliminar.", ok: false });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "hsl(270 40% 97%)", border: "1.5px solid hsl(270 30% 88%)" }}
    >
      <h3 className="text-sm font-bold" style={{ color: "hsl(258 24% 22%)" }}>Miembros</h3>

      {/* Buscador para añadir */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar usuario por nombre…"
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none pr-9"
          style={{ border: "1.5px solid hsl(270 30% 85%)", background: "#fff", color: "hsl(258 24% 16%)" }}
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "hsl(258 16% 55%)" }}>
            …
          </span>
        )}

        {searchResults.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 z-30 rounded-xl mt-1 overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 8px 32px rgba(80,15,120,0.18)", border: "1.5px solid hsl(270 30% 88%)" }}
          >
            {searchResults.slice(0, 6).map((user) => {
              const alreadyMember = memberIds.has(user.userId);
              return (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{ borderBottom: "1px solid hsl(270 30% 93%)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, hsl(268 84% 62%), hsl(295 86% 65%))" }}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: "hsl(258 24% 16%)" }}>
                    @{user.username}
                  </span>
                  {alreadyMember ? (
                    <span className="text-xs font-semibold" style={{ color: "hsl(258 16% 60%)" }}>Ya miembro</span>
                  ) : (
                    <button
                      onClick={() => handleAdd(user)}
                      disabled={addingId === user.userId}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition"
                      style={{ background: "hsl(268 84% 62%)", color: "#fff", opacity: addingId === user.userId ? 0.6 : 1 }}
                    >
                      <UserPlus size={11} />
                      {addingId === user.userId ? "…" : "Añadir"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de miembros actuales */}
      {loadingMembers ? (
        <p className="text-xs" style={{ color: "hsl(258 16% 55%)" }}>Cargando miembros…</p>
      ) : miembros.length === 0 ? (
        <p className="text-xs" style={{ color: "hsl(258 16% 55%)" }}>Esta lista no tiene miembros aún.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {miembros.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 py-1">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden"
                style={{ background: "linear-gradient(135deg, hsl(268 84% 62%), hsl(295 86% 65%))" }}
              >
                {m.foto ? (
                  <img src={m.foto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    {m.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "hsl(258 24% 16%)" }}>@{m.username}</p>
                {m.rol && (
                  <p className="text-[10px] capitalize" style={{ color: "hsl(258 16% 55%)" }}>{m.rol}</p>
                )}
              </div>
              <button
                onClick={() => handleRemove(m.userId, m.username)}
                disabled={removingId === m.userId}
                className="flex items-center justify-center w-7 h-7 rounded-full transition"
                style={{ background: "hsl(270 40% 92%)", opacity: removingId === m.userId ? 0.5 : 1 }}
                aria-label="Quitar miembro"
              >
                <X size={12} color="#dc2626" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: message.ok ? "#16a34a" : "#dc2626" }}>
          {message.ok && <Check size={12} />}
          {message.text}
        </p>
      )}
    </section>
  );
}

// ── Tarjeta de contenido con botón eliminar ───────────────────────────────────

function RemovableContentCard({
  item,
  listaId,
  canRemove,
  onRemoved,
  style,
}: {
  item: ContenidoItem;
  listaId: number;
  canRemove: boolean;
  onRemoved: (id: number) => void;
  style?: React.CSSProperties;
}) {
  const [removing, setRemoving] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmId !== item.id) {
      // Primer click: pedir confirmación
      setConfirmId(item.id);
      setTimeout(() => setConfirmId(null), 2500);
      return;
    }
    // Segundo click: borrar
    setRemoving(true);
    try {
      await removeContentFromList(listaId, item.id);
      onRemoved(item.id);
    } catch {
      setRemoving(false);
      setConfirmId(null);
    }
  };

  return (
    <div className="relative group flex" style={style}>
      {canRemove && (
        <button
          onClick={handleRemove}
          disabled={removing}
          aria-label="Quitar de la lista"
          className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition-all duration-200 opacity-0 group-hover:opacity-100"
          style={{
            background: confirmId === item.id ? "#dc2626" : "rgba(20,0,40,0.72)",
            color: "#fff",
            backdropFilter: "blur(4px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <Trash2 size={10} />
          {removing ? "…" : confirmId === item.id ? "¿Confirmar?" : "Quitar"}
        </button>
      )}
      <ContentCard
        title={item.titulo}
        image={item.portada}
        type={item.tipo}
        score={item.puntuacion ?? item.puntuacionApi}
        to={buildDetailPath(item.tipo, item.id, item.titulo)}
        state={{ item: { id: item.id, titulo: item.titulo, tipo: item.tipo } }}
      />
    </div>
  );
}

// ── Panel añadir contenido ────────────────────────────────────────────────────

type SearchResult = {
  id: number;
  titulo: string;
  portada?: string | null;
  tipo?: string | null;
};

function AddContentPanel({
  listaId,
  tipoContenidos,
  currentIds,
  onAdded,
}: {
  listaId: number;
  tipoContenidos?: string;
  currentIds: Set<number>;
  onAdded: (item: ContenidoItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ id: number; text: string; ok: boolean } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      try {
        const res = await searchContents(query, abortRef.current.signal, { pageSize: 20 });
        const items = (res.items ?? []) as SearchResult[];
        // Filtra por tipo de contenido de la lista
        const filtered = tipoContenidos
          ? items.filter((i) => !i.tipo || i.tipo === tipoContenidos)
          : items;
        setResults(filtered);
      } catch (e: unknown) {
        if ((e as Error)?.name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, tipoContenidos]);

  const handleAdd = async (item: SearchResult) => {
    setAddingId(item.id);
    setMessage(null);
    try {
      await addContentToList(listaId, item.id);
      onAdded({ id: item.id, titulo: item.titulo, portada: item.portada, tipo: item.tipo });
      setMessage({ id: item.id, text: `"${item.titulo}" añadido.`, ok: true });
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "No se pudo añadir.";
      const alreadyIn = msg.toLowerCase().includes("ya está") || msg.toLowerCase().includes("exists");
      setMessage({ id: item.id, text: alreadyIn ? "Ya está en la lista." : msg, ok: alreadyIn });
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (item: SearchResult) => {
    setAddingId(item.id);
    setMessage(null);
    try {
      await removeContentFromList(listaId, item.id);
      setMessage({ id: item.id, text: `"${item.titulo}" eliminado de la lista.`, ok: true });
    } catch (err: unknown) {
      setMessage({ id: item.id, text: (err as Error)?.message ?? "No se pudo quitar.", ok: false });
    } finally {
      setAddingId(null);
    }
  };

  const TIPO_LABEL: Record<string, string> = {
    pelicula: "películas", serie: "series", libro: "libros", videojuego: "videojuegos",
  };

  return (
    <section
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "hsl(270 40% 97%)", border: "1.5px solid hsl(270 30% 88%)" }}
    >
      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "hsl(258 24% 22%)" }}>
        <Plus size={15} style={{ color: "hsl(268 84% 62%)" }} />
        Añadir contenido
      </h3>

      {/* Buscador */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search size={13} color="hsl(258 16% 60%)" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Buscar ${tipoContenidos ? TIPO_LABEL[tipoContenidos] ?? tipoContenidos : "contenidos"}…`}
          className="w-full rounded-xl pl-8 pr-3 py-2.5 text-sm outline-none"
          style={{ border: "1.5px solid hsl(270 30% 85%)", background: "#fff", color: "hsl(258 24% 16%)" }}
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs animate-pulse" style={{ color: "hsl(258 16% 55%)" }}>
            …
          </span>
        )}
      </div>

      {/* Mensaje global */}
      {message && !results.find((r) => r.id === message.id) && (
        <p className="text-xs font-medium flex items-center gap-1.5"
          style={{ color: message.ok ? "#16a34a" : "#dc2626" }}>
          {message.ok && <Check size={12} />}
          {message.text}
        </p>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {results.map((item) => {
            const inList = currentIds.has(item.id);
            const isProcessing = addingId === item.id;
            const itemMsg = message?.id === item.id ? message : null;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl p-2"
                style={{ background: inList ? "rgba(124,58,237,0.07)" : "#fff", border: "1px solid hsl(270 30% 90%)" }}
              >
                {/* Miniportada */}
                <div
                  className="w-9 h-12 rounded-lg flex-shrink-0 overflow-hidden"
                  style={{ background: "hsl(270 40% 90%)" }}
                >
                  {item.portada ? (
                    <img src={item.portada} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ fontSize: 18, color: "hsl(268 84% 70%)", fontWeight: 900 }}>
                      {item.titulo.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Título */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "hsl(258 24% 16%)" }}>
                    {item.titulo}
                  </p>
                  {itemMsg && (
                    <p className="text-[10px] mt-0.5 flex items-center gap-1"
                      style={{ color: itemMsg.ok ? "#16a34a" : "#dc2626" }}>
                      {itemMsg.ok && <Check size={9} />}
                      {itemMsg.text}
                    </p>
                  )}
                </div>

                {/* Botón */}
                {inList ? (
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={isProcessing}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition"
                    style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626", opacity: isProcessing ? 0.5 : 1 }}
                  >
                    <X size={10} />
                    {isProcessing ? "…" : "Quitar"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAdd(item)}
                    disabled={isProcessing}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition"
                    style={{ background: "hsl(268 84% 62%)", color: "#fff", opacity: isProcessing ? 0.5 : 1 }}
                  >
                    <Plus size={10} />
                    {isProcessing ? "…" : "Añadir"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className="text-xs" style={{ color: "hsl(258 16% 55%)" }}>
          Sin resultados para "{query}"
        </p>
      )}
    </section>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<Lista | null>(null);
  const [contenidos, setContenidos] = useState<ContenidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // IDs de contenidos ya en la lista (para el panel de búsqueda)
  const currentContentIds = useMemo(
    () => new Set(contenidos.map((c) => c.id)),
    [contenidos]
  );

  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userRole = (localStorage.getItem("userRole") ?? "").toLowerCase();
  const isAdmin = userRole === "admin";

  const backPath = useMemo(() => {
    if (location.pathname.includes("/listas/listas-opinify")) return "/listas/listas-opinify";
    if (location.pathname.includes("/listas/nuestras-listas")) return "/listas/listas-opinify";
    if (location.pathname.includes("/listas/mis-listas")) return "/listas/mis-listas";
    return "/listas";
  }, [location.pathname]);
  const backLabel = backPath.includes("listas-opinify") ? "Listas Opinify" : "Mis listas";

  // Resolvemos el userId del usuario logueado
  useEffect(() => {
    if (!isLoggedIn) return;
    getMe().then((res) => {
      if (res.success && res.user) setCurrentUserId(res.user.user_id);
    }).catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      if (!isLoggedIn) { setList(null); setContenidos([]); setLoading(false); return; }
      const listaId = Number(id);
      if (!Number.isFinite(listaId)) { setError("ID de lista inválido"); setLoading(false); return; }
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
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("userRole");
          localStorage.removeItem("currentUser");
          navigate("/login");
          return;
        }
        setError(msg || "Error cargando la lista");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isLoggedIn, navigate]);

  const isOwner = list != null && (isAdmin || list.userId === currentUserId);

  const handleDeleteList = async () => {
    if (!list) return;
    setDeleting(true);
    try {
      await deleteUserList(list.listaId);
      navigate(backPath, { replace: true });
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "No se pudo eliminar la lista.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <PageLayout>
      {showEdit && list && (
        <EditListModal lista={list} onClose={() => setShowEdit(false)} onSaved={(updated) => { setList(updated); setShowEdit(false); }} />
      )}

      {showDeleteConfirm && list && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,0,30,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: "#fff", boxShadow: "0 24px 60px rgba(80,15,120,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base" style={{ color: "hsl(258 24% 16%)" }}>Eliminar lista</h3>
            <p className="text-sm" style={{ color: "hsl(258 16% 40%)" }}>
              ¿Estás seguro de que quieres eliminar <strong>"{list.nombre}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "hsl(270 40% 94%)", color: "hsl(258 24% 30%)" }}>Cancelar</button>
              <button onClick={handleDeleteList} disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "#dc2626", color: "#fff", opacity: deleting ? 0.7 : 1 }}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <main className="min-h-screen px-6 py-12" style={{ background: "hsl(264 100% 99%)" }}>
        <div className="max-w-6xl mx-auto">
          {/* Miga de pan */}
          <nav className="flex items-center gap-2 text-xs mb-8" style={{ color: "hsl(258 16% 55%)", animation: "fadeUp 0.4s ease both" }}>
            <Link to="/listas" style={{ color: "hsl(268 84% 62%)" }} className="hover:underline">Listas</Link>
            <span>/</span>
            <Link to={backPath} style={{ color: "hsl(268 84% 62%)" }} className="hover:underline">{backLabel}</Link>
            {list && <><span>/</span><span>{list.nombre}</span></>}
          </nav>

          {/* No logueado */}
          {!isLoggedIn ? (
            <div className="rounded-3xl p-10 text-center max-w-md mx-auto"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
              <p className="mb-5" style={{ color: "hsl(258 16% 40%)" }}>Inicia sesión para ver esta lista.</p>
              <Link to="/login" className="font-bold py-2.5 px-6 rounded-2xl text-white text-sm inline-block"
                style={{ background: "hsl(268 84% 62%)" }}>Iniciar sesión</Link>
            </div>

          ) : loading ? (
            <>
              <div className="mb-10" style={{ animation: "fadeUp 0.4s ease both" }}>
                <div style={{ height: 36, width: 260, borderRadius: 10, background: "hsl(270 30% 90%)", marginBottom: 12 }} />
                <div style={{ height: 16, width: 420, borderRadius: 8, background: "hsl(270 30% 92%)" }} />
              </div>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => <ContentSkeleton key={i} />)}
              </div>
            </>

          ) : error ? (
            <div className="rounded-3xl p-8 max-w-md text-center"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
              <p style={{ color: "hsl(258 16% 40%)" }}>{error}</p>
            </div>

          ) : !list ? (
            <p style={{ color: "hsl(258 16% 40%)" }}>Lista no encontrada.</p>

          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* ── Columna izquierda: info + herramientas de edición ── */}
              <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4" style={{ animation: "fadeUp 0.4s ease both" }}>
                {/* Cabecera de la lista */}
                <div
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: "hsl(270 40% 97%)", border: "1.5px solid hsl(270 30% 88%)" }}
                >
                  {list.imagen && (
                    <img src={list.imagen} alt="Portada" className="w-full rounded-xl object-cover" style={{ maxHeight: 160, objectPosition: "top" }} />
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h1 className="font-black text-xl leading-snug" style={{ color: "hsl(258 24% 16%)" }}>
                      {list.nombre}
                    </h1>
                    {isOwner && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setShowEdit(true)}
                          className="flex items-center justify-center w-8 h-8 rounded-full transition"
                          style={{ background: "hsl(270 40% 92%)" }}
                          aria-label="Editar lista"
                        >
                          <Pencil size={14} color="hsl(268 84% 50%)" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center justify-center w-8 h-8 rounded-full transition"
                          style={{ background: "hsl(270 40% 92%)" }}
                          aria-label="Eliminar lista"
                        >
                          <Trash2 size={14} color="#dc2626" />
                        </button>
                      </div>
                    )}
                  </div>

                  {list.visibilidad && (
                    <span
                      className="self-start text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: "rgba(124,58,237,0.12)", color: "hsl(268 84% 50%)" }}
                    >
                      {list.visibilidad === "publica" ? "Pública"
                        : list.visibilidad === "privada" ? "Privada"
                        : "Seguidores"}
                    </span>
                  )}

                  {list.descripcion && (
                    <p className="text-xs leading-relaxed" style={{ color: "hsl(258 16% 40%)" }}>
                      {list.descripcion}
                    </p>
                  )}

                  <p className="text-xs" style={{ color: "hsl(258 16% 55%)" }}>
                    {contenidos.length} {contenidos.length === 1 ? "elemento" : "elementos"}
                  </p>
                </div>

                {/* Imagen portada — solo propietario */}
                {isOwner && (
                  <CoverImagePanel lista={list} onUpdated={setList} />
                )}

                {/* Miembros — solo propietario */}
                {isOwner && (
                  <MembersPanel listaId={list.listaId} />
                )}

                {/* Añadir contenido — solo propietario */}
                {isOwner && (
                  <AddContentPanel
                    listaId={list.listaId}
                    tipoContenidos={list.tipoContenidos}
                    currentIds={currentContentIds}
                    onAdded={(item) =>
                      setContenidos((prev) =>
                        prev.some((c) => c.id === item.id) ? prev : [...prev, item]
                      )
                    }
                  />
                )}
              </aside>

              {/* ── Columna derecha: contenidos ── */}
              <div className="flex-1 min-w-0" style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
                {contenidos.length === 0 ? (
                  <div className="rounded-3xl p-10 text-center max-w-md"
                    style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
                    <p style={{ color: "hsl(258 16% 40%)" }}>Esta lista todavía no tiene contenidos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
                    {contenidos.map((item, i) => (
                      <RemovableContentCard
                        key={item.id}
                        item={item}
                        listaId={list.listaId}
                        canRemove={isOwner}
                        onRemoved={(id) =>
                          setContenidos((prev) => prev.filter((c) => c.id !== id))
                        }
                        style={{ animation: `fadeUp 0.35s ease ${i * 0.04}s both` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
