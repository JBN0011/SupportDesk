import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const PAGE_SIZE = 10;
const STATUSES = ["", "Open", "InProgress", "Resolved", "Closed"];

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Runs again whenever status or page changes.
  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ page, pageSize: PAGE_SIZE });
    if (status) q.set("status", status);
    api(`/api/tickets?${q}`)
      .then((data) => {
        // Works whether the API returns a plain list or { items: [...] }
        setTickets(Array.isArray(data) ? data : data.items ?? data.tickets ?? []);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <>
      <div className="row">
        <h1>Tickets</h1>
        <label className="inline">Status
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || "All"}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? <p>Loading...</p> : tickets.length === 0 ? (
        <p className="empty">No tickets found. Try a different status filter.</p>
      ) : (
        <table>
          <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Category</th></tr></thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td><Link to={`/tickets/${t.id}`}>{t.title}</Link></td>
                <td><span className={`tag s-${t.status}`}>{t.status}</span></td>
                <td>{t.priority}</td>
                <td>{t.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="row">
        <button className="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page}</span>
        <button className="ghost" disabled={tickets.length < PAGE_SIZE} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </>
  );
}
