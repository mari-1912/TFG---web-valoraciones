// src/services/auth-service.ts

export type AuthUser = {
  user_id: number;
  email?: string;
  role: string;
  username?: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? "https://tfg-web-valoraciones-back-i9b5.onrender.com";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const REMEMBER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CURRENT_USER_KEY = "currentUser";
const CURRENT_USER_ID_KEY = "currentUserId";
const SESSION_ISSUED_AT_KEY = "sessionIssuedAt";
const SESSION_EXPIRES_AT_KEY = "sessionExpiresAt";
export const AUTH_EXPIRED_EVENT = "opinify:auth-expired";
export const AUTH_CHANGED_EVENT = "opinify:auth-changed";
let authRedirectInProgress = false;

function resolveSessionTtl(remember: boolean) {
  return remember ? REMEMBER_TTL_MS : SESSION_TTL_MS;
}

function getRememberPreference() {
  return localStorage.getItem("rememberMe") === "true";
}

function emitAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function getSessionExpiry(): number | null {
  const raw = localStorage.getItem(SESSION_EXPIRES_AT_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isSessionValid(now = Date.now()): boolean {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) return false;
  const expiresAt = getSessionExpiry();
  if (!expiresAt) return false;
  return expiresAt > now;
}

export function ensureSessionValid(now = Date.now()): boolean {
  if (!isSessionValid(now)) {
    clearSession({ preserveRemember: true });
    return false;
  }
  return true;
}

function setSession(
  user: {
    user_id?: number;
    userId?: number;
    id?: number;
    username?: string;
    role?: string;
  },
  options: { remember?: boolean; expiresAt?: number } = {}
) {
  const remember = options.remember ?? getRememberPreference();
  const now = Date.now();
  const ttl = resolveSessionTtl(remember);
  const expiresAt =
    options.expiresAt && options.expiresAt > now ? options.expiresAt : now + ttl;

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userRole", (user.role ?? "base").toString().toLowerCase());
  localStorage.setItem(CURRENT_USER_KEY, user.username ?? "");
  const userId = Number(user.user_id ?? user.userId ?? user.id ?? 0);
  if (Number.isFinite(userId) && userId > 0) {
    localStorage.setItem(CURRENT_USER_ID_KEY, String(userId));
  } else {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  }
  localStorage.setItem(SESSION_ISSUED_AT_KEY, String(now));
  localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(expiresAt));
  localStorage.setItem("rememberMe", remember ? "true" : "false");
  emitAuthChanged();
}

function clearSession(options: { preserveRemember?: boolean } = {}) {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(CURRENT_USER_ID_KEY);
  localStorage.removeItem(SESSION_ISSUED_AT_KEY);
  localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
  if (!options.preserveRemember) {
    localStorage.removeItem("rememberMe");
  }
  emitAuthChanged();
}

function getCurrentPath() {
  if (typeof window === "undefined") return "/home";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function isAuthRoute(path: string) {
  return path.startsWith("/login") || path.startsWith("/registro");
}

export function handleUnauthorizedResponse(status: number, reason = "401") {
  if (status !== 401) return false;

  const hadLocalSession =
    typeof window !== "undefined" &&
    localStorage.getItem("isLoggedIn") === "true";

  clearSession({ preserveRemember: true });
  if (!hadLocalSession || typeof window === "undefined") return true;

  window.dispatchEvent(
    new CustomEvent(AUTH_EXPIRED_EVENT, {
      detail: { reason, at: new Date().toISOString() },
    })
  );

  const from = getCurrentPath();
  if (!isAuthRoute(from) && !authRedirectInProgress) {
    authRedirectInProgress = true;
    const target = `/login?from=${encodeURIComponent(
      from
    )}&reason=session-expired`;
    window.location.assign(target);
  }

  return true;
}

async function api(
  path: string,
  options: RequestInit = {},
  apiOptions: { handleUnauthorized?: boolean } = {}
) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    credentials: "include", // <-- CLAVE: enviar/recibir cookies HttpOnly
    ...options,
  });

  const shouldHandleUnauthorized =
    apiOptions.handleUnauthorized ?? !path.startsWith("/auth/");
  if (shouldHandleUnauthorized) {
    handleUnauthorizedResponse(res.status, path);
  }

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function parseAuthUser(data: unknown, fallbackUsername = ""): AuthUser | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const user =
    (root.user as Record<string, unknown> | undefined) ??
    (root.usuario as Record<string, unknown> | undefined) ??
    (root.perfil as Record<string, unknown> | undefined) ??
    root;

  const userId = Number(
    user.userId ?? user.user_id ?? user.id ?? user.usuarioId ?? user.usuario_id ?? 0
  );
  const username = String(
    user.username ?? user.nombreUsuario ?? user.nombre_usuario ?? fallbackUsername
  ).trim();
  const email = typeof user.email === "string" ? user.email : undefined;
  const role = String(user.tipo ?? user.role ?? user.rol ?? "base").toLowerCase();

  if ((!Number.isFinite(userId) || userId <= 0) && !username && !email) {
    return null;
  }

  return {
    user_id: Number.isFinite(userId) && userId > 0 ? userId : 0,
    email,
    role,
    username: username || email,
  };
}

