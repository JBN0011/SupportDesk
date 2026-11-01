import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      navigate("/login");
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="login">
      <h1>Create your account</h1>
      <form onSubmit={handleSubmit}>
        <label>Name<input value={form.name} onChange={set("name")} required /></label>
        <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
        <label>Password<input type="password" value={form.password} onChange={set("password")} required minLength={6} /></label>
        {error && <p className="error">{error}</p>}
        <button>Create account</button>
      </form>
      <p>Already registered? <Link to="/login">Sign in</Link></p>
    </div>
  );
}
