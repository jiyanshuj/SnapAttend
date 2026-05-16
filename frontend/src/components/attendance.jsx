import { useEffect, useState } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ─── Design tokens ───────────────────────────────────────────────────────────
const tk = {
    bg: "#0d1117",
    bgGradient: "radial-gradient(circle at top left, rgba(202,138,4,0.14), transparent 26%), radial-gradient(circle at bottom right, rgba(180,83,9,0.08), transparent 30%), linear-gradient(135deg, #0d1117 0%, #111827 48%, #161b22 100%)",
    surface: "rgba(16, 20, 27, 0.96)",
    surface2: "rgba(24, 28, 36, 0.94)",
    surface3: "rgba(33, 39, 48, 0.96)",
    surfaceGlass: "rgba(16, 20, 27, 0.72)",
    border: "rgba(255,255,255,0.08)",
    border2: "rgba(255,255,255,0.14)",
    borderGlass: "rgba(255,255,255,0.1)",
    accent: "#d4a24c",
    accentAlt: "#f59e0b",
    accentGradient: "linear-gradient(135deg, #f7b955 0%, #c9862d 55%, #8c5d17 100%)",
    blueGradient: "linear-gradient(135deg, #8ba8ff 0%, #5b7fd4 55%, #3d5ba8 100%)",
    accentDim: "rgba(212,162,76,0.12)",
    accentDim2: "rgba(212,162,76,0.22)",
    blue: "#8ba8ff",
    blueDim: "rgba(139,168,255,0.12)",
    cyan: "#8ba8ff",
    cyanDim: "rgba(139,168,255,0.12)",
    purple: "#b089f7",
    purpleDim: "rgba(176,137,247,0.12)",
    danger: "#fb7185",
    dangerDim: "rgba(251,113,133,0.12)",
    warn: "#f7b955",
    warnDim: "rgba(247,185,85,0.14)",
    text: "#f5f0e6",
    textDim: "#e6ddd0",
    muted: "#8f96a3",
    muted2: "#b8b0a3",
    radius: "18px",
    radiusSm: "10px",
    radiusLg: "24px",
    font: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    shadow: "0 24px 60px rgba(0, 0, 0, 0.38)",
    shadowLg: "0 36px 90px rgba(0, 0, 0, 0.55)",
    shadowMd: "0 16px 34px rgba(0, 0, 0, 0.28)",
    shadowSm: "0 8px 18px rgba(0, 0, 0, 0.18)",
};

