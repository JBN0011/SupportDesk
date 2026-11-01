import { useEffect, useState } from "react";
import { api, getSession } from "../api";

export default function Agents() {
  const isAdmin = getSession().role === "Admin";
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api("/api/users/agents").then(setAgents).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    try {
      await api("/api/users/agents", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "" });
      setError("");
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <h1>Agents</h1>
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
        <tbody>{agents.map((a) => <tr key={a.id}><td>{a.id}</td><td>{a.name}</td><td>{a.email}</td></tr>)}</tbody>
      </table>
      {isAdmin && (
        <form onSubmit={create} className="stack">
          <h2>Add an agent</h2>
          <label>Name<input value={form.name} onChange={set("name")} required /></label>
          <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
          <label>Password<input type="password" value={form.password} onChange={set("password")} required minLength={6} /></label>
          <button>Create agent</button>
        </form>
      )}
    </>
  );
}