/**
 * REGISTER real contra backend
 * POST /auth/register  body: { email, username, password }
 * -> backend setea cookie access_token y puede devolver { user, message }
 */
export async function registerUser(
  payload: {
    username: string;
    email: string;
    password: string;
  },
): Promise<{ success: boolean; message: string }> {

  // limpiar cualquier sesión previa
  clearSession({ preserveRemember: true });

  try {
    await api(
      "/auth/logout",
      { method: "POST" },
      { handleUnauthorized: false }
    );
  } catch {
    // si falla no pasa nada
  }

  const { res, data } = await api(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      handleUnauthorized: false,
    }
  );

  if (!res.ok) {
    return {
      success: false,
      message: data?.message ?? "Registro fallido.",
    };
  }
  clearSession({ preserveRemember: true });

  return {
    success: true,
    message:
      data?.message ??
      "Registro exitoso. Revisa tu email para verificar la cuenta.",
  };
}

/**
 * LOGIN real contra backend
 * POST /auth/login  body: { email, password } (email acepta username o email)
 * -> backend setea cookie access_token
 */
export async function loginUser(
  identifier: string,
  password: string,
  remember = false
): Promise<{ success: boolean; message: string }> {
  const normalized = identifier.trim();

  clearSession({ preserveRemember: true });
  try {
    await api(
      "/auth/logout",
      { method: "POST" },
      { handleUnauthorized: false }
    );
  } catch {
    // Si el logout previo falla por red/CORS, intentamos login igualmente.
  }

  const payload: Record<string, string> = {
    password,
    // Algunos backends usan un único campo para email/username.
    identifier: normalized,
    // Otros esperan "login" como campo unificado.
    login: normalized,
  };

  if (normalized.includes("@")) {
    payload.email = normalized;
  } else {
    payload.username = normalized;
  }

  const { res, data } = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }, {
    handleUnauthorized: false,
  });

  if (!res.ok) {
    return {
      success: false,
      message: data?.message ?? "Credenciales inválidas.",
    };
  }

  const me = await getMe({ suppressUnauthorizedRedirect: true });
  // const loginResponseUser = parseAuthUser(data, normalized);

  // // Cookie ya puesta: sincronizamos datos llamando a /auth/me
  // let me = await getMe({ suppressUnauthorizedRedirect: true });
  // if (
  //   loginResponseUser?.user_id &&
  //   me.success &&
  //   me.user?.user_id &&
  //   loginResponseUser.user_id !== me.user.user_id
  // ) {
  //   await new Promise((resolve) => setTimeout(resolve, 250));
  //   me = await getMe({ suppressUnauthorizedRedirect: true });
  // }

  // if (
  //   loginResponseUser?.user_id &&
  //   me.success &&
  //   me.user?.user_id &&
  //   loginResponseUser.user_id !== me.user.user_id
  // ) {
  //   clearSession({ preserveRemember: true });
  //   return {
  //     success: false,
  //     message:
  //       "No se pudo cambiar a este usuario porque el navegador mantiene otra sesión activa. Cierra sesión e inténtalo de nuevo.",
  //   };
  // }

  if (me.success && me.user) {
    setSession(
      {
        user_id: me.user.user_id,
        role: (me.user.role ?? "base").toLowerCase(),
        username: me.user.username ?? me.user.email ?? "",
      },
      { remember }
    );
  } else {
    const statusDetail = me.status ? ` (/usuarios/perfil: ${me.status})` : "";
    const verificationMessage =
      me.status === 401 || me.status === 403
        ? `Login aceptado, pero no se pudo confirmar la sesión${statusDetail}. Es probable que la cookie access_token no se esté guardando o enviando correctamente por CORS/SameSite/Secure.`
        : `Login aceptado, pero no se pudo verificar la sesión${statusDetail}.`;

    clearSession({ preserveRemember: true });
    return {
      success: false,
      message: me.message ? `${verificationMessage} ${me.message}` : verificationMessage,
    };
  }

  return { success: true, message: data?.message ?? "Login correcto." };
}