// ─── Global styles injected once ─────────────────────────────────────────────
const GLOBAL_CSS = `
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
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
        background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(135deg, rgba(212,162,76,0.08) 0%, transparent 40%, rgba(245,185,85,0.04) 100%);
        background-size: 72px 72px, 72px 72px, 100% 100%;
        mask-image: linear-gradient(to bottom, rgba(0,0,0,0.72), transparent 90%);
        opacity: 0.28;
  }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${tk.border2}; border-radius: 999px; }
  ::-webkit-scrollbar-thumb:hover { background: ${tk.muted}; }
  input, select, textarea { font-family: ${tk.font}; }
  ::selection { background: ${tk.accentDim2}; color: ${tk.accent}; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.94)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(34,211,238,0)} 50%{box-shadow:0 0 28px 8px rgba(34,211,238,.16)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

  .page-enter { animation: fadeUp .48s cubic-bezier(.16,1,.3,1) both; }
  .card-hover { transition: transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s cubic-bezier(.16,1,.3,1), border-color .28s; }
    .card-hover:hover { transform: translateY(-4px); border-color: rgba(212,162,76,.28) !important; box-shadow: 0 24px 60px rgba(0,0,0,.34); }
  .btn-glow:hover { animation: glow .9s infinite; }
  .glass-effect {
    background: ${tk.surfaceGlass};
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid ${tk.borderGlass};
  }
  .gradient-text {
    background: ${tk.accentGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

function injectGlobalStyles() {
    if (!document.getElementById("att-global-css")) {
        const s = document.createElement("style");
        s.id = "att-global-css";
        s.textContent = GLOBAL_CSS;
        document.head.appendChild(s);
    }
}

// ─── API helpers ─────────────────────────────────────────────────────────────
async function apiFetch(url, opts = {}) {
    const r = await fetch(API + url, {
        headers: { "Content-Type": "application/json" },
        ...opts,
    });
    return r.json();
}

// ─── Reusable primitives ──────────────────────────────────────────────────────
function Btn({ children, variant = "primary", onClick, disabled, style, small, className = "" }) {
    const base = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: small ? "8px 16px" : "12px 22px",
        borderRadius: tk.radiusSm,
        border: "1px solid transparent",
        fontFamily: tk.font,
        fontSize: small ? "12px" : "14px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        outline: "none",
        transition: "all .22s cubic-bezier(.16,1,.3,1)",
        letterSpacing: "0.2px",
        whiteSpace: "nowrap",
        boxShadow: tk.shadowSm,
        transform: "translateY(0)",
    };
    const variants = {
        primary: { background: tk.accentGradient, color: "#221400", borderColor: "rgba(255,255,255,0.08)" },
        secondary: { background: tk.surfaceGlass, color: tk.text, borderColor: tk.borderGlass, backdropFilter: "blur(10px)" },
        danger: { background: tk.dangerDim, color: tk.danger, borderColor: "rgba(251,113,133,0.24)" },
        blue: { background: tk.blue, color: "#fff", borderColor: tk.blue },
        ghost: { background: "transparent", color: tk.muted2, borderColor: "transparent", boxShadow: "none" },
    };
    const hoverStyle = {
        primary: { transform: "translateY(-2px)", boxShadow: tk.shadowMd },
        secondary: { borderColor: tk.accent, color: tk.accent, background: "rgba(34,211,238,0.08)" },
        danger: { background: "rgba(251,113,133,0.22)" },
        blue: { transform: "translateY(-2px)", boxShadow: tk.shadowMd },
        ghost: { color: tk.accent, background: "rgba(34,211,238,0.06)" },
    };
    const [hov, setHov] = useState(false);
    return (
        <button
            type="button"
            className={className}
            style={{ ...base, ...variants[variant], ...(hov && !disabled ? hoverStyle[variant] : {}), ...style }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

function Input({ label, id, placeholder, value, onChange, type = "text" }) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ marginBottom: "16px" }}>
            {label && (
                <label htmlFor={id} style={{ display: "block", fontSize: "11px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: tk.muted, marginBottom: "8px" }}>
                    {label}
                </label>
            )}
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: focused ? "rgba(15,23,42,0.92)" : tk.surfaceGlass,
                    border: `1.5px solid ${focused ? tk.accent : tk.borderGlass}`,
                    borderRadius: tk.radiusSm,
                    color: tk.text,
                    fontSize: "14px",
                    outline: "none",
                    transition: "all .22s cubic-bezier(.16,1,.3,1)",
                    boxShadow: focused ? `0 0 0 4px ${tk.accentDim}` : "none",
                    backdropFilter: "blur(10px)",
                }}
            />
        </div>
    );
}

function Card({ children, style, className }) {
    return (
        <div
            className={`${className || ""} card-hover glass-effect`}
            style={{ background: tk.surfaceGlass, border: `1px solid ${tk.borderGlass}`, borderRadius: tk.radius, padding: "28px", boxShadow: tk.shadowMd, ...style }}
        >
            {children}
        </div>
    );
}

function Badge({ children, variant = "green" }) {
    const vars = {
        green: { bg: "rgba(212,162,76,0.14)", color: tk.accent, border: "1px solid rgba(212,162,76,0.24)" },
        blue: { bg: "rgba(59,130,246,0.14)", color: tk.blue, border: "1px solid rgba(59,130,246,0.24)" },
        warn: { bg: "rgba(245,158,11,0.14)", color: tk.warn, border: "1px solid rgba(245,158,11,0.24)" },
        danger: { bg: "rgba(251,113,133,0.14)", color: tk.danger, border: "1px solid rgba(251,113,133,0.24)" },
        gray: { bg: "rgba(148,163,184,0.12)", color: tk.muted2, border: `1px solid ${tk.border2}` },
    };
    return (
        <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: tk.radiusLg, fontSize: "11px", fontWeight: 800, fontFamily: tk.mono, letterSpacing: "0.2px", ...vars[variant] }}>
            {children}
        </span>
    );
}

function StatCard({ label, value, color = tk.accent, icon }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            className="card-hover"
            style={{
                background: hov ? "linear-gradient(135deg, rgba(212,162,76,0.12) 0%, rgba(245,185,85,0.06) 100%)" : tk.surfaceGlass,
                border: `1px solid ${hov ? "rgba(212,162,76,0.28)" : tk.borderGlass}`,
                borderRadius: tk.radius,
                padding: "26px",
                cursor: "default",
                backdropFilter: "blur(14px)",
                boxShadow: hov ? `0 24px 60px rgba(2,6,23,.36)` : tk.shadowMd,
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div>
                    <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: tk.muted, marginBottom: "12px" }}>{label}</div>
                    <div style={{ fontSize: "42px", fontWeight: 900, color, letterSpacing: "-2px", lineHeight: 1, textShadow: `0 4px 18px ${color}22` }}>{value}</div>
                </div>
                <div style={{ fontSize: "32px", opacity: hov ? 0.45 : 0.25, transition: "opacity .2s" }}>{icon}</div>
            </div>
        </div>
    );
}

// ─── Toast system ─────────────────────────────────────────────────────────────
let _toastSetter = null;
function useToastSystem() {
    const [toasts, setToasts] = useState([]);
    _toastSetter = setToasts;
    return toasts;
}
function toast(msg, type = "success") {
    if (!_toastSetter) return;
    const id = Date.now();
    _toastSetter(p => [...p, { id, msg, type }]);
    setTimeout(() => _toastSetter(p => p.filter(t => t.id !== id)), 3600);
}

function ToastContainer({ toasts }) {
    const icons = { success: "✓", error: "✕", warn: "⚠" };
    const colors = { success: tk.accent, error: tk.danger, warn: tk.warn };
    return (
        <div style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none" }}>
            {toasts.map(t => (
                <div key={t.id} style={{ animation: "slideDown .32s cubic-bezier(.16,1,.3,1)", background: tk.surfaceGlass, border: `1px solid ${tk.borderGlass}`, borderLeft: `3px solid ${colors[t.type]}`, borderRadius: tk.radiusSm, padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: 500, minWidth: "300px", maxWidth: "420px", boxShadow: tk.shadowLg, pointerEvents: "auto", backdropFilter: "blur(14px)" }}>
                    <span style={{ color: colors[t.type], fontWeight: 900, fontSize: "16px" }}>{icons[t.type]}</span>
                    <span style={{ color: tk.text }}>{t.msg}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,.78)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .22s", backdropFilter: "blur(10px)" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: tk.surfaceGlass, border: `1px solid ${tk.borderGlass}`, borderRadius: "24px", padding: "32px", width: "520px", maxWidth: "95vw", animation: "fadeUp .28s cubic-bezier(.16,1,.3,1)", boxShadow: tk.shadowLg, backdropFilter: "blur(16px)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: tk.text, letterSpacing: "-0.4px" }}>{title}</h2>
                    <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: tk.muted2, fontSize: "22px", cursor: "pointer", padding: "4px 8px", borderRadius: tk.radiusSm, transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.color = tk.accent; e.currentTarget.style.background = "rgba(34,211,238,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.color = tk.muted2; e.currentTarget.style.background = "transparent"; }}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Webcam component ─────────────────────────────────────────────────────────
function WebcamFeed({ src, placeholder }) {
    return (
        <div style={{ position: "relative", background: "#020617", borderRadius: tk.radius, overflow: "hidden", border: `1px solid ${tk.border}`, aspectRatio: "4/3", boxShadow: tk.shadowSm }}>
            {src ? (
                <img src={src} alt="webcam" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px", color: tk.muted }}>
                    <div style={{ fontSize: "44px", opacity: 0.35, animation: "float 4s ease-in-out infinite" }}>⬡</div>
                    <p style={{ fontSize: "13px", color: tk.muted2 }}>{placeholder}</p>
                </div>
            )}
            {src && (
                <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(2,6,23,.6)", border: `1px solid rgba(255,255,255,.08)`, borderRadius: "999px", padding: "5px 10px", backdropFilter: "blur(10px)" }}>
                    <div style={{ width: "7px", height: "7px", background: tk.danger, borderRadius: "50%", animation: "pulse 1.2s infinite" }} />
                    <span style={{ fontSize: "11px", color: "#fff", fontWeight: 700, letterSpacing: "0.6px" }}>LIVE</span>
                </div>
            )}
        </div>
    );
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "⬡" },
    { id: "add", label: "Add Student", icon: "+" },
    { id: "attendance", label: "Take Attendance", icon: "◉" },
    { id: "edit", label: "Edit Students", icon: "✎" },
];

function Sidebar({ active, onNav, onHome }) {
    const [hovLogo, setHovLogo] = useState(false);
    return (
        <aside style={{ width: "250px", background: "linear-gradient(180deg, rgba(16,20,27,.98) 0%, rgba(13,17,23,.96) 100%)", borderRight: `1px solid ${tk.border}`, display: "flex", flexDirection: "column", padding: "28px 16px", gap: "4px", flexShrink: 0, minHeight: "100vh", boxShadow: "inset -1px 0 0 rgba(255,255,255,0.03)" }}>
            <button type="button" onClick={onHome} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 10px 34px", background: "none", border: "none", cursor: "pointer", transition: "all .2s ease" }} onMouseEnter={() => setHovLogo(true)} onMouseLeave={() => setHovLogo(false)}>
                <div style={{ width: "40px", height: "40px", background: tk.accentGradient, borderRadius: "12px", display: "grid", placeItems: "center", fontSize: "16px", fontWeight: 900, color: "#221400", boxShadow: "0 12px 28px rgba(212,162,76,0.28)", transform: hovLogo ? "scale(1.08)" : "scale(1)", transition: "transform .2s ease" }}>SA</div>
                <div style={{ opacity: hovLogo ? 0.8 : 1, transition: "opacity .2s ease" }}>
                    <div style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "-0.5px" }}>
                        <span style={{ color: "#ffffff" }}>Snap</span><span style={{ background: tk.blueGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Attend</span>
                    </div>
                    <div style={{ fontSize: "11px", color: tk.muted2, marginTop: "2px" }}>SnapAttend platform</div>
                </div>
            </button>

            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "1.5px", color: tk.muted, padding: "0 10px 8px", textTransform: "uppercase" }}>Navigation</div>

            {NAV.map(n => <NavItem key={n.id} n={n} isActive={active === n.id} onNav={onNav} />)}

            <div style={{ marginTop: "auto", padding: "16px 10px 0", borderTop: `1px solid ${tk.border}` }}>
                <div style={{ fontSize: "11px", color: tk.muted2, lineHeight: 1.7 }}>
                    SnapAttend v1.0
                </div>
            </div>
        </aside>
    );
}

function NavItem({ n, isActive, onNav }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            type="button"
            onClick={() => onNav(n.id)}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px",
                borderRadius: "14px", border: "1px solid transparent", fontFamily: tk.font, fontSize: "13px",
                fontWeight: isActive ? 700 : 600, cursor: "pointer", width: "100%", textAlign: "left",
                transition: "all .2s cubic-bezier(.16,1,.3,1)",
                background: isActive ? "rgba(34,211,238,0.1)" : hov ? "rgba(255,255,255,0.04)" : "transparent",
                color: isActive ? tk.accent : hov ? tk.text : tk.muted2,
                boxShadow: isActive ? "0 10px 20px rgba(34,211,238,0.08)" : "none",
            }}
        >
            <span style={{ width: "22px", textAlign: "center", fontSize: "16px", opacity: isActive ? 1 : 0.75 }}>{n.icon}</span>
            {n.label}
            {isActive && <div style={{ marginLeft: "auto", width: "7px", height: "7px", background: tk.accent, borderRadius: "50%", boxShadow: `0 0 0 4px ${tk.accentDim}` }} />}
        </button>
    );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────
function Dashboard({ onNav }) {
    const [stats, setStats] = useState({ students: "—", today: "—", model: "—" });
    const [att, setAtt] = useState([]);

    useEffect(() => {
        Promise.all([apiFetch("/api/students"), apiFetch("/api/attendance/today")]).then(([students, attendance]) => {
            setStats({ students: students.length, today: attendance.length, model: students.length >= 2 ? "Ready" : "Untrained" });
            setAtt(attendance);
        }).catch(() => {
            setStats({ students: "—", today: "—", model: "Offline" });
        });
    }, []);

    return (
        <div className="page-enter" style={{ padding: "40px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: "16px", marginBottom: "34px", flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "-1.2px", color: tk.text }}>Dashboard</h1>
                    <p style={{ color: tk.muted2, fontSize: "14px", marginTop: "6px" }}>Real-time overview of attendance, camera status, and system readiness.</p>
                </div>
                <Badge variant="warn">Live overview</Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "18px", marginBottom: "28px" }}>
                <StatCard label="Registered Students" value={stats.students} icon="👤" />
                <StatCard label="Present Today" value={stats.today} color={tk.blue} icon="✓" />
                <StatCard label="Model Status" value={stats.model} color={stats.model === "Ready" ? tk.accent : tk.warn} icon="◈" />
            </div>

            <Card style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "18px" }}>
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: tk.muted }}>Today's Attendance</div>
                        <div style={{ fontSize: "13px", color: tk.muted2, marginTop: "6px" }}>Most recent marked students</div>
                    </div>
                    <Btn variant="secondary" small onClick={() => onNav("attendance")}>Take Attendance →</Btn>
                </div>

                {att.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 24px", color: tk.muted, fontSize: "14px" }}>
                        <div style={{ fontSize: "42px", marginBottom: "12px", opacity: 0.22 }}>📋</div>
                        No attendance recorded yet today.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {att.map((r, i) => <AttItem key={i} r={r} />)}
                    </div>
                )}
            </Card>
        </div>
    );
}

function AttItem({ r }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: hov ? "rgba(255,255,255,0.04)" : tk.surface2, borderRadius: tk.radiusSm, border: `1px solid ${hov ? "rgba(34,211,238,0.18)" : tk.border}`, transition: "all .18s ease", cursor: "default" }}
        >
            <div style={{ width: "38px", height: "38px", background: tk.accentDim, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "14px", flexShrink: 0, color: tk.accent }}>🎓</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: tk.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.Name}</div>
                <div style={{ fontSize: "12px", color: tk.muted, fontFamily: tk.mono }}>{r.Enrollment}</div>
            </div>
            <div style={{ fontSize: "12px", color: tk.muted2, fontFamily: tk.mono, whiteSpace: "nowrap" }}>{r.Date}</div>
            <Badge variant="green">{r.Time}</Badge>
        </div>
    );
}

// ─── Add Student page ─────────────────────────────────────────────────────────
function AddStudent() {
    const [form, setForm] = useState({ name: "", enrollment: "", section: "", course: "", department: "" });
    const [camActive, setCamActive] = useState(false);
    const [captureCount, setCaptureCount] = useState(0);
    const [loading, setLoading] = useState("");

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    async function register() {
        if (!form.name || !form.enrollment) { toast("Name and Enrollment required", "warn"); return; }
        setLoading("Registering…");
        const res = await apiFetch("/api/students", { method: "POST", body: JSON.stringify(form) }).catch(() => ({ error: "Network error" }));
        setLoading("");
        if (res.error) { toast(res.error, "error"); return; }
        toast(res.message || "Student registered", "success");
    }

    async function startCam() {
        if (!form.enrollment) { toast("Enter enrollment number first", "warn"); return; }
        await apiFetch("/stop_camera", { method: "POST" }).catch(() => { });
        setCamActive(false);
        setTimeout(() => setCamActive(true), 200);
        setCaptureCount(0);
    }

    async function capture() {
        if (!form.enrollment) { toast("Enter enrollment first", "warn"); return; }
        const res = await apiFetch("/api/capture_face", { method: "POST", body: JSON.stringify({ enrollment: form.enrollment }) }).catch(() => ({ error: "Network error" }));
        if (res.error) { toast(res.error, "error"); return; }
        setCaptureCount(res.count);
        toast(res.message || "Captured", "success");
    }

    async function train() {
        setLoading("Training KNN model…");
        toast("Training model… please wait", "warn");
        const res = await apiFetch("/api/train", { method: "POST" }).catch(() => ({ error: "Network error" }));
        setLoading("");
        toast(res.message || "Training complete", res.ok ? "success" : "warn");
    }

    const progress = Math.min((captureCount / 20) * 100, 100);

    return (
        <div className="page-enter" style={{ padding: "40px" }}>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "-1.2px", color: tk.text }}>Add Student</h1>
                <p style={{ color: tk.muted2, fontSize: "14px", marginTop: "6px" }}>Register a new student and capture face images for training.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "24px" }}>
                <Card>
                    <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: tk.muted, marginBottom: "20px" }}>Student Details</div>
                    <Input label="Full Name *" id="add-name" placeholder="John Doe" value={form.name} onChange={set("name")} />
                    <Input label="Enrollment Number *" id="add-enr" placeholder="ENR001" value={form.enrollment} onChange={set("enrollment")} />
                    <Input label="Section" id="add-sec" placeholder="A" value={form.section} onChange={set("section")} />
                    <Input label="Course" id="add-course" placeholder="B.Tech CSE" value={form.course} onChange={set("course")} />
                    <Input label="Department" id="add-dept" placeholder="Computer Science" value={form.department} onChange={set("department")} />
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                        <Btn variant="secondary" onClick={startCam}>◉ Open Camera</Btn>
                        <Btn variant="primary" onClick={register} disabled={!!loading} className="btn-glow">
                            {loading === "Registering…" ? "Working…" : "+ Register"}
                        </Btn>
                    </div>
                </Card>

                <Card>
                    <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: tk.muted, marginBottom: "16px" }}>Face Capture</div>
                    <WebcamFeed src={camActive ? `${API}/video_feed/add/${form.enrollment}` : null} placeholder="Click Open Camera to start preview" />

                    <div style={{ marginTop: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                {camActive && <div style={{ width: "7px", height: "7px", background: tk.accent, borderRadius: "50%", animation: "pulse 1.2s infinite" }} />}
                                <span style={{ fontSize: "12px", color: tk.muted2, fontWeight: 700 }}>
                                    {captureCount} / 20 images
                                </span>
                            </div>
                            {captureCount >= 20 && <Badge variant="green">Ready to train</Badge>}
                        </div>
                        <div style={{ height: "5px", background: tk.surface3, borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${progress}%`, background: tk.accentGradient, borderRadius: "999px", transition: "width .3s" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                        <Btn variant="blue" onClick={capture} disabled={!camActive}>📸 Capture</Btn>
                        <Btn variant="primary" onClick={train} disabled={captureCount < 2 || !!loading}>
                            {loading === "Training KNN model…" ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid #04111f", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Training…
                                </span>
                            ) : "◈ Train Model"}
                        </Btn>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ─── Attendance page ──────────────────────────────────────────────────────────
