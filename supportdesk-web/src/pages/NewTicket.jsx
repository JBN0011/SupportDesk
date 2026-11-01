import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function NewTicket() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const ticket = await api("/api/tickets", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });
      navigate(ticket?.id ? `/tickets/${ticket.id}` : "/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h1>New ticket</h1>
      <form onSubmit={handleSubmit} className="stack">
        <label>Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>Describe the problem
          <textarea rows="6" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button>Create ticket</button>
      </form>
    </>
  );
}
