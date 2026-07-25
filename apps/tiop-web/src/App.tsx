import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "./pages/Dashboard";
import { BackTestPage } from "./pages/BackTest";
import { Methods } from "./pages/Methods";
import { Comments } from "./pages/Comments";
import { Feedback } from "./components/Feedback";
import { MODE } from "./lib/api";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });
const LOGO = `${import.meta.env.BASE_URL}logo.svg`;

function Nav() {
  const link = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? "var(--text)" : "var(--text-muted)",
    fontWeight: 600, fontSize: 14, textDecoration: "none",
    borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
    padding: "4px 2px",
  });
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 10, background: "var(--surface)",
      borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center",
      gap: 24, padding: "0 var(--space-6)", height: 64,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={LOGO} alt="QurieGen" width={40} height={35} style={{ display: "block", flex: "none" }} />
        <div style={{ lineHeight: 1.1 }}>
          <div className="brandname" style={{ fontSize: 16 }}>Target Intelligence and Opportunity Platform</div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", letterSpacing: ".08em", textTransform: "uppercase" }}>by QurieGen</div>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 20, marginLeft: 8 }}>
        <NavLink to="/" style={link} end>Opportunities</NavLink>
        <NavLink to="/methods" style={link}>Methods</NavLink>
        <NavLink to="/backtest" style={link}>Score check</NavLink>
        <NavLink to="/comments" style={link}>Comments</NavLink>
      </nav>
      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{MODE}</span>
    </header>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <HashRouter>
        <Nav />
        <main style={{ maxWidth: 940, margin: "0 auto", padding: "var(--space-6) var(--space-5)" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/methods" element={<Methods />} />
            <Route path="/backtest" element={<BackTestPage />} />
            <Route path="/comments" element={<Comments />} />
          </Routes>
        </main>
        <Feedback />
      </HashRouter>
    </QueryClientProvider>
  );
}
