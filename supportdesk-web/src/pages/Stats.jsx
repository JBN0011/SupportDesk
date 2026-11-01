import { useEffect, useState } from "react";
import { api } from "../api";

// Shows whatever the API returns, so it works without knowing the exact shape.
function Block({ title, value }) {
  if (value !== null && typeof value === "object") {
    return (
      <div className="card">
        <h2>{title}</h2>
        {Object.entries(value).map(([k, v]) => <Block key={k} title={k} value={v} />)}
      </div>
    );
  }
  return <p className="stat"><span>{title}</span> <strong>{String(value)}</strong></p>;
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/api/tickets/stats").then(setStats).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <h1>Ticket statistics</h1>
      {error && <p className="error">{error}</p>}
      {!stats && !error && <p>Loading...</p>}
      {stats && Object.entries(stats).map(([k, v]) => <Block key={k} title={k} value={v} />)}
    </>
  );
}
