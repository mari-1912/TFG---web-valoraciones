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
const SESSION_ISSUED_AT_KEY = "sessionIssuedAt";
const SESSION_EXPIRES_AT_KEY = "sessionExpiresAt";

function resolveSessionTtl(remember: boolean) {
  return remember ? REMEMBER_TTL_MS : SESSION_TTL_MS;
}

function getRememberPreference() {
  return localStorage.getItem("rememberMe") === "true";
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
  user: { username?: string; role?: string },
  options: { remember?: boolean; expiresAt?: number } = {}
) {
  const remember = options.remember ?? getRememberPreference();
  const now = Date.now();
  const ttl = resolveSessionTtl(remember);
  const expiresAt =
    options.expiresAt && options.expiresAt > now ? options.expiresAt : now + ttl;

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userRole", (user.role ?? "base").toString().toLowerCase());
  localStorage.setItem("currentUser", user.username ?? "");
  localStorage.setItem(SESSION_ISSUED_AT_KEY, String(now));
  localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(expiresAt));
  localStorage.setItem("rememberMe", remember ? "true" : "false");
}

function clearSession(options: { preserveRemember?: boolean } = {}) {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("currentUser");
  localStorage.removeItem(SESSION_ISSUED_AT_KEY);
  localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
  if (!options.preserveRemember) {
    localStorage.removeItem("rememberMe");
  }
}

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    credentials: "include", // <-- CLAVE: enviar/recibir cookies HttpOnly
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
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
  options: { remember?: boolean } = {}
): Promise<{ success: boolean; message: string }> {
  const { res, data } = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return {
      success: false,
      message: data?.message ?? "Registro fallido.",
    };
  }

  // Como el backend setea cookie, ya estás autenticado.
  // Mantenemos localStorage para compatibilidad con el resto de la app.
  const username = data?.user?.username ?? payload.username;
  const role = (data?.user?.tipo ?? "base").toString().toLowerCase();

  setSession({ username, role }, { remember: options.remember });

  return { success: true, message: data?.message ?? "Registro exitoso." };
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
  });

  if (!res.ok) {
    return {
      success: false,
      message: data?.message ?? "Credenciales inválidas.",
    };
  }

  // Cookie ya puesta: sincronizamos datos llamando a /auth/me
  const me = await getMe();
  if (me.success && me.user) {
    setSession(
      {
        role: (me.user.role ?? "base").toLowerCase(),
        username: me.user.username ?? me.user.email ?? "",
      },
      { remember }
    );
  } else {
    // Aunque /me falle por lo que sea, consideramos login hecho
    setSession({ role: "base", username: normalized }, { remember });
  }

  return { success: true, message: data?.message ?? "Login correcto." };
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
export async function getMe(): Promise<{
  success: boolean;
  user?: AuthUser;
  message?: string;
}> {
  const { res, data } = await api("/usuarios/perfil", { method: "GET" });

  if (!res.ok) {
    // Si la cookie no es válida, limpiamos estado local
    clearSession({ preserveRemember: true });
    return { success: false, message: data?.message ?? "No autenticado." };
  }

  const perfil = data?.perfil ?? data ?? {};
  return {
    success: true,
    user: {
      user_id: Number(perfil.userId ?? perfil.user_id ?? 0),
      email: perfil.email,
      role: (perfil.tipo ?? perfil.role ?? "base").toString().toLowerCase(),
      username: perfil.username,
    },
  };
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
        role: (me.user.role ?? "base").toLowerCase(),
        username: me.user.username ?? me.user.email ?? "",
      },
      { expiresAt }
    );
  }
}
