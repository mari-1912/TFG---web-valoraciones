const API = "http://localhost:5000";

export async function fetchBooks(q: string) {
  const url = `${API}/libros/${q ? `?q=${encodeURIComponent(q)}` : ""}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error("fetchBooks ERROR:", res.status, text);
    throw new Error(`fetchBooks failed: ${res.status}`);
  }

  return res.json();
}
