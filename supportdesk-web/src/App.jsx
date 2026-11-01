import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { getSession, clearSession } from "./api";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Tickets from "./pages/Tickets.jsx";
import NewTicket from "./pages/NewTicket.jsx";
import TicketDetail from "./pages/TicketDetail.jsx";
import Stats from "./pages/Stats.jsx";
import Agents from "./pages/Agents.jsx";

// roles = who may open this page. Others are sent back to the ticket list.
function Protected({ children, roles }) {
  const session = getSession();
  const navigate = useNavigate();
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.role)) return <Navigate to="/" replace />;

  const staff = session.role !== "Customer";
  function logout() { clearSession(); navigate("/login"); }
  return (
    <>
      <header className="bar">
        <Link to="/" className="brand">SupportDesk</Link>
        <nav>
          <Link to="/">Tickets</Link>
          {!staff && <Link to="/new">New ticket</Link>}
          {staff && <Link to="/stats">Stats</Link>}
          {staff && <Link to="/agents">Agents</Link>}
        </nav>
        <span className="who">{session.name} ({session.role})</span>
        <button className="ghost" onClick={logout}>Log out</button>
      </header>
      <main>{children}</main>
    </>
  );
}

const STAFF = ["Agent", "Admin"];
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><Tickets /></Protected>} />
      <Route path="/new" element={<Protected roles={["Customer"]}><NewTicket /></Protected>} />
      <Route path="/tickets/:id" element={<Protected><TicketDetail /></Protected>} />
      <Route path="/stats" element={<Protected roles={STAFF}><Stats /></Protected>} />
      <Route path="/agents" element={<Protected roles={STAFF}><Agents /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
