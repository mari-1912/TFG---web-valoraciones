import { useEffect, useState } from "react";

type UseProfileFollowArgs = {
  canEdit: boolean;
  isLoggedIn: boolean;
  currentUserId: number | null;
  profileUserId: number | null;
  onFollowersDelta?: (delta: number) => void;
};

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

export function useProfileFollow({
  canEdit,
  isLoggedIn,
  currentUserId,
  profileUserId,
  onFollowersDelta,
}: UseProfileFollowArgs) {
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);
  const [followMessage, setFollowMessage] = useState<string | null>(null);

  useEffect(() => {
    setFollowMessage(null);
    if (canEdit || currentUserId == null || profileUserId == null) {
      setIsFollowingProfile(false);
      return;
    }
    const key = `mock-following:${currentUserId}`;
    const followedIds = readFollowedIds(key);
    setIsFollowingProfile(followedIds.includes(profileUserId));
  }, [canEdit, currentUserId, profileUserId]);

  const handleToggleFollow = () => {
    if (canEdit || profileUserId == null || currentUserId == null || !isLoggedIn) {
      setFollowMessage("Inicia sesión para seguir usuarios.");
      return;
    }

    const storageKey = `mock-following:${currentUserId}`;
    const followedIds = readFollowedIds(storageKey);
    const alreadyFollowing = followedIds.includes(profileUserId);
    const nextFollowedIds = alreadyFollowing
      ? followedIds.filter((value) => value !== profileUserId)
      : [...followedIds, profileUserId];

    localStorage.setItem(storageKey, JSON.stringify(nextFollowedIds));
    setIsFollowingProfile(!alreadyFollowing);
    onFollowersDelta?.(alreadyFollowing ? -1 : 1);
    setFollowMessage(
      alreadyFollowing
        ? "Has dejado de seguir a este usuario."
        : "Ahora sigues a este usuario."
    );
  };

  return {
    isFollowingProfile,
    followMessage,
    handleToggleFollow,
  };
}
