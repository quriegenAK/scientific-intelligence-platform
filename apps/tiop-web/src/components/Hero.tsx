import { useEffect, useRef } from "react";

// Hero with a drifting field of colored dots in the QurieGen palette, echoing the
// logo (points forming a shape). Light, in our control, respects reduced motion.
// The real brand video can replace this later by dropping an mp4 into public/ and
// swapping the <canvas> for a <video> background.

const DOT_COLORS = ["#2aa3b8", "#2f52c9", "#4aa3c9", "#7b6ef0", "#d46fa8", "#12324f", "#5ad1e0"];

export function Hero() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, raf = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    type Dot = { x: number; y: number; r: number; c: string; vx: number; vy: number; a: number };
    let dots: Dot[] = [];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas!.width = w * DPR; canvas!.height = h * DPR;
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.round((w * h) / 5200);
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 1.5 + Math.random() * 4.5,
        c: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        a: 0.25 + Math.random() * 0.5,
      }));
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h);
      for (const d of dots) {
        if (!reduce) {
          d.x += d.vx; d.y += d.vy;
          if (d.x < -10) d.x = w + 10; if (d.x > w + 10) d.x = -10;
          if (d.y < -10) d.y = h + 10; if (d.y > h + 10) d.y = -10;
        }
        ctx!.globalAlpha = d.a;
        ctx!.fillStyle = d.c;
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section style={{
      position: "relative", overflow: "hidden", borderRadius: 16,
      background: "linear-gradient(135deg, #0a1a33 0%, #0f2547 55%, #12324f 100%)",
      padding: "44px 34px 40px", marginBottom: "var(--space-5)",
    }}>
      <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 680 }}>
        <div style={{ fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: "#9fc7e0", opacity: 0.9 }}>
          Immuno-oncology
        </div>
        <h1 style={{ margin: "6px 0 8px", color: "#fff", fontSize: 30, lineHeight: 1.15, letterSpacing: "-.01em" }}>
          Where the open opportunities are in drug targets
        </h1>
        <p style={{ margin: 0, color: "#c7d6ea", fontSize: 16, maxWidth: 560 }}>
          Targets ranked by how open the opportunity is. Start with the answer, open any target for the
          science, open any number to see where it came from.
        </p>
      </div>
    </section>
  );
}
