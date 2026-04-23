import type { ChangeEvent, RefObject } from "react";
import {
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Star,
  StarHalf,
  UserCircle,
  UserCheck2,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type QuickStat = {
  id: "following" | "followers";
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
  onToggleEdit: () => void;
  onBioChange: (value: string) => void;
  showFollowAction?: boolean;
  isFollowing?: boolean;
  followDisabled?: boolean;
  onToggleFollow?: () => void;
  followMessage?: string | null;
  socialConnections?: SocialConnectionsDropdown;
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
  onToggleEdit,
  onBioChange,
  showFollowAction = false,
  isFollowing = false,
  followDisabled = false,
  onToggleFollow,
  followMessage,
  socialConnections,
  avatarInputRef,
  coverInputRef,
  onAvatarChange,
  onCoverChange,
}: ProfileHeroProps) {
  const baseQuickStatClassName =
    "flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/30 px-4 py-5 text-center";

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
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-white/70">
              {stat.label}
            </p>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          sideOffset={8}
          className="w-[min(92vw,22rem)] border-violet-200 bg-white p-0 text-gray-900 shadow-xl"
        >
          <div className="border-b border-violet-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-xs text-gray-500">
              {panel.total} {panel.total === 1 ? "usuario" : "usuarios"}
            </p>
          </div>

          {panel.loading && !panel.loaded ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              Cargando usuarios...
            </div>
          ) : panel.error ? (
            <div className="space-y-2 px-4 py-4">
              <p className="text-sm text-rose-600">{panel.error}</p>
              <button
                type="button"
                onClick={() => socialConnections.onRetry(target)}
                className="rounded-full border border-violet-300 px-3 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Reintentar
              </button>
            </div>
          ) : panel.users.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-600">
              No hay usuarios para mostrar.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {panel.users.map((user) => {
                const avatar = user.avatarUrl ?? user.avatarPath ?? null;
                const username = user.username?.trim() || `user-${user.userId}`;
                return (
                  <Link
                    key={`${target}-${user.userId}`}
                    to={`/perfil?userId=${user.userId}`}
                    className="flex items-center gap-3 px-4 py-2 transition hover:bg-violet-50"
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
                <div className="border-t border-violet-100 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => socialConnections.onLoadMore(target)}
                    disabled={panel.loadingMore}
                    className="w-full rounded-full border border-violet-300 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
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

  return (
    <section className="relative overflow-hidden bg-[#0f0b14] text-white">
      {coverImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_15%_0%,rgba(124,58,237,0.35),transparent_70%),radial-gradient(900px_520px_at_85%_0%,rgba(236,72,153,0.22),transparent_70%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_45%,transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onAvatarClick}
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 transition sm:h-20 sm:w-20 ${
                canEdit && isEditing
                  ? "cursor-pointer hover:bg-white/15"
                  : "cursor-default"
              }`}
              aria-label="Cambiar foto de perfil"
              title={canEdit && isEditing ? "Cambiar foto" : "Perfil"}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-8 w-8 text-violet-200 sm:h-10 sm:w-10" />
              )}
            </button>

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

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-violet-200 sm:text-sm sm:tracking-[0.28em]">
                Perfil
              </p>
              <h1 className="mt-1 break-words text-2xl font-semibold leading-tight sm:text-3xl">
                {displayName}
              </h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-violet-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                {displayRole}
              </div>

              <div className="mt-3 w-full max-w-md">
              {canEdit && isEditing ? (
                  <textarea
                    value={bio}
                    onChange={(event) =>
                      onBioChange(event.target.value.slice(0, 140))
                    }
                    rows={2}
                    placeholder="Añade una breve descripción..."
                    className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white placeholder-white/60 outline-none focus:border-white/60"
                  />
                ) : (
                  <p className="text-xs text-white/70">
                    {bio || "Añade una breve descripción sobre ti."}
                  </p>
                )}
                {canEdit && isEditing && (
                  <p className="mt-1 text-[11px] text-white/50">
                    {bio.length}/140 caracteres
                  </p>
                )}
              </div>

              <div className="mt-3 grid w-full max-w-md grid-cols-3 gap-2 text-[11px] text-white/70 sm:gap-3 sm:text-xs">
                <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center sm:flex-row sm:justify-start sm:gap-2 sm:px-3">
                  <Star className="hidden h-4 w-4 text-violet-200 sm:block" />
                  <div>
                    <p className="text-base font-semibold leading-none text-white sm:text-sm">
                      {ratingsCount}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.12em] leading-tight sm:text-[10px] sm:tracking-widest">
                      Valoraciones
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center sm:flex-row sm:justify-start sm:gap-2 sm:px-3">
                  <StarHalf className="hidden h-4 w-4 text-violet-200 sm:block" />
                  <div>
                    <p className="text-base font-semibold leading-none text-white sm:text-sm">
                      {averageRating.toFixed(1)}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.12em] leading-tight sm:text-[10px] sm:tracking-widest">
                      Media
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center sm:flex-row sm:justify-start sm:gap-2 sm:px-3">
                  <MessageSquareText className="hidden h-4 w-4 text-violet-200 sm:block" />
                  <div>
                    <p className="text-base font-semibold leading-none text-white sm:text-sm">
                      {reviewsCount}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.12em] leading-tight sm:text-[10px] sm:tracking-widest">
                      Reseñas
                    </p>
                  </div>
                </div>
              </div>

              {canEdit && isEditing && (
                <p className="mt-2 text-xs text-white/60">
                  Pulsa la foto para cambiarla
                </p>
              )}
              {avatarError && (
                <p className="mt-3 text-xs text-rose-200">{avatarError}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canEdit ? (
              <button
                type="button"
                onClick={onToggleEdit}
                disabled={!canEdit}
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEditing ? "Cerrar edición" : "Editar"}
              </button>
            ) : showFollowAction ? (
              <div className="flex flex-col items-stretch gap-2">
                {isFollowing ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-400/20 px-5 py-2 text-sm font-semibold text-emerald-100 opacity-90"
                  >
                    <UserCheck2 className="h-4 w-4" />
                    Siguiendo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onToggleFollow}
                    disabled={followDisabled}
                    className={[
                      "inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-indigo-700",
                      followDisabled
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer",
                    ].join(" ")}
                  >
                    <UserPlus className="h-4 w-4" />
                    +Seguir
                  </button>
                )}
                <button
                  type="button"
                  onClick={onToggleFollow}
                  disabled={followDisabled || !isFollowing}
                  className={[
                    "inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-indigo-700",
                    followDisabled || !isFollowing
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer",
                  ].join(" ")}
                >
                  Dejar de seguir
                </button>
              </div>
            ) : null}
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={onCoverClick}
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-indigo-700"
                >
                  Cambiar portada
                </button>
                <button
                  type="button"
                  onClick={onRemoveCover}
                  disabled={!coverImage || coverUploading}
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {coverUploading ? "Procesando..." : "Eliminar portada"}
                </button>
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  disabled={!profileImage || avatarUploading}
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {avatarUploading ? "Procesando..." : "Eliminar foto"}
                </button>
              </>
            )}
          </div>
        </div>

        {!canEdit && followMessage ? (
          <p className="mt-3 text-xs text-violet-100">{followMessage}</p>
        ) : null}

        {saveError && (
          <p className="mt-3 text-xs text-rose-200">{saveError}</p>
        )}

        {coverError && (
          <p className="mt-4 text-xs text-rose-200 md:text-right">
            {coverError}
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
          {quickStats.map((stat) => {
            if (stat.id === "followers") {
              return (
                renderConnectionsDropdown("followers", stat) ?? (
                  <div key={stat.label} className={baseQuickStatClassName}>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-white/70">
                      {stat.label}
                    </p>
                  </div>
                )
              );
            }

            if (stat.id === "following") {
              return (
                renderConnectionsDropdown("following", stat) ?? (
                  <div key={stat.label} className={baseQuickStatClassName}>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-white/70">
                      {stat.label}
                    </p>
                  </div>
                )
              );
            }

            return (
              <div key={stat.label} className={baseQuickStatClassName}>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/70">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