/**
 * Solicita el email de recuperación.
 * Backend pendiente:
 * POST /auth/forgot-password body: { email, redirectUrl }
 */
export async function requestPasswordReset(
  email: string,
  redirectUrl =
    typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined
): Promise<{ success: boolean; message: string }> {
  const { res, data } = await api("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, redirectUrl }),
  }, {
    handleUnauthorized: false,
  });

  if (!res.ok) {
    return {
      success: false,
      message:
        data?.message ??
        "No se pudo enviar el enlace de recuperación. Inténtalo de nuevo.",
    };
  }

  return {
    success: true,
    message:
      data?.message ??
      "Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña.",
  };
}

/**
 * Restablece la contraseña usando el token recibido por email.
 * Backend pendiente:
 * POST /auth/reset-password body: { token, password }
 */
export async function resetPassword(
  token: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  const { res, data } = await api("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  }, {
    handleUnauthorized: false,
  });

  if (!res.ok) {
    return {
      success: false,
      message:
        data?.message ??
        "El enlace no es válido o ha caducado. Solicita uno nuevo.",
    };
  }

  return {
    success: true,
    message: data?.message ?? "Contraseña actualizada correctamente.",
  };
}

/**
 * Verifica el email usando el token recibido por correo.
 * GET /auth/verify-email?token=...
 */
export async function verifyEmail(
  token: string
): Promise<{ success: boolean; message: string }> {
  const { res, data } = await api(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
    { method: "GET" },
    { handleUnauthorized: false }
  );

  if (!res.ok) {
    return {
      success: false,
      message:
        data?.message ??
        "El enlace de verificación no es válido o ha caducado.",
    };
  }

  return {
    success: true,
    message: data?.message ?? "Email verificado correctamente.",
  };
}

/**
 * LOGOUT real
 * POST /auth/logout -> borra cookie
 */
export async function logoutUser(): Promise<void> {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // En local puede fallar por CORS/red: aun así limpiamos estado.
  } finally {
    clearSession();
  }
}

/**
 * ME real
 * GET /usuarios/perfil -> { perfil: { userId, username, tipo, ... } }
 */
export async function getMe(options: {
  suppressUnauthorizedRedirect?: boolean;
} = {}): Promise<{
  success: boolean;
  user?: AuthUser;
  message?: string;
  status?: number;
}> {
  const { res, data } = await api(
    "/usuarios/perfil",
    { method: "GET" },
    { handleUnauthorized: !options.suppressUnauthorizedRedirect }
  );

  if (!res.ok) {
    if (options.suppressUnauthorizedRedirect) {
      clearSession({ preserveRemember: true });
    }
    return {
      success: false,
      message: data?.message ?? "No autenticado.",
      status: res.status,
    };
  }

  const user = parseAuthUser(data);
  if (!user) {
    if (options.suppressUnauthorizedRedirect) {
      clearSession({ preserveRemember: true });
    }
    return {
      success: false,
      message: "Perfil recibido sin datos de usuario válidos.",
      status: res.status,
    };
  }

  return { success: true, user, status: res.status };
}

/**
 * Arranque: hace que tu app refleje la sesión real (cookie).
 * Útil para recargas: si hay cookie válida, te marca isLoggedIn.
 */
export async function bootstrapAuth(): Promise<void> {
  const hasLocalSession = localStorage.getItem("isLoggedIn") === "true";
  if (!hasLocalSession) return;

  const now = Date.now();
  const expiresAt = getSessionExpiry();
  if (!expiresAt || expiresAt <= now) {
    clearSession({ preserveRemember: true });
    return;
  }

  const me = await getMe();
  if (me.success && me.user) {
    setSession(
      {
        user_id: me.user.user_id,
        role: (me.user.role ?? "base").toLowerCase(),
        username: me.user.username ?? me.user.email ?? "",
      },
      { expiresAt }
    );
  }
}
