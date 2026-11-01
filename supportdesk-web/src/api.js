// All calls to the SupportDesk API live in this one file.
export const API_URL = "https://localhost:7080";

export function getSession() {
  const raw = localStorage.getItem("session");
  return raw ? JSON.parse(raw) : null; // { token, name, role }
}
export function saveSession(s) { localStorage.setItem("session", JSON.stringify(s)); }
export function clearSession() { localStorage.removeItem("session"); }

// Sends a request. Adds the token if we are logged in.
export async function api(path, options = {}) {
  const session = getSession();
  const headers = { "Content-Type": "application/json" };
  if (session) headers.Authorization = `Bearer ${session.token}`;

  const res = await fetch(API_URL + path, { ...options, headers });

  if (res.status === 401) {          // token missing or expired
    clearSession();
    window.location.href = "/login";
    throw new Error("Please log in again.");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      msg = body.title || body.message || body.detail || msg;
    } catch { /* response had no JSON body */ }
    throw new Error(msg);
  }
  if (res.status === 204) return null; // success with no body
  return res.json();
}
