export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5082";

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}
