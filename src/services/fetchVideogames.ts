const API = "http://localhost:5000";

export async function fetchVideoGames(q?: string, pageSize?: number) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (pageSize) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  const url = `${API}/videojuegos${query ? `?${query}` : ""}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error("fetchVideoGames ERROR:", res.status, text);
    throw new Error(`fetchVideoGames failed: ${res.status}`);
  }

  return res.json();
}
