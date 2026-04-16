import { useEffect, useState } from "react";
import { followUser, unfollowUser } from "@/services/profile-service";

type UseProfileFollowArgs = {
  canEdit: boolean;
  isLoggedIn: boolean;
  currentUserId: number | null;
  profileUserId: number | null;
  initialIsFollowing?: boolean | null;
  onFollowersDelta?: (delta: number) => void;
};

function buildFollowStorageKey(currentUserId: number) {
  return `followed-users:${currentUserId}`;
}

function buildLegacyFollowStorageKey(currentUserId: number) {
  return `mock-following:${currentUserId}`;
}

function readFollowedIds(storageKey: string) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      : [];
  } catch {
    return [] as number[];
  }
}

function writeFollowedIds(storageKey: string, ids: number[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    // Ignoramos errores de almacenamiento local para no bloquear la UI.
  }
}

function readMergedFollowedIds(currentUserId: number) {
  const nextKey = buildFollowStorageKey(currentUserId);
  const legacyKey = buildLegacyFollowStorageKey(currentUserId);
  const nextIds = readFollowedIds(nextKey);
  const legacyIds = readFollowedIds(legacyKey);
  return Array.from(new Set([...nextIds, ...legacyIds]));
}

function persistFollowedIds(currentUserId: number, ids: number[]) {
  const uniqueIds = Array.from(new Set(ids));
  writeFollowedIds(buildFollowStorageKey(currentUserId), uniqueIds);
}

export function useProfileFollow({
  canEdit,
  isLoggedIn,
  currentUserId,
  profileUserId,
  initialIsFollowing,
  onFollowersDelta,
}: UseProfileFollowArgs) {
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);
  const [followMessage, setFollowMessage] = useState<string | null>(null);
  const [followUpdating, setFollowUpdating] = useState(false);

  useEffect(() => {
    setFollowMessage(null);
    setFollowUpdating(false);

    if (canEdit || profileUserId == null || !isLoggedIn || currentUserId == null) {
      setIsFollowingProfile(false);
      return;
    }

    const cachedFollowedIds = readMergedFollowedIds(currentUserId);

    if (initialIsFollowing != null) {
      if (initialIsFollowing) {
        if (!cachedFollowedIds.includes(profileUserId)) {
          persistFollowedIds(currentUserId, [...cachedFollowedIds, profileUserId]);
        }
      } else if (cachedFollowedIds.includes(profileUserId)) {
        persistFollowedIds(
          currentUserId,
          cachedFollowedIds.filter((id) => id !== profileUserId)
        );
      }
      setIsFollowingProfile(initialIsFollowing);
      return;
    }

    setIsFollowingProfile(cachedFollowedIds.includes(profileUserId));
  }, [canEdit, isLoggedIn, currentUserId, profileUserId, initialIsFollowing]);

  const handleToggleFollow = async () => {
    if (followUpdating) return;

    if (canEdit || profileUserId == null || currentUserId == null || !isLoggedIn) {
      setFollowMessage("Inicia sesión para seguir usuarios.");
      return;
    }

    setFollowUpdating(true);
    setFollowMessage(null);

    try {
      const cachedFollowedIds = readMergedFollowedIds(currentUserId);

      if (isFollowingProfile) {
        const result = await unfollowUser(profileUserId);
        if (!result.success) {
          throw new Error(
            result.message ?? "No se pudo dejar de seguir al usuario."
          );
        }
        setIsFollowingProfile(false);
        persistFollowedIds(
          currentUserId,
          cachedFollowedIds.filter((id) => id !== profileUserId)
        );
        onFollowersDelta?.(-1);
        setFollowMessage("Has dejado de seguir a este usuario.");
      } else {
        const result = await followUser(profileUserId);
        if (!result.success) {
          throw new Error(result.message ?? "No se pudo seguir al usuario.");
        }
        setIsFollowingProfile(true);
        if (!cachedFollowedIds.includes(profileUserId)) {
          persistFollowedIds(currentUserId, [...cachedFollowedIds, profileUserId]);
        }
        onFollowersDelta?.(1);
        setFollowMessage("Ahora sigues a este usuario.");
      }
    } catch (error) {
      setFollowMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el seguimiento."
      );
    } finally {
      setFollowUpdating(false);
    }
  };

  return {
    isFollowingProfile,
    followUpdating,
    followMessage,
    handleToggleFollow,
  };
}
