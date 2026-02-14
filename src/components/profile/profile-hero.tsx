import type { ChangeEvent, RefObject } from "react";
import {
  MessageSquareText,
  ShieldCheck,
  Star,
  StarHalf,
  UserCircle,
} from "lucide-react";

export type QuickStat = {
  label: string;
  value: number;
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
  avatarInputRef,
  coverInputRef,
  onAvatarChange,
  onCoverChange,
}: ProfileHeroProps) {
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
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onAvatarClick}
              className={`flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 transition ${
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
                <UserCircle className="h-10 w-10 text-violet-200" />
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

            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-violet-200">
                Perfil
              </p>
              <h1 className="mt-1 text-3xl font-semibold">{displayName}</h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-violet-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                {displayRole}
              </div>

              <div className="mt-3 max-w-md">
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

              <div className="mt-3 grid max-w-md grid-cols-3 gap-3 text-xs text-white/70">
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <Star className="h-4 w-4 text-violet-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {ratingsCount}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest">
                      Valoraciones
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <StarHalf className="h-4 w-4 text-violet-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {averageRating.toFixed(1)}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest">
                      Media
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <MessageSquareText className="h-4 w-4 text-violet-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {reviewsCount}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest">
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
            <button
              type="button"
              onClick={onToggleEdit}
              disabled={!canEdit}
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditing ? "Cerrar edición" : "Editar"}
            </button>
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

        {saveError && (
          <p className="mt-3 text-xs text-rose-200">{saveError}</p>
        )}

        {coverError && (
          <p className="mt-4 text-xs text-rose-200 md:text-right">
            {coverError}
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/30 px-4 py-5 text-center"
            >
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-white/70">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
