// src/services/authService.ts

interface User {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export function registerUser(newUser: User): { success: boolean; message: string } {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  // Comprobar si ya existe un usuario con ese email
  const existingUser = users.find((u: User) => u.email === newUser.email);
  if (existingUser) {
    return { success: false, message: "Ya existe una cuenta con ese correo." };
  }

  // Guardar el nuevo usuario
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  return { success: true, message: "Registro exitoso." };
}

export function loginUser(email: string, password: string): { success: boolean; message: string; user?: User } {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find((u: User) => u.email === email && u.password === password);

  if (!user) {
    return { success: false, message: "Credenciales incorrectas." };
  }

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userRole", user.role || "usuario");
  localStorage.setItem("currentUser", user.username);

  return { success: true, message: "Inicio de sesión correcto.", user };
}

export function logoutUser() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("currentUser");
}


/*CUANDO ESTE EL BACK SE CAMBIA POR ALGO COMO ESTO:
export async function registerUser(newUser: User) {
  const response = await fetch("https://tuapi.com/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser),
  });
  return await response.json();
}
*/