function Attendance() {
    const [camActive, setCamActive] = useState(false);
    const [attList, setAttList] = useState([]);

    useEffect(() => { loadAtt(); }, []);

    async function loadAtt() {
        const data = await apiFetch("/api/attendance/today").catch(() => []);
        setAttList(data);
    }

    async function startCam() {
        await apiFetch("/stop_camera", { method: "POST" }).catch(() => { });
        setCamActive(false);
        setTimeout(() => setCamActive(true), 200);
    }

    async function stopCam() {
        await apiFetch("/stop_camera", { method: "POST" }).catch(() => { });
        setCamActive(false);
    }

    async function capture() {
        const res = await apiFetch("/api/attendance/capture", { method: "POST" }).catch(() => ({ error: "Network error" }));
        if (res.error) { toast(res.error, "error"); return; }
        res.records?.forEach(r => {
            if (r.status === "marked") toast(`Marked: ${r.name} (${r.enrollment})`, "success");
            else if (r.status === "already_marked") toast(`Already marked: ${r.name}`, "warn");
            else toast("Unknown face detected", "warn");
        });
        loadAtt();
    }

    return (
        <div className="page-enter" style={{ padding: "40px" }}>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "-1.2px", color: tk.text }}>Take Attendance</h1>
                <p style={{ color: tk.muted2, fontSize: "14px", marginTop: "6px" }}>Live face recognition with a cleaner, modern control panel.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "24px" }}>
                <Card>
                    <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: tk.muted, marginBottom: "16px" }}>Live Camera Feed</div>
                    <WebcamFeed src={camActive ? `${API}/video_feed/attendance` : null} placeholder="Click Start Camera to begin recognition" />
                    <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                        <Btn variant="secondary" onClick={startCam}>▶ Start</Btn>
                        <Btn variant="primary" onClick={capture} disabled={!camActive} style={{ flex: 1 }}>✓ Capture Attendance</Btn>
                        <Btn variant="danger" onClick={stopCam} disabled={!camActive}>■ Stop</Btn>
                    </div>

                    {camActive && (
                        <div style={{ marginTop: "14px", padding: "12px 14px", background: tk.accentDim, border: `1px solid ${tk.accentDim2}`, borderRadius: tk.radiusSm, fontSize: "12px", color: tk.accent, fontWeight: 600 }}>
                            ◉ Recognition active — faces detected will be labeled in real time.
                        </div>
                    )}
                </Card>

                <Card>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: tk.muted }}>Today's Record</div>
                            <div style={{ fontSize: "13px", color: tk.muted2, marginTop: "6px" }}>Students already marked today</div>
                        </div>
                        <Badge variant="blue">{attList.length} marked</Badge>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "420px", overflowY: "auto" }}>
                        {attList.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 0", color: tk.muted, fontSize: "13px" }}>
                                <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.22 }}>📋</div>
                                No attendance marked yet
                            </div>
                        ) : attList.map((r, i) => <AttItem key={i} r={r} />)}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ─── Edit Students page ───────────────────────────────────────────────────────
