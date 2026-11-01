import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getSession } from "../api";

export default function TicketDetail() {
  const { id } = useParams();
  const session = getSession();
  const isStaff = session.role !== "Customer";
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    api(`/api/tickets/${id}`).then(setTicket).catch((e) => setError(e.message));
  }
  useEffect(load, [id]);

  // Runs an action, then reloads the ticket so the screen shows the change.
  async function run(path, method, body) {
    setError("");
    try {
      await api(path, { method, body: body ? JSON.stringify(body) : undefined });
      load();
    } catch (e) { setError(e.message); }
  }

  async function addComment(e) {
    e.preventDefault();
    await run(`/api/tickets/${id}/comments`, "POST", { message });
    setMessage("");
  }

  if (!ticket) return error ? <p className="error">{error}</p> : <p>Loading...</p>;

  const comments = ticket.comments ?? [];
  return (
    <>
      <h1>#{ticket.id} {ticket.title}</h1>
      <p><span className={`tag s-${ticket.status}`}>{ticket.status}</span> Priority: {ticket.priority} | Category: {ticket.category}</p>
      <p className="desc">{ticket.description}</p>
      {error && <p className="error">{error}</p>}

      <div className="row actions">
        {isStaff && ticket.status !== "Closed" && (
          <>
            <select defaultValue="" onChange={(e) => e.target.value && run(`/api/tickets/${id}/priority`, "PATCH", { priority: e.target.value })}>
              <option value="">Set priority...</option>
              {["Low", "Medium", "High", "Urgent"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select defaultValue="" onChange={(e) => e.target.value && run(`/api/tickets/${id}/status`, "PATCH", { status: e.target.value })}>
              <option value="">Change status...</option>
              {["InProgress", "Open", "Resolved", "Closed"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </>
        )}
        {!isStaff && ticket.status !== "Closed" && (
          <button className="ghost" onClick={() => run(`/api/tickets/${id}/status`, "PATCH", { status: "Closed" })}>Close my ticket</button>
        )}
      </div>

      <h2>Comments</h2>
      {comments.length === 0 && <p className="empty">No comments yet.</p>}
      {comments.map((c, i) => (
        <div className="comment" key={c.id ?? i}>
          <strong>{c.authorName ?? c.userName ?? c.author ?? "User"}</strong>
          <p>{c.message ?? c.text ?? c.body}</p>
        </div>
      ))}

      {ticket.status !== "Closed" ? (
        <form onSubmit={addComment} className="stack">
          <textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a comment" required />
          <button>Add comment</button>
        </form>
      ) : <p className="empty">This ticket is closed. Comments are turned off.</p>}
    </>
  );
}
