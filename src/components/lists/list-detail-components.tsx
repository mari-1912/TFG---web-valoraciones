import { useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, MouseEvent } from "react";
import { Camera, Check, Plus, Trash2, UserPlus, X } from "lucide-react";
import { buildDetailPath } from "@/lib/detail-route";
import ContentCard from "@/components/content-card";
import { SearchBox } from "@/components/search/search-box";
import {
  addContentToList,
  clearListImage,
  removeContentFromList,
  updateUserList,
  uploadListImage,
} from "@/services/lists-service";
import { useListMembers } from "@/hooks/lists/use-list-members";
import {
  importExternalContent,
  useExternalContentSearch,
  type ExternalContentSuggestion,
  type ExternalContentType,
} from "@/hooks/search/use-external-content-search";
import type { ContenidoItem, Lista } from "@/types/list-detail";

const VISIBILIDAD_OPTIONS = [
  { value: "publica", label: "Pública" },
  { value: "privada", label: "Privada" },
  { value: "solo_seguidores", label: "Solo seguidores" },
];

const TIPO_LABEL: Record<string, string> = {
  pelicula: "películas",
  serie: "series",
  libro: "libros",
  videojuego: "videojuegos",
};

const resolveListExternalType = (value?: string): ExternalContentType | null => {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "pelicula" || normalized === "peliculas") return "pelicula";
  if (normalized === "serie" || normalized === "series") return "serie";
  if (normalized === "libro" || normalized === "libros") return "libro";
  if (normalized === "videojuego" || normalized === "videojuegos") return "videojuego";
  return null;
};

