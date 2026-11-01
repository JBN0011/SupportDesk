import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, saveSession } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();              // stop the browser reloading the page
    setError("");
    setBusy(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveSession({ token: data.token, name: data.name, role: data.role });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <h1>Sign in to SupportDesk</h1>
      <form onSubmit={handleSubmit}>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}
