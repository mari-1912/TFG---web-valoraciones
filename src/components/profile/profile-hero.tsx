import type { ChangeEvent, RefObject } from "react";
import {
  Loader2,
  MessageSquareText,
  Pencil,
  ShieldCheck,
  Star,
  StarHalf,
  UserCircle,
  UserCheck2,
  UserPlus,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type QuickStat = {
  id: "following" | "followers" | "comments";
  label: string;
  value: number;
};

type SocialConnectionsStatId = "following" | "followers";

export type SocialConnectionUser = {
  userId: number;
  username: string;
  tipo?: string;
  reputacion?: number;
  avatarPath?: string | null;
  avatarUrl?: string | null;
};

export type SocialConnectionsPanel = {
  users: SocialConnectionUser[];
  total: number;
  loaded: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
};

export type SocialConnectionsDropdown = {
  active: SocialConnectionsStatId | null;
  followers: SocialConnectionsPanel;
  following: SocialConnectionsPanel;
  onOpenChange: (target: SocialConnectionsStatId, open: boolean) => void;
  onLoadMore: (target: SocialConnectionsStatId) => void;
  onRetry: (target: SocialConnectionsStatId) => void;
};

export type CommentPreviewItem = {
  id: string;
  title: string;
  detail?: string;
  date: string;
};

export type CommentsPreviewDropdown = {
  open: boolean;
  total: number;
  items: CommentPreviewItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenChange: (open: boolean) => void;
};

type ProfileHeroProps = {
  coverImage: string | null;
  profileImage: string | null;
  displayName: string;
  displayRole: string;
  bio: string;
  canEdit: boolean;
  isEditing: boolean;
  ratingsCount: number;
  averageRating: number;
  reviewsCount: number;
  quickStats: QuickStat[];
  avatarError?: string | null;
  saveError?: string | null;
  coverError?: string | null;
  avatarUploading: boolean;
  coverUploading: boolean;
  onAvatarClick: () => void;
  onCoverClick: () => void;
  onRemoveAvatar: () => void;
  onRemoveCover: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onBioChange: (value: string) => void;
  showFollowAction?: boolean;
  isFollowing?: boolean;
  followDisabled?: boolean;
  onToggleFollow?: () => void;
  followMessage?: string | null;
  socialConnections?: SocialConnectionsDropdown;
  commentsPreview?: CommentsPreviewDropdown;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  coverInputRef: RefObject<HTMLInputElement | null>;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCoverChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function ProfileHero({
  coverImage,
  profileImage,
  displayName,
  displayRole,
  bio,
  canEdit,
  isEditing,
  ratingsCount,
  averageRating,
  reviewsCount,
  quickStats,
  avatarError,
  saveError,
  coverError,
  avatarUploading,
  coverUploading,
  onAvatarClick,
  onCoverClick,
  onRemoveAvatar,
  onRemoveCover,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onBioChange,
  showFollowAction = false,
  isFollowing = false,
  followDisabled = false,
  onToggleFollow,
  followMessage,
  socialConnections,
  commentsPreview,
  avatarInputRef,
  coverInputRef,
  onAvatarChange,
  onCoverChange,
}: ProfileHeroProps) {
  const baseQuickStatClassName =
  "flex min-w-0 flex-col items-center justify-center rounded-2xl border border-violet-200/80 bg-white/85 px-3 py-2 text-center text-violet-700 shadow-[0_10px_30px_rgba(124,58,237,0.14)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white";  const dropdownPanelClassName =
    "w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-violet-200/80 bg-[#f7f3ff] p-0 text-gray-900 shadow-[0_18px_40px_rgba(124,58,237,0.22)] backdrop-blur";
  const dropdownHeaderClassName =
    "border-b border-violet-200/70 bg-gradient-to-r from-violet-100 via-fuchsia-50 to-indigo-100 px-4 py-3";
  const dropdownInlineButtonClassName =
    "rounded-full border border-violet-300 bg-white/90 px-3 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-50";

  const renderConnectionsDropdown = (
    target: SocialConnectionsStatId,
    stat: QuickStat
  ) => {
    if (!socialConnections) return null;
    const panel =
      target === "following"
        ? socialConnections.following
        : socialConnections.followers;
    const label = target === "following" ? "Seguidos" : "Seguidores";

    return (
      <DropdownMenu
        key={stat.label}
        open={socialConnections.active === target}
        onOpenChange={(open) => socialConnections.onOpenChange(target, open)}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`${baseQuickStatClassName} cursor-pointer transition hover:border-violet-200/70 hover:bg-black/40`}
            aria-label={`Mostrar ${label.toLowerCase()} de ${displayName}`}
          >
          <p className="text-xl font-bold leading-none text-violet-700 sm:text-2xl">
  {stat.value}
</p>

<p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-violet-800 sm:text-xs sm:tracking-widest">
  {stat.label}
</p>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          sideOffset={8}
          className={dropdownPanelClassName}
        >
          <div className={dropdownHeaderClassName}>
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-xs text-gray-500">
              {panel.total} {panel.total === 1 ? "usuario" : "usuarios"}
            </p>
          </div>

          {panel.loading && !panel.loaded ? (
            <div className="mx-3 my-3 flex items-center gap-2 rounded-xl border border-violet-100 bg-white/90 px-4 py-4 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              Cargando usuarios...
            </div>
          ) : panel.error ? (
            <div className="mx-3 my-3 space-y-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
              <p className="text-sm text-rose-600">{panel.error}</p>
              <button
                type="button"
                onClick={() => socialConnections.onRetry(target)}
                className={dropdownInlineButtonClassName}
              >
                Reintentar
              </button>
            </div>
          ) : panel.users.length === 0 ? (
            <p className="mx-3 my-3 rounded-xl border border-violet-100 bg-white/90 px-4 py-4 text-sm text-gray-600">
              No hay usuarios para mostrar.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto px-2 py-2">
              {panel.users.map((user) => {
                const avatar = user.avatarUrl ?? user.avatarPath ?? null;
                const username = user.username?.trim() || `user-${user.userId}`;
                return (
                  <Link
                    key={`${target}-${user.userId}`}
                    to={`/perfil?userId=${user.userId}`}
                    className="mb-1 flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition hover:border-violet-200 hover:bg-white/90"
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={username}
                        className="h-9 w-9 rounded-full border border-violet-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 bg-violet-100 text-xs font-semibold uppercase text-violet-700">
                        {username.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        @{username}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {[user.tipo, Number.isFinite(user.reputacion) ? `${user.reputacion} rep` : null]
                          .filter(Boolean)
                          .join(" • ") || "Usuario"}
                      </p>
                    </div>
                  </Link>
                );
              })}
              {panel.hasMore ? (
                <div className="border-t border-violet-200/70 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => socialConnections.onLoadMore(target)}
                    disabled={panel.loadingMore}
                    className="w-full rounded-full border border-violet-300 bg-white/90 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {panel.loadingMore ? "Cargando..." : "Cargar más"}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderCommentsDropdown = (stat: QuickStat) => {
    if (!commentsPreview) return null;
    const displayInitial = (displayName.trim().slice(0, 1) || "U").toUpperCase();

    return (
      <DropdownMenu
        key={stat.label}
        open={commentsPreview.open}
        onOpenChange={commentsPreview.onOpenChange}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`${baseQuickStatClassName} cursor-pointer transition hover:border-violet-200/70 hover:bg-black/40`}
            aria-label={`Mostrar comentarios de ${displayName}`}
          >
            <p className="text-xl font-semibold leading-none sm:text-xl">{stat.value}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-violet-800 sm:text-xs sm:tracking-widest">
              {stat.label}
            </p>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          sideOffset={8}
          className={dropdownPanelClassName}
        >
          <div className={dropdownHeaderClassName}>
            <p className="text-sm font-semibold text-gray-900">Comentarios</p>
            <p className="text-xs text-gray-500">
              {commentsPreview.total}{" "}
              {commentsPreview.total === 1 ? "comentario" : "comentarios"}
            </p>
          </div>

          {commentsPreview.loading && !commentsPreview.items.length ? (
            <div className="mx-3 my-3 flex items-center gap-2 rounded-xl border border-violet-100 bg-white/90 px-4 py-4 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              Cargando comentarios...
            </div>
          ) : commentsPreview.error ? (
            <div className="mx-3 my-3 space-y-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
              <p className="text-sm text-rose-600">{commentsPreview.error}</p>
              {commentsPreview.onRetry ? (
                <button
                  type="button"
                  onClick={commentsPreview.onRetry}
                  className={dropdownInlineButtonClassName}
                >
                  Reintentar
                </button>
              ) : null}
            </div>
          ) : !commentsPreview.items.length ? (
            <p className="mx-3 my-3 rounded-xl border border-violet-100 bg-white/90 px-4 py-4 text-sm text-gray-600">
              Aún no hay comentarios para mostrar.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto p-3">
              {commentsPreview.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-violet-200/80 bg-white/95 p-3 shadow-[0_10px_22px_rgba(124,58,237,0.14)]"
                >
                  <div className="flex items-center gap-2">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={displayName}
                        className="h-9 w-9 rounded-full border border-violet-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 bg-violet-100 text-xs font-semibold text-violet-700">
                        {displayInitial}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                  </div>

                  <p className="mt-2 text-xs font-medium text-gray-700">{item.title}</p>
                  {item.detail ? (
                    <div className="mt-2 rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2 text-sm text-gray-700">
                      {item.detail}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <section className="relative overflow-hidden text-white [background-image:var(--gradient-primary)]">
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(135deg,#3f2ed8,#5b21ff,#7c3aed)] sm:h-48 md:h-56" />
      {coverImage && (
        <div
          className="absolute inset-x-0 top-0 h-40 bg-cover bg-center sm:h-48 md:h-56"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      )}
      <div className="absolute inset-x-0 top-0 h-40 bg-black/45 sm:h-48 md:h-56" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(900px_420px_at_15%_0%,rgba(124,58,237,0.35),transparent_70%),radial-gradient(900px_420px_at_85%_0%,rgba(236,72,153,0.22),transparent_70%)] sm:h-48 md:h-56" />
      <div className="absolute inset-x-0 top-0 h-40 opacity-30 [background-image:linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_45%,transparent_60%)] sm:h-48 md:h-56" />
      <div className="absolute inset-x-0 bottom-0 top-40 bg-black/35 sm:top-48 md:top-56" />

      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-24 sm:pt-28 md:pt-32">
        {canEdit && !isEditing ? (
          <div className="group absolute right-4 top-4 z-10">
            <button
              type="button"
              onClick={onStartEdit}
              disabled={!canEdit}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Editar perfil"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <span className="pointer-events-none absolute -bottom-9 right-0 rounded-md border border-white/15 bg-black/80 px-2 py-1 text-xs font-medium text-white opacity-0 translate-y-1 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
              Editar perfil
            </span>
          </div>
        ) : null}
        {canEdit && isEditing ? (
          <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition hover:bg-white hover:text-indigo-700"
                    aria-label="Opciones de banner"
                    title="Opciones de banner"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-white/20 bg-[#161a27] text-white"
                >
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      onCoverClick();
                    }}
                    className="text-white focus:bg-white/15 focus:text-white"
                  >
                    Editar banner
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!coverImage || coverUploading}
                    onSelect={(event) => {
                      event.preventDefault();
                      onRemoveCover();
                    }}
                    className="text-white focus:bg-white/15 focus:text-white"
                  >
                    {coverUploading ? "Procesando..." : "Eliminar banner"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition hover:bg-white hover:text-rose-600"
                aria-label="Cerrar edición sin guardar"
                title="Cerrar edición sin guardar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={onSaveEdit}
              className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-indigo-700"
            >
              Guardar cambios
            </button>
          </div>
        ) : null}

        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
          className="hidden"
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={onCoverChange}
          className="hidden"
        />

        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
              <div className="relative mt-4 shrink-0 sm:mt-6 md:mt-10">
                <button
                  type="button"
                  className="flex h-24 w-24 cursor-default items-center justify-center overflow-hidden rounded-full border-4 border-violet-100 bg-white/10 transition sm:h-28 sm:w-28"
                  aria-label="Cambiar foto de perfil"
                  title="Perfil"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-10 w-10 text-violet-200 sm:h-12 sm:w-12" />
                  )}
                </button>
                {canEdit && isEditing ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="absolute bottom-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-black/75 text-white shadow-[0_6px_14px_rgba(0,0,0,0.35)] transition hover:bg-white hover:text-indigo-700 sm:h-8 sm:w-8"
                        aria-label="Opciones de foto de perfil"
                        title="Opciones de foto"
                      >
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-white/20 bg-[#161a27] text-white"
                    >
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          onAvatarClick();
                        }}
                        className="text-white focus:bg-white/15 focus:text-white"
                      >
                        Editar foto
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!profileImage || avatarUploading}
                        onSelect={(event) => {
                          event.preventDefault();
                          onRemoveAvatar();
                        }}
                        className="text-white focus:bg-white/15 focus:text-white"
                      >
                        {avatarUploading ? "Procesando..." : "Eliminar foto"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>

              <div className="mt-5 min-w-0 flex-1 sm:mt-8 md:mt-10">
                <div className="flex min-w-0 items-center gap-2 sm:flex-wrap">
                  <h1
                    className="min-w-0 text-2xl font-semibold leading-tight sm:text-4xl"
                    title={displayName}
                  >
                    {displayName}
                  </h1>
                  <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-violet-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {displayRole}
                  </div>
                </div>

                <div className="mt-5 flex items-start justify-between gap-3">
  
  {/* STATS */}
  <div
    className={`grid w-full max-w-[260px] grid-cols-2 gap-1.5`}
  >
    {quickStats.map((stat) => {
      const fallbackCard = (
        <div key={stat.label} className={baseQuickStatClassName}>
          <p className="text-sm font-semibold leading-none text-violet-800">
            {stat.value}
          </p>
          <p className="mt-0.5 text-[8px] uppercase tracking-[0.1em] text-violet-900">
            {stat.label}
          </p>
        </div>
      );

      if (stat.id === "followers") {
        return renderConnectionsDropdown("followers", stat) ?? fallbackCard;
      }

      if (stat.id === "following") {
        return renderConnectionsDropdown("following", stat) ?? fallbackCard;
      }

      if (stat.id === "comments") {
        return renderCommentsDropdown(stat) ?? fallbackCard;
      }

      return (
        fallbackCard
      );
    })}
  </div>

  {/* BOTONES EN COLUMNA */}
  {!canEdit && showFollowAction ? (
    <div className="flex flex-col gap-1.5">
      
      {/* Siguiendo */}
      {isFollowing ? (
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-400/20 px-3 py-1 text-[11px] font-semibold text-emerald-100"
        >
          <UserCheck2 className="h-3 w-3" />
          Siguiendo
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggleFollow}
          disabled={followDisabled}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-violet-400 px-3 py-1 text-[11px] font-semibold text-white hover:bg-violet-600"
        >
          <UserPlus className="h-3 w-3" />
          Seguir
        </button>
      )}

      {/* Dejar de seguir */}
      <button
        type="button"
        onClick={onToggleFollow}
        disabled={followDisabled || !isFollowing}
        className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white hover:text-indigo-700 disabled:opacity-50"
      >
        Dejar de seguir
      </button>

    </div>
  ) : null}

</div>
              </div>
            </div>

            <div className="mt-3 grid w-full grid-cols-3 gap-2 text-[11px] text-white/70 sm:mt-8 md:mt-6 md:w-[340px] sm:text-xs">
            <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-violet bg-white/80 px-2 py-2 text-center backdrop-blur-sm">
            <Star className="h-4 w-4 text-violet-800" />
            <p className="text-base font-semibold leading-none text-violet-800 sm:text-sm">
                  {ratingsCount}
                </p>
                <p className="text-[9px] uppercase text-violet-900 tracking-[0.12em] leading-tight sm:text-[10px] sm:tracking-widest">
                  Valoraciones
                </p>
              </div>
              <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-violet bg-white/80 px-2 py-2 text-center backdrop-blur-sm">
                <StarHalf className="h-4 w-4 text-violet-800" />
                <p className="text-base font-semibold leading-none text-violet-800 sm:text-sm">
                  {averageRating.toFixed(1)}
                </p>
                <p className="text-[9px] uppercase text-violet-900 tracking-[0.12em] leading-tight sm:text-[10px] sm:tracking-widest">
                  Media
                </p>
              </div>
              <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-violet bg-white/80 px-2 py-2 text-center backdrop-blur-sm">
                <MessageSquareText className="h-4 w-4 text-violet-800" />
                <p className="text-base font-semibold leading-none text-violet-800 sm:text-sm">
                  {reviewsCount}
                </p>
                <p className="text-[9px] uppercase text-violet-900 tracking-[0.12em] leading-tight sm:text-[10px] sm:tracking-widest">
                  COMENTARIOS
                </p>
              </div>
            </div>
          </div>

          <div className="-mt-3 rounded-xl border border-violet/35 bg-white/80 px-3 py-2 backdrop-blur-sm">
            {canEdit && isEditing ? (
              <textarea
                value={bio}
                onChange={(event) =>
                  onBioChange(event.target.value.slice(0, 140))
                }
                rows={2}
                placeholder="Añade una breve descripción..."
                className="w-full resize-none rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-violet-800 placeholder-violet-800 outline-none focus:border-white/60"
              />
            ) : (
              <p className="text-sm leading-snug text-violet-800 ">
                {bio || "Añade una breve descripción sobre ti."}
              </p>
            )}
            {canEdit && isEditing && (
              <p className="mt-1 text-[11px] text-violet-800">
                {bio.length}/140 caracteres
              </p>
            )}
          </div>

          {avatarError && (
            <p className="text-xs text-rose-200">{avatarError}</p>
          )}
          {!canEdit && followMessage ? (
            <p className="text-xs text-violet-100">{followMessage}</p>
          ) : null}
          {saveError && (
            <p className="text-xs text-rose-200">{saveError}</p>
          )}
          {coverError && (
            <p className="text-xs text-rose-200 md:text-right">
              {coverError}
            </p>
          )}

        </div>
      </div>
    </section>
  );
}
