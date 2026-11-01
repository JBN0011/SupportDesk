import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getSession } from "../api";

const PAGE_SIZE = 10;
const STATUSES = ["", "Open", "InProgress", "Resolved", "Closed"];
const PRIORITIES = ["", "Low", "Medium", "High", "Urgent"];
const CATEGORIES = ["", "Bug", "Billing", "Account", "FeatureRequest", "Other"];

function Pick({ label, value, onChange, options }) {
  return (
    <label className="inline">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o || "All"}</option>)}
      </select>
    </label>
  );
}

export default function Tickets() {
  const staff = getSession().role !== "Customer";
  const [tickets, setTickets] = useState([]);
  const [f, setF] = useState({ status: "", priority: "", category: "", search: "", mine: false });
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const change = (k) => (v) => { setF({ ...f, [k]: v }); setPage(1); };

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ page, pageSize: PAGE_SIZE });
    ["status", "priority", "category", "search"].forEach((k) => f[k] && q.set(k, f[k]));
    if (f.mine) q.set("assignedToMe", "true");
    api(`/api/tickets?${q}`)
      .then((data) => { setTickets(Array.isArray(data) ? data : data.items ?? data.tickets ?? []); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [f, page]);

  return (
    <>
      <h1>Tickets</h1>
      <div className="row filters">
        <Pick label="Status" value={f.status} onChange={change("status")} options={STATUSES} />
        <Pick label="Priority" value={f.priority} onChange={change("priority")} options={PRIORITIES} />
        <Pick label="Category" value={f.category} onChange={change("category")} options={CATEGORIES} />
        <input placeholder="Search tickets" value={f.search} onChange={(e) => change("search")(e.target.value)} />
        {staff && (
          <label className="inline check">
            <input type="checkbox" checked={f.mine} onChange={(e) => change("mine")(e.target.checked)} /> Assigned to me
          </label>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? <p>Loading...</p> : tickets.length === 0 ? (
        <p className="empty">No tickets match these filters. Clear a filter to see more.</p>
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
