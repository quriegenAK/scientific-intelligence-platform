import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "./pages/Dashboard";
import { BackTestPage } from "./pages/BackTest";
import { MODE } from "./lib/api";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });

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
        <div className="qmark" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7.5" stroke="#fff" strokeWidth="2.4" />
            <path d="M15 15 L19 19" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div className="brandname" style={{ fontSize: 16 }}>Target Intelligence and Opportunity Platform</div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", letterSpacing: ".08em", textTransform: "uppercase" }}>by QurieGen</div>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 20, marginLeft: 8 }}>
        <NavLink to="/" style={link} end>Opportunities</NavLink>
        <NavLink to="/backtest" style={link}>Score check</NavLink>
      </nav>
      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{MODE}</span>
    </header>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Nav />
        <main style={{ maxWidth: 940, margin: "0 auto", padding: "var(--space-6) var(--space-5)" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/backtest" element={<BackTestPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