export function ContentSkeleton() {
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

export function EditListModal({
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
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await updateUserList(lista.listaId, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        visibilidad: visibilidad as Lista["visibilidad"],
      });
      onSaved({
        ...lista,
        ...updated,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        visibilidad,
      });
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
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid hsl(270 30% 85%)", background: "hsl(270 40% 98%)", color: "hsl(258 24% 16%)" }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "hsl(258 16% 40%)" }}>Visibilidad</label>
          <div className="flex gap-2 flex-wrap">
            {VISIBILIDAD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setVisibilidad(option.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                style={{
                  background: visibilidad === option.value ? "hsl(268 84% 62%)" : "hsl(270 40% 94%)",
                  color: visibilidad === option.value ? "#fff" : "hsl(258 24% 30%)",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "hsl(258 16% 40%)" }}>
            Descripción <span style={{ color: "hsl(258 16% 60%)" }}>(opcional)</span>
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Describe tu lista…"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
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

export function CoverImagePanel({
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

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
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
      className="relative z-40 rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "hsl(270 40% 97%)", border: "1.5px solid hsl(270 30% 88%)" }}
    >
      <h3 className="text-sm font-bold" style={{ color: "hsl(258 24% 22%)" }}>Imagen de portada</h3>

      {lista.imagen && (
        <img
          src={lista.imagen}
          alt="Portada"
          loading="lazy"
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

export function MembersPanel({ listaId }: { listaId: number }) {
  const {
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
  } = useListMembers(listaId);

  return (
    <section
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "hsl(270 40% 97%)", border: "1.5px solid hsl(270 30% 88%)" }}
    >
      <h3 className="text-sm font-bold" style={{ color: "hsl(258 24% 22%)" }}>Miembros</h3>

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

      {loadingMembers ? (
        <p className="text-xs" style={{ color: "hsl(258 16% 55%)" }}>Cargando miembros…</p>
      ) : miembros.length === 0 ? (
        <p className="text-xs" style={{ color: "hsl(258 16% 55%)" }}>Esta lista no tiene miembros aún.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {miembros.map((member) => (
            <li key={member.userId} className="flex items-center gap-3 py-1">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden"
                style={{ background: "linear-gradient(135deg, hsl(268 84% 62%), hsl(295 86% 65%))" }}
              >
                {member.foto ? (
                  <img src={member.foto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    {member.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "hsl(258 24% 16%)" }}>@{member.username}</p>
                {member.rol && (
                  <p className="text-[10px] capitalize" style={{ color: "hsl(258 16% 55%)" }}>{member.rol}</p>
                )}
              </div>
              <button
                onClick={() => handleRemove(member.userId, member.username)}
                disabled={removingId === member.userId}
                className="flex items-center justify-center w-7 h-7 rounded-full transition"
                style={{ background: "hsl(270 40% 92%)", opacity: removingId === member.userId ? 0.5 : 1 }}
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

export function RemovableContentCard({
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
  style?: CSSProperties;
}) {
  const [removing, setRemoving] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const handleRemove = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmId !== item.id) {
      setConfirmId(item.id);
      setTimeout(() => setConfirmId(null), 2500);
      return;
    }

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
          className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold opacity-100 transition-all duration-200 md:opacity-0 md:group-hover:opacity-100"
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

export function AddContentPanel({
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
  const externalType = resolveListExternalType(tipoContenidos);
  const contentSearch = useExternalContentSearch({
    type: externalType,
    pageSize: 12,
    limit: 8,
  });
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const handleAdd = async (item: ExternalContentSuggestion) => {
    setAddingId(item.id);
    setMessage(null);
    try {
      const payload = await importExternalContent(item.type, item.externalId);
      const importedItem = payload?.item ?? payload;
      const importedId = Number(importedItem?.id ?? importedItem?._id);

      if (!Number.isFinite(importedId) || importedId <= 0) {
        throw new Error("Se importó el contenido, pero no se pudo obtener su ID.");
      }

      if (currentIds.has(importedId)) {
        setMessage({ id: item.id, text: "Ya está en la lista.", ok: true });
        return;
      }

      await addContentToList(listaId, importedId);
      onAdded({
        id: importedId,
        titulo: importedItem?.titulo ?? importedItem?.title ?? item.title,
        portada:
          importedItem?.portada ??
          importedItem?.poster ??
          importedItem?.image ??
          item.image,
        tipo: importedItem?.tipo ?? item.type,
      });

      setMessage({ id: item.id, text: `"${item.title}" añadido.`, ok: true });
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "No se pudo añadir.";
      const alreadyIn = msg.toLowerCase().includes("ya está") || msg.toLowerCase().includes("exists");
      setMessage({ id: item.id, text: alreadyIn ? "Ya está en la lista." : msg, ok: alreadyIn });
    } finally {
      setAddingId(null);
    }
  };

  const query = contentSearch.query;
  const results = contentSearch.suggestions;
  const searching = contentSearch.loading;

  return (
    <section
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "hsl(270 40% 97%)", border: "1.5px solid hsl(270 30% 88%)" }}
    >
      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "hsl(258 24% 22%)" }}>
        <Plus size={15} style={{ color: "hsl(268 84% 62%)" }} />
        Añadir contenido
      </h3>

      {!externalType ? (
        <p className="text-xs" style={{ color: "hsl(258 16% 55%)" }}>
          Esta lista no tiene un tipo de contenido compatible para buscar fuera.
        </p>
      ) : (
        <SearchBox
          value={query}
          onValueChange={contentSearch.setQuery}
          placeholder={`Buscar ${tipoContenidos ? TIPO_LABEL[tipoContenidos] ?? tipoContenidos : "contenidos"}…`}
          loading={searching}
          error={contentSearch.error}
          inputClassName="w-full rounded-xl border-[1.5px] border-[hsl(270_30%_85%)] bg-white py-2.5 pl-9 pr-3 text-sm text-[hsl(258_24%_16%)] outline-none"
          iconClassName="text-[hsl(258_16%_60%)]"
          panelClassName="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border-[1.5px] border-[hsl(270_30%_88%)] bg-white shadow-[0_14px_38px_rgba(80,15,120,0.24)] lg:left-[calc(100%+0.75rem)] lg:right-auto lg:top-0 lg:mt-0 lg:w-80"
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-xs" style={{ color: "hsl(258 16% 55%)" }}>
              Sin resultados para "{query}"
            </p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto p-1">
              {results.map((item) => {
                const isProcessing = addingId === item.id;
                const itemMsg = message?.id === item.id ? message : null;
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl p-2"
                    style={{ background: "#fff", border: "1px solid hsl(270 30% 90%)" }}
                  >
                    <div
                      className="w-9 h-12 rounded-lg flex-shrink-0 overflow-hidden"
                      style={{ background: "hsl(270 40% 90%)" }}
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ fontSize: 18, color: "hsl(268 84% 70%)", fontWeight: 900 }}>
                          {item.title.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "hsl(258 24% 16%)" }}>
                        {item.title}
                      </p>
                      {itemMsg && (
                        <p className="text-[10px] mt-0.5 flex items-center gap-1"
                          style={{ color: itemMsg.ok ? "#16a34a" : "#dc2626" }}>
                          {itemMsg.ok && <Check size={9} />}
                          {itemMsg.text}
                        </p>
                      )}
                    </div>

                    <button
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleAdd(item)}
                      disabled={isProcessing}
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition"
                      style={{ background: "hsl(268 84% 62%)", color: "#fff", opacity: isProcessing ? 0.5 : 1 }}
                    >
                      <Plus size={10} />
                      {isProcessing ? "…" : "Añadir"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SearchBox>
      )}

      {message && !results.find((result) => result.id === message.id) && (
        <p className="text-xs font-medium flex items-center gap-1.5"
          style={{ color: message.ok ? "#16a34a" : "#dc2626" }}>
          {message.ok && <Check size={12} />}
          {message.text}
        </p>
      )}
    </section>
  );
}
