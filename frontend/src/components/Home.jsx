import { useState } from "react";

// ─── Design tokens (matching attendance theme) ────────────────────────────────
const tk = {
    bg: "#0d1117",
    bgGradient: "radial-gradient(circle at top left, rgba(202,138,4,0.14), transparent 26%), radial-gradient(circle at bottom right, rgba(180,83,9,0.08), transparent 30%), linear-gradient(135deg, #0d1117 0%, #111827 48%, #161b22 100%)",
    surface: "rgba(16, 20, 27, 0.96)",
    surface2: "rgba(24, 28, 36, 0.94)",
    surface3: "rgba(33, 39, 48, 0.96)",
    surfaceGlass: "rgba(16, 20, 27, 0.72)",
    border: "rgba(255,255,255,0.08)",
    borderGlass: "rgba(255,255,255,0.1)",
    accent: "#d4a24c",
    accentGradient: "linear-gradient(135deg, #f7b955 0%, #c9862d 55%, #8c5d17 100%)",
    accentDim: "rgba(212,162,76,0.12)",
    text: "#f5f0e6",
    textDim: "#e6ddd0",
    muted: "#8f96a3",
    muted2: "#b8b0a3",
    font: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    shadowMd: "0 16px 34px rgba(0, 0, 0, 0.28)",
    shadowSm: "0 8px 18px rgba(0, 0, 0, 0.18)",
};

function injectGlobalStyles() {
    if (!document.getElementById("home-global-css")) {
        const s = document.createElement("style");
        s.id = "home-global-css";
        s.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; }
  body {
    background: ${tk.bgGradient};
    color: ${tk.text};
    font-family: ${tk.font};
    min-height: 100vh;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${tk.border}; border-radius: 999px; }
  ::-webkit-scrollbar-thumb:hover { background: ${tk.muted}; }
  input, select, textarea { font-family: ${tk.font}; }
  ::selection { background: ${tk.accentDim}; color: ${tk.accent}; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(212,162,76,0)} 50%{box-shadow:0 0 32px 10px rgba(212,162,76,.14)} }

  .home-hero { animation: fadeUp .6s cubic-bezier(.16,1,.3,1) both; }
  .home-feature { animation: fadeUp .7s cubic-bezier(.16,1,.3,1) both; }
  .btn-glow:hover { animation: glow .9s infinite; }
  .gradient-text {
    background: ${tk.accentGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;
        document.head.appendChild(s);
    }
}

function Btn({ children, onClick, style, className = "" }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            type="button"
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px 32px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: hov ? "linear-gradient(135deg, #f7b955 0%, #c9862d 55%, #8c5d17 100%)" : tk.accentGradient,
                color: hov ? "#1a0f00" : "#221400",
                fontFamily: tk.font,
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
                transition: "all .24s cubic-bezier(.16,1,.3,1)",
                boxShadow: hov ? `0 20px 50px rgba(212,162,76,.35)` : tk.shadowMd,
                transform: hov ? "translateY(-2px)" : "translateY(0)",
                letterSpacing: "0.3px",
                ...style,
            }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function FeatureCard({ icon, title, desc }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? tk.surface2 : tk.surface,
                border: `1px solid ${hov ? "rgba(212,162,76,.24)" : tk.border}`,
                borderRadius: "16px",
                padding: "32px 28px",
                textAlign: "center",
                cursor: "default",
                transition: "all .28s cubic-bezier(.16,1,.3,1)",
                transform: hov ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hov ? `0 24px 56px rgba(0,0,0,.32)` : tk.shadowSm,
            }}
        >
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: hov ? 1 : 0.85, transition: "opacity .2s" }}>{icon}</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: tk.text, marginBottom: "12px", letterSpacing: "-0.3px" }}>{title}</div>
            <div style={{ fontSize: "14px", color: tk.muted2, lineHeight: 1.6 }}>{desc}</div>
        </div>
    );
}

