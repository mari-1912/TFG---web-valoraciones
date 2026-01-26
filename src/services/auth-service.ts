// src/services/auth-service.ts

export type AuthUser = {
  user_id: number;
  email: string;
  role: string;
  username?: string; // (opcional si el backend lo devuelve en /auth/me)
};

const API_URL = import.meta.env.VITE_API_URL ?? "https://tfg-web-valoraciones-back-i9b5.onrender.com";

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
export async function registerUser(payload: {
  username: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string }> {
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

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userRole", role);
  localStorage.setItem("currentUser", username);

  return { success: true, message: data?.message ?? "Registro exitoso." };
}

/**
 * LOGIN real contra backend
 * POST /auth/login  body: { email, password }
 * -> backend setea cookie access_token
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  const { res, data } = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
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
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", (me.user.role ?? "base").toLowerCase());
    localStorage.setItem(
      "currentUser",
      me.user.username ?? me.user.email ?? ""
    );
  } else {
    // Aunque /me falle por lo que sea, consideramos login hecho
    localStorage.setItem("isLoggedIn", "true");
  }

  return { success: true, message: data?.message ?? "Login correcto." };
}

/**
 * LOGOUT real
 * POST /auth/logout -> borra cookie
 */
export async function logoutUser(): Promise<void> {
  await api("/auth/logout", { method: "POST" });

  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("rememberMe");
}

/**
 * ME real
 * GET /auth/me -> { user_id, email, role } (y opcional username)
 */
export async function getMe(): Promise<{
  success: boolean;
  user?: AuthUser;
  message?: string;
}> {
  const { res, data } = await api("/auth/me", { method: "GET" });

  if (!res.ok) {
    // Si la cookie no es válida, limpiamos estado local
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentUser");
    return { success: false, message: data?.message ?? "No autenticado." };
  }

  return { success: true, user: data as AuthUser };
}

/**
 * Arranque: hace que tu app refleje la sesión real (cookie).
 * Útil para recargas: si hay cookie válida, te marca isLoggedIn.
 */
export async function bootstrapAuth(): Promise<void> {
  const me = await getMe();
  if (me.success && me.user) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", (me.user.role ?? "base").toLowerCase());
    localStorage.setItem(
      "currentUser",
      me.user.username ?? me.user.email ?? ""
    );
  }
}
