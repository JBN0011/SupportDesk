import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getSession, getUserId } from "../api";

export default function TicketDetail() {
  const { id } = useParams();
  const session = getSession();
  const isStaff = session.role !== "Customer";
  const isAdmin = session.role === "Admin";
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() { api(`/api/tickets/${id}`).then(setTicket).catch((e) => setError(e.message)); }
  useEffect(load, [id]);
  // Admins pick an agent from a list.
  useEffect(() => { if (isAdmin) api("/api/users/agents").then(setAgents).catch(() => {}); }, [isAdmin]);

  async function run(path, method, body) {
    setError("");
    try {
      const result = await api(path, { method, body: body ? JSON.stringify(body) : undefined });
      load();
      return result;
    } catch (e) { setError(e.message); }
  }

  async function addComment(e) {
    e.preventDefault();
    await run(`/api/tickets/${id}/comments`, "POST", { message });
    setMessage("");
  }

  // Asks the AI for a draft and puts it in the comment box. Staff can edit before sending.
  async function suggestReply() {
    const draft = await run(`/api/tickets/${id}/suggest-reply`, "POST");
    if (draft) setMessage(typeof draft === "string" ? draft : draft.reply ?? draft.suggestion ?? draft.text ?? JSON.stringify(draft));
  }

  if (!ticket) return error ? <p className="error">{error}</p> : <p>Loading...</p>;

  const assignedName = ticket.assignedToName ?? ticket.assignedTo?.name ?? ticket.assignedAgentName;
  const comments = ticket.comments ?? [];
  const open = ticket.status !== "Closed";

  return (
    <>
      <h1>#{ticket.id} {ticket.title}</h1>
      <p>
        <span className={`tag s-${ticket.status}`}>{ticket.status}</span>{" "}
        Priority: {ticket.priority} | Category: {ticket.category} | Assigned to: {assignedName ?? "nobody yet"}
      </p>
      <p className="desc">{ticket.description}</p>
      {error && <p className="error">{error}</p>}

      <div className="row actions">
        {isStaff && open && (
          <>
            {!isAdmin && <button className="ghost" onClick={() => run(`/api/tickets/${id}/assign`, "POST", { agentId: getUserId() })}>Assign to me</button>}
            {isAdmin && (
              <select defaultValue="" onChange={(e) => e.target.value && run(`/api/tickets/${id}/assign`, "POST", { agentId: Number(e.target.value) })}>
                <option value="">Assign to agent...</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
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
        {!isStaff && open && <button className="ghost" onClick={() => run(`/api/tickets/${id}/status`, "PATCH", { status: "Closed" })}>Close my ticket</button>}
      </div>

      <h2>Comments</h2>
      {comments.length === 0 && <p className="empty">No comments yet.</p>}
      {comments.map((c, i) => (
        <div className="comment" key={c.id ?? i}>
          <strong>{c.authorName ?? c.userName ?? c.author ?? "User"}</strong>
          <p>{c.message ?? c.text ?? c.body}</p>
        </div>
      ))}

      {open ? (
        <form onSubmit={addComment} className="stack">
          <textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a comment" required />
          <div className="row actions">
            <button>Add comment</button>
            {isStaff && <button type="button" className="ghost" onClick={suggestReply}>Suggest a reply with AI</button>}
          </div>
        </form>
      ) : <p className="empty">This ticket is closed. Comments are turned off.</p>}
    </>
  );
}
