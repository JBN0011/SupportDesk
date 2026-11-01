import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { getSession, clearSession } from "./api";
import Login from "./pages/Login.jsx";
import Tickets from "./pages/Tickets.jsx";
import NewTicket from "./pages/NewTicket.jsx";
import TicketDetail from "./pages/TicketDetail.jsx";

// Pages inside this wrapper need a login. No session = go to /login.
function Protected({ children }) {
  const session = getSession();
  const navigate = useNavigate();
  if (!session) return <Navigate to="/login" replace />;

  function logout() {
    clearSession();
    navigate("/login");
  }
  return (
    <>
      <header className="bar">
        <Link to="/" className="brand">SupportDesk</Link>
        <nav>
          <Link to="/">Tickets</Link>
          {session.role === "Customer" && <Link to="/new">New ticket</Link>}
        </nav>
        <span className="who">{session.name} ({session.role})</span>
        <button className="ghost" onClick={logout}>Log out</button>
      </header>
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Tickets /></Protected>} />
      <Route path="/new" element={<Protected><NewTicket /></Protected>} />
      <Route path="/tickets/:id" element={<Protected><TicketDetail /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
