import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "./pages/Dashboard";
import { TargetProfile } from "./pages/TargetProfile";
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
      gap: 24, padding: "0 var(--space-6)", height: 56,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontWeight: 800, letterSpacing: "-.02em" }}>TIOP</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Target Intelligence</span>
      </div>
      <nav style={{ display: "flex", gap: 20 }}>
        <NavLink to="/" style={link} end>Dashboard</NavLink>
        <NavLink to="/backtest" style={link}>Score Validation</NavLink>
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
        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "var(--space-6) var(--space-5)" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/target/:symbol" element={<TargetProfile />} />
            <Route path="/backtest" element={<BackTestPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