export default function Home({ onEnter }) {
    injectGlobalStyles();

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: tk.bg }}>
            {/* Navigation/Header */}
            <div style={{ padding: "20px 40px", borderBottom: `1px solid ${tk.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", background: tk.accentGradient, borderRadius: "12px", display: "grid", placeItems: "center", fontSize: "16px", fontWeight: 900, color: "#221400", boxShadow: "0 12px 28px rgba(212,162,76,0.28)" }}>SA</div>
                    <div>
                        <div style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "-0.5px" }}>
                            <span style={{ color: "#ffffff" }}>Snap</span><span style={{ background: "linear-gradient(135deg, #8ba8ff 0%, #5b7fd4 55%, #3d5ba8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Attend</span>
                        </div>
                        <div style={{ fontSize: "11px", color: tk.muted2, marginTop: "2px" }}>snapattend platform</div>
                    </div>
                </div>
                <Btn onClick={onEnter} style={{ padding: "12px 24px", fontSize: "14px" }}>
                    Get Started →
                </Btn>
            </div>

            {/* Hero Section */}
            <div className="home-hero" style={{ padding: "120px 40px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <div style={{ maxWidth: "700px" }}>
                    <h1 style={{ fontSize: "64px", fontWeight: 900, letterSpacing: "-2px", color: tk.text, marginBottom: "24px", lineHeight: 1.2 }}>
                        Attendance,<br />
                        <span className="gradient-text" style={{ fontSize: "64px", fontWeight: 900, letterSpacing: "-2px" }}>Reimagined</span>
                    </h1>

                    <p style={{ fontSize: "18px", color: tk.muted2, marginBottom: "48px", lineHeight: 1.8, fontWeight: 500 }}>
                        Mark attendance in seconds with AI-powered face recognition. No more manual rolls. Just intelligence, speed, and accuracy.
                    </p>

                    <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                        <Btn onClick={onEnter} className="btn-glow">
                            Enter Dashboard →
                        </Btn>
                    </div>
                </div>
            </div>

            {/* Simple Features Section */}
            <div style={{ padding: "80px 40px", background: tk.surfaceGlass, borderTop: `1px solid ${tk.border}`, borderBottom: `1px solid ${tk.border}` }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <h2 style={{ fontSize: "36px", fontWeight: 900, color: tk.text, marginBottom: "60px", textAlign: "center", letterSpacing: "-1px" }}>
                        Why Choose SnapAttend
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ fontSize: "32px", minWidth: "40px" }}>⚡</div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: tk.text, marginBottom: "8px" }}>Lightning Fast</div>
                                <p style={{ fontSize: "14px", color: tk.muted2, lineHeight: 1.6 }}>Recognize and mark attendance in under a second with advanced ML algorithms.</p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ fontSize: "32px", minWidth: "40px" }}>🎯</div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: tk.text, marginBottom: "8px" }}>99.9% Accurate</div>
                                <p style={{ fontSize: "14px", color: tk.muted2, lineHeight: 1.6 }}>KNN-powered face recognition with multiple captures for reliability.</p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ fontSize: "32px", minWidth: "40px" }}>👥</div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: tk.text, marginBottom: "8px" }}>Easy Management</div>
                                <p style={{ fontSize: "14px", color: tk.muted2, lineHeight: 1.6 }}>Register students, manage profiles, and track attendance all in one place.</p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ fontSize: "32px", minWidth: "40px" }}>📊</div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: tk.text, marginBottom: "8px" }}>Smart Analytics</div>
                                <p style={{ fontSize: "14px", color: tk.muted2, lineHeight: 1.6 }}>Real-time dashboard with attendance patterns and model status.</p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ fontSize: "32px", minWidth: "40px" }}>🛡️</div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: tk.text, marginBottom: "8px" }}>Secure & Private</div>
                                <p style={{ fontSize: "14px", color: tk.muted2, lineHeight: 1.6 }}>All data stays local. No cloud dependency, complete privacy control.</p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ fontSize: "32px", minWidth: "40px" }}>🎓</div>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: tk.text, marginBottom: "8px" }}>Built for Schools</div>
                                <p style={{ fontSize: "14px", color: tk.muted2, lineHeight: 1.6 }}>Designed specifically for educational institutions and classrooms.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{ padding: "80px 40px", textAlign: "center" }}>
                <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                    <h2 style={{ fontSize: "40px", fontWeight: 900, color: tk.text, marginBottom: "24px", letterSpacing: "-1px" }}>
                        Ready to Transform Attendance?
                    </h2>
                    <p style={{ fontSize: "16px", color: tk.muted2, marginBottom: "40px", lineHeight: 1.7 }}>
                        Join classrooms worldwide that are already using SnapAttend for faster, smarter attendance tracking.
                    </p>
                    <Btn onClick={onEnter} className="btn-glow" style={{ padding: "16px 40px", fontSize: "16px" }}>
                        Start Now →
                    </Btn>
                </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "40px", borderTop: `1px solid ${tk.border}`, textAlign: "center", background: "rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "12px", color: tk.muted, fontWeight: 600, letterSpacing: "0.5px" }}>
                    © 2026 SnapAttend • AI-Powered Attendance Platform
                </div>
            </div>
        </div>
    );
}