function EditStudents() {
    const [students, setStudents] = useState([]);
    const [query, setQuery] = useState("");
    const [editTarget, setEditTarget] = useState(null);
    const [delTarget, setDelTarget] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        const data = await apiFetch("/api/students").catch(() => []);
        setStudents(data);
        setLoading(false);
    }

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.enrollment.toLowerCase().includes(query.toLowerCase())
    );

    function openEdit(s) {
        setEditTarget(s.enrollment);
        setEditForm({ name: s.name, enrollment: s.enrollment, section: s.section || "", course: s.course || "", department: s.department || "" });
    }

    async function saveEdit() {
        const res = await apiFetch(`/api/students/${editTarget}`, {
            method: "PUT",
            body: JSON.stringify({ ...editForm, new_enrollment: editForm.enrollment }),
        }).catch(() => ({ error: "Network error" }));
        if (res.error) { toast(res.error, "error"); return; }
        toast("Student updated", "success");
        setEditTarget(null);
        load();
    }

    async function confirmDelete() {
        const res = await apiFetch(`/api/students/${delTarget}`, { method: "DELETE" }).catch(() => ({ error: "Network error" }));
        if (res.error) { toast(res.error, "error"); return; }
        toast("Student deleted and model retrained", "success");
        setDelTarget(null);
        load();
    }

    const setEF = (k) => (e) => setEditForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="page-enter" style={{ padding: "40px" }}>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "-1.2px", color: tk.text }}>Edit Students</h1>
                <p style={{ color: tk.muted2, fontSize: "14px", marginTop: "6px" }}>Search, edit, or remove registered students.</p>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "380px" }}>
                    <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: tk.muted, fontSize: "15px" }}>⌕</span>
                    <input
                        placeholder="Search name or enrollment…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{ width: "100%", padding: "11px 14px 11px 36px", background: tk.surfaceGlass, border: `1px solid ${tk.borderGlass}`, borderRadius: tk.radiusSm, color: tk.text, fontSize: "14px", outline: "none", backdropFilter: "blur(10px)" }}
                    />
                </div>
                <Btn variant="secondary" onClick={load}>↻ Refresh</Btn>
                <Badge variant="gray">{filtered.length} students</Badge>
            </div>

            <div style={{ border: `1px solid ${tk.borderGlass}`, borderRadius: tk.radius, overflow: "hidden", background: tk.surfaceGlass, backdropFilter: "blur(12px)", boxShadow: tk.shadowMd }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                    <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                            {["Name", "Enrollment", "Section", "Course", "Department", "Images", "Actions"].map(h => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: tk.muted, borderBottom: `1px solid ${tk.border}` }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: tk.muted }}>Loading…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: tk.muted }}>No students found.</td></tr>
                        ) : filtered.map(s => <StudentRow key={s.enrollment} s={s} onEdit={openEdit} onDel={setDelTarget} />)}
                    </tbody>
                </table>
            </div>

            <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="✎ Edit Student">
                <Input label="Full Name" id="e-name" placeholder="Name" value={editForm.name || ""} onChange={setEF("name")} />
                <Input label="Enrollment" id="e-enr" placeholder="Enrollment" value={editForm.enrollment || ""} onChange={setEF("enrollment")} />
                <Input label="Section" id="e-sec" placeholder="Section" value={editForm.section || ""} onChange={setEF("section")} />
                <Input label="Course" id="e-course" placeholder="Course" value={editForm.course || ""} onChange={setEF("course")} />
                <Input label="Department" id="e-dept" placeholder="Department" value={editForm.department || ""} onChange={setEF("department")} />
                <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                    <Btn variant="primary" onClick={saveEdit}>💾 Save Changes</Btn>
                    <Btn variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Btn>
                </div>
            </Modal>

            <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="🗑 Confirm Delete">
                <p style={{ color: tk.muted2, fontSize: "14px", marginBottom: "20px", lineHeight: 1.7 }}>
                    This will permanently remove <strong style={{ color: tk.text }}>{delTarget}</strong> from the database, delete all face images, and retrain the KNN model.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Btn variant="danger" onClick={confirmDelete}>Yes, Delete</Btn>
                    <Btn variant="secondary" onClick={() => setDelTarget(null)}>Cancel</Btn>
                </div>
            </Modal>
        </div>
    );
}

