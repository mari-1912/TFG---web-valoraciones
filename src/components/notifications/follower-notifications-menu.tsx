import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveAssetUrl } from "@/services/apiCommunity";
import {
  fetchUserFollowersPage,
  type UserConnection,
} from "@/services/profile-service";

type FollowerNotification = {
  id: string;
  userId: number;
  username: string;
  avatarUrl: string | null;
  detectedAt: string;
  read: boolean;
};

type FollowerNotificationsMenuProps = {
  userId: number | null;
};

const FOLLOWER_SNAPSHOT_PREFIX = "opinify:follower-snapshot:";
const FOLLOWER_NOTIFICATIONS_PREFIX = "opinify:follower-notifications:";
const FOLLOWER_POLL_MS = 60_000;

function readStoredFollowerIds(userId: number) {
  try {
    const raw = localStorage.getItem(`${FOLLOWER_SNAPSHOT_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed)
      ? parsed.map(Number).filter((id) => Number.isFinite(id) && id > 0)
      : null;
  } catch {
    return null;
  }
}

function writeStoredFollowerIds(userId: number, followerIds: number[]) {
  localStorage.setItem(
    `${FOLLOWER_SNAPSHOT_PREFIX}${userId}`,
    JSON.stringify([...new Set(followerIds)])
  );
}

function readStoredFollowerNotifications(userId: number): FollowerNotification[] {
  try {
    const raw = localStorage.getItem(`${FOLLOWER_NOTIFICATIONS_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FollowerNotification =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        Number.isFinite(Number(item.userId)) &&
        typeof item.username === "string" &&
        typeof item.detectedAt === "string" &&
        typeof item.read === "boolean"
    );
  } catch {
    return [];
  }
}

function writeStoredFollowerNotifications(
  userId: number,
  notifications: FollowerNotification[]
) {
  localStorage.setItem(
    `${FOLLOWER_NOTIFICATIONS_PREFIX}${userId}`,
    JSON.stringify(notifications.slice(0, 20))
  );
}

function formatNotificationDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "hace poco";
  const diffMs = Date.now() - parsed;
  if (diffMs < 60 * 1000) return "ahora";
  if (diffMs < 60 * 60 * 1000) return "hace unos minutos";
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 7) return `hace ${diffDays} dias`;
  return new Date(parsed).toLocaleDateString("es-ES");
}

async function fetchAllFollowers(userId: number, signal?: AbortSignal) {
  const usersById = new Map<number, UserConnection>();
  let page = 1;
  let pages = 1;
  let guard = 0;

  while (page <= pages && guard < 20) {
    const result = await fetchUserFollowersPage(userId, {
      page,
      pageSize: 100,
      signal,
    });
    for (const user of result.users) {
      usersById.set(user.userId, user);
    }
    pages = Number.isFinite(result.pages) && result.pages > 0 ? result.pages : 1;
    page += 1;
    guard += 1;
  }

  return [...usersById.values()];
}

function createFollowerNotification(user: UserConnection): FollowerNotification {
  return {
    id: `${user.userId}-${Date.now()}`,
    userId: user.userId,
    username: user.username || "Usuario",
    avatarUrl: resolveAssetUrl(user.avatarUrl ?? user.avatarPath ?? null) ?? null,
    detectedAt: new Date().toISOString(),
    read: false,
  };
}

export function FollowerNotificationsMenu({
  userId,
}: FollowerNotificationsMenuProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<FollowerNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId == null) {
      setNotifications([]);
      return;
    }

    setNotifications(readStoredFollowerNotifications(userId));
    const controller = new AbortController();

    const refreshFollowerNotifications = async () => {
      try {
        setLoading(true);
        const followers = await fetchAllFollowers(userId, controller.signal);
        if (controller.signal.aborted) return;

        const latestIds = followers.map((user) => user.userId);
        const previousIds = readStoredFollowerIds(userId);
        if (previousIds == null) {
          writeStoredFollowerIds(userId, latestIds);
          return;
        }

        const previousSet = new Set(previousIds);
        const newFollowers = followers.filter(
          (user) => !previousSet.has(user.userId)
        );

        if (newFollowers.length > 0) {
          const storedNotifications = readStoredFollowerNotifications(userId);
          const nextNotifications = [
            ...newFollowers.map(createFollowerNotification),
            ...storedNotifications,
          ];
          writeStoredFollowerNotifications(userId, nextNotifications);
          setNotifications(nextNotifications.slice(0, 20));
        }

        writeStoredFollowerIds(userId, latestIds);
      } catch (err) {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.error("No se pudieron actualizar las notificaciones:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void refreshFollowerNotifications();
    const intervalId = window.setInterval(
      refreshFollowerNotifications,
      FOLLOWER_POLL_MS
    );
    const handleFocus = () => void refreshFollowerNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId]);

  const unreadCount = notifications.filter((notification) => !notification.read)
    .length;

  const persistNotifications = (nextNotifications: FollowerNotification[]) => {
    if (userId == null) return;
    setNotifications(nextNotifications);
    writeStoredFollowerNotifications(userId, nextNotifications);
  };

  const markAllRead = () => {
    persistNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  const markOneRead = (notificationId: string) => {
    persistNotifications(
      notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-10 sm:w-10"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-fuchsia-600">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white p-0 text-gray-900 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <span className="block text-sm font-semibold">Notificaciones</span>
            <span className="block text-xs text-gray-500">Seguidores nuevos</span>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-md px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
            >
              Marcar leidas
            </button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto py-1.5">
          {loading && notifications.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-500">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-500">
              No tienes notificaciones nuevas.
            </div>
          ) : (
            notifications.map((notification) => {
              const letter = notification.username.trim()[0]?.toUpperCase() ?? "U";
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    markOneRead(notification.id);
                    navigate(`/perfil?userId=${notification.userId}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                >
                  {notification.avatarUrl ? (
                    <img
                      src={notification.avatarUrl}
                      alt={notification.username}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700 ring-1 ring-gray-200">
                      {letter}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug text-gray-800">
                      <strong>{notification.username}</strong> te ha seguido.
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {formatNotificationDate(notification.detectedAt)}
                    </span>
                  </span>
                  {!notification.read ? (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
