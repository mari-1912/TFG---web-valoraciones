import { useEffect, useState } from "react";
import { fetchMyProfile } from "@/services/profile-service";

type UseDetailCurrentUserArgs = {
  isLoggedIn: boolean;
  refreshKey: string;
};

export function useDetailCurrentUser({
  isLoggedIn,
  refreshKey,
}: UseDetailCurrentUserArgs) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(
    null
  );
  const [currentUserRole, setCurrentUserRole] = useState<string>("base");

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      if (!isLoggedIn) {
        if (isMounted) {
          setCurrentUserId(null);
          setCurrentUserAvatarUrl(null);
          setCurrentUserRole("base");
        }
        return;
      }
      try {
        const data = await fetchMyProfile();
        if (!isMounted) return;
        const perfil = data?.perfil ?? {};
        const perfilRole = (perfil as { role?: unknown }).role;
        setCurrentUserId(Number(perfil.userId ?? 0) || null);
        setCurrentUserAvatarUrl(perfil.avatarUrl ?? null);
        const role = (perfil.tipo ?? perfilRole ?? "base").toString().toLowerCase();
        setCurrentUserRole(role);
      } catch {
        if (isMounted) {
          setCurrentUserId(null);
          setCurrentUserAvatarUrl(null);
          setCurrentUserRole("base");
        }
      }
    };

    void loadCurrentUser();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, refreshKey]);

  const currentUserIsAdmin = currentUserRole === "admin";

  return { currentUserId, currentUserAvatarUrl, currentUserRole, currentUserIsAdmin };
}