function StudentRow({ s, onEdit, onDel }) {
    const [hov, setHov] = useState(false);
    return (
        <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: hov ? "rgba(255,255,255,0.03)" : "transparent", transition: "background .12s" }}>
            <td style={{ padding: "13px 16px", borderBottom: `1px solid ${tk.border}`, fontWeight: 700, color: tk.text }}>{s.name}</td>
            <td style={{ padding: "13px 16px", borderBottom: `1px solid ${tk.border}` }}>
                <span style={{ fontFamily: tk.mono, fontSize: "12px", color: tk.accent }}>{s.enrollment}</span>
            </td>
            <td style={{ padding: "13px 16px", borderBottom: `1px solid ${tk.border}`, color: tk.muted2 }}>{s.section || "—"}</td>
            <td style={{ padding: "13px 16px", borderBottom: `1px solid ${tk.border}`, color: tk.muted2 }}>{s.course || "—"}</td>
            <td style={{ padding: "13px 16px", borderBottom: `1px solid ${tk.border}`, color: tk.muted2 }}>{s.department || "—"}</td>
            <td style={{ padding: "13px 16px", borderBottom: `1px solid ${tk.border}` }}>
                <Badge variant={s.image_count >= 10 ? "green" : "warn"}>{s.image_count || 0} imgs</Badge>
            </td>
            <td style={{ padding: "13px 16px", borderBottom: `1px solid ${tk.border}` }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Btn variant="secondary" small onClick={() => onEdit(s)}>✎ Edit</Btn>
                    <Btn variant="danger" small onClick={() => onDel(s.enrollment)}>✕ Del</Btn>
                </div>
            </td>
        </tr>
    );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App({ onHome }) {
    injectGlobalStyles();
    const [page, setPage] = useState("dashboard");
    const toasts = useToastSystem();

    async function navigate(p) {
        if (p !== "attendance") {
            await apiFetch("/stop_camera", { method: "POST" }).catch(() => { });
        }
        setPage(p);
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: tk.bg }}>
            <Sidebar active={page} onNav={navigate} onHome={onHome} />
            <main style={{ flex: 1, overflowY: "auto" }}>
                {page === "dashboard" && <Dashboard onNav={navigate} />}
                {page === "add" && <AddStudent />}
                {page === "attendance" && <Attendance />}
                {page === "edit" && <EditStudents />}
            </main>
            <ToastContainer toasts={toasts} />
        </div>
    );
}