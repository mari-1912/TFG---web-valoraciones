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

  const normalizeText = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const isAlreadyFollowingError = (message?: string) => {
    const text = normalizeText(message ?? "");
    if (!text) return false;
    return (
      text.includes("ya sigues") ||
      text.includes("ya sigue") ||
      text.includes("already follow")
    );
  };

  const isAlreadyUnfollowedError = (message?: string) => {
    const text = normalizeText(message ?? "");
    if (!text) return false;
    return (
      text.includes("no sigues") ||
      text.includes("not following") ||
      text.includes("ya no sigues")
    );
  };

  useEffect(() => {
    setFollowMessage(null);
    setFollowUpdating(false);

    if (canEdit || profileUserId == null || !isLoggedIn || currentUserId == null) {
      setIsFollowingProfile(false);
      return;
    }

    if (initialIsFollowing != null) {
      setIsFollowingProfile(initialIsFollowing);
      return;
    }

    setIsFollowingProfile(false);
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
      if (isFollowingProfile) {
        const result = await unfollowUser(profileUserId);
        if (!result.success) {
          if (isAlreadyUnfollowedError(result.message)) {
            setIsFollowingProfile(false);
            setFollowMessage("No sigues a este usuario.");
            return;
          }
          throw new Error(
            result.message ?? "No se pudo dejar de seguir al usuario."
          );
        }
        setIsFollowingProfile(false);
        onFollowersDelta?.(-1);
        setFollowMessage("Has dejado de seguir a este usuario.");
      } else {
        const result = await followUser(profileUserId);
        if (!result.success) {
          if (isAlreadyFollowingError(result.message)) {
            setIsFollowingProfile(true);
            setFollowMessage("Ya sigues a este usuario.");
            return;
          }
          throw new Error(result.message ?? "No se pudo seguir al usuario.");
        }
        setIsFollowingProfile(true);
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
