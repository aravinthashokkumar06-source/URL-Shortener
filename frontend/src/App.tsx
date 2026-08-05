import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import { apiService, UrlItem, UrlAnalytics } from "./services/api";

// --- Helper Functions ---
function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const day = d.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
    return `${days[d.getDay()]} ${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function truncate(str: string, n: number): string {
    return str.length > n ? str.slice(0, n) + "…" : str;
}

// --- Toast Component for Notifications ---
function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bg = type === "success" ? "#27ae60" : type === "error" ? "#c0392b" : "#2980b9";

    return (
        <div style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: bg,
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "slideIn 0.3s ease-out"
        }}>
            <span>{message}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", padding: 0 }}>×</button>
        </div>
    );
}

// --- Confirmation Dialog ---
function ConfirmDialog({
    title,
    message,
    onConfirm,
    onCancel,
    danger,
}: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 400, width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
                <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "#222" }}>{title}</h3>
                <p style={{ margin: "0 0 20px", fontSize: 14, color: "#555", lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onCancel} style={{ padding: "8px 16px", border: "1px solid #ddd", background: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 14, color: "#555" }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: "8px 16px", border: "none", background: danger ? "#c0392b" : "#2980b9", color: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Confirm</button>
                </div>
            </div>
        </div>
    );
}

// --- HOME PAGE COMPONENT ---
function HomePage() {
    // Data States
    const [urls, setUrls] = useState<UrlItem[]>([]);
    const [chartUrls, setChartUrls] = useState<UrlItem[]>([]);
    const [inputUrl, setInputUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Feedback States
    const [validationError, setValidationError] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
        setToast({ message, type });
    }, []);

    // Fetch Table Data (Paginated)
    const fetchUrls = useCallback(async (page: number, size: number) => {
        setTableLoading(true);
        try {
            const data = await apiService.getRecentUrls(page, size);
            setUrls(data.content);
            setTotalPages(data.totalPages);
        } catch (err: any) {
            showToast("Failed to retrieve URLs.", "error");
        } finally {
            setTableLoading(false);
        }
    }, [showToast]);

    // Fetch Chart Data (All URLs up to 100)
    const fetchChartData = useCallback(async () => {
        try {
            const data = await apiService.getRecentUrls(0, 100);
            setChartUrls(data.content);
        } catch (err) {}
    }, []);

    useEffect(() => {
        fetchUrls(currentPage, pageSize);
    }, [currentPage, pageSize, fetchUrls]);

    useEffect(() => {
        fetchChartData();
    }, [urls, fetchChartData]);

    // Shorten URL Handler
    const handleShorten = async () => {
        setValidationError("");
        const trimmed = inputUrl.trim();
        if (!trimmed) {
            setValidationError("URL cannot be empty.");
            return;
        }
        // Basic URL validation pattern
        const pattern = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
        if (!pattern.test(trimmed)) {
            setValidationError("Please enter a valid HTTP or HTTPS URL.");
            return;
        }

        setIsLoading(true);
        try {
            await apiService.shortenUrl(trimmed);
            setInputUrl("");
            showToast("URL shortened successfully!", "success");
            setCurrentPage(0);
            fetchUrls(0, pageSize);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Error shortening URL. Please try again.";
            showToast(msg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Copy to Clipboard
    const handleCopy = (shortUrl: string, code: string) => {
        navigator.clipboard.writeText(shortUrl)
            .then(() => {
                setCopiedCode(code);
                showToast("Shortened URL copied to clipboard!", "success");
                setTimeout(() => setCopiedCode(null), 2000);
            })
            .catch(() => showToast("Failed to copy URL.", "error"));
    };

    // Delete URL Handler
    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await apiService.deleteUrl(confirmDeleteId);
            showToast("URL deleted successfully.", "success");
            setConfirmDeleteId(null);
            fetchUrls(currentPage, pageSize);
        } catch (err) {
            showToast("Failed to delete URL.", "error");
        }
    };

    // --- Chart Prep logic ---
    const dateMap: Record<string, { clicks: number; creations: number }> = {};
    chartUrls.forEach((u) => {
        const d = u.createdAt.slice(0, 10);
        if (!dateMap[d]) dateMap[d] = { clicks: 0, creations: 0 };
        dateMap[d].creations++;
        dateMap[d].clicks += u.clickCount;
    });

    const sortedDates = Object.keys(dateMap).sort().slice(-10);
    const chartClicks = sortedDates.map(d => dateMap[d].clicks);
    const chartCreations = sortedDates.map(d => dateMap[d].creations);
    const chartMax = Math.max(...chartClicks, ...chartCreations, 1);
    const chartH = 220, chartW = 700, padL = 36, padR = 16, padT = 20, padB = 40;
    const innerW = chartW - padL - padR, innerH = chartH - padT - padB;
    const n = sortedDates.length;

    function bW() { return (innerW / Math.max(n, 1)) * 0.35; }
    function yPos(v: number) { return padT + innerH - (v / chartMax) * innerH; }
    function fmtDateShort(d: string) {
        const dt = new Date(d + "T00:00:00Z");
        return `${dt.getUTCDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.getUTCMonth()]}`;
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#1e293b", fontFamily: "'Inter', system-ui, sans-serif" }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {confirmDeleteId !== null && (
                <ConfirmDialog
                    title="Delete URL?"
                    message="This will delete the shortened URL and all of its analytics history permanently."
                    danger
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}

            {/* Header */}
            <header style={{ background: "#ffffff", padding: "16px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    Easy URL Shortener
                </span>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>V1.0 - Production Ready</span>
            </header>

            {/* Hero/Banner */}
            <section style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", padding: "64px 24px", textAlign: "center", color: "#ffffff" }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.025em" }}>Simplify your URL</h1>
                <p style={{ color: "#93c5fd", fontSize: 16, margin: "0 0 32px" }}>Paste your long URL below to generate a shorter and shareable link.</p>

                <div style={{ maxWidth: 640, margin: "0 auto" }}>
                    <div style={{ display: "flex", background: "#ffffff", borderRadius: 8, overflow: "hidden", padding: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => { setInputUrl(e.target.value); setValidationError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                            placeholder="Paste a link here (http:// or https://)..."
                            disabled={isLoading}
                            style={{ flex: 1, border: "none", padding: "14px 18px", fontSize: 15, outline: "none", color: "#334155" }}
                        />
                        <button
                            onClick={handleShorten}
                            disabled={isLoading}
                            style={{
                                background: "#1d4ed8",
                                color: "#ffffff",
                                border: "none",
                                padding: "12px 24px",
                                borderRadius: 6,
                                cursor: isLoading ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                fontSize: 15,
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: 8
                            }}
                        >
                            {isLoading ? (
                                <span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                            ) : "Shorten URL"}
                        </button>
                    </div>
                    {validationError && (
                        <div style={{ color: "#fca5a5", marginTop: 12, fontSize: 14, fontWeight: 500, textAlign: "left", paddingLeft: 8 }}>
                            ⚠️ {validationError}
                        </div>
                    )}
                </div>
            </section>

            {/* Content Container */}
            <main style={{ maxWidth: 1024, margin: "0 auto", padding: "40px 24px" }}>

                {/* Table Header / Page Size selector */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Recent Shortened URLs</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
                        <span>Show</span>
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
                            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", outline: "none", background: "#fff" }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                        <span>entries</span>
                    </div>
                </div>

                {/* Recent URLs Table */}
                <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: 20 }}>
                    {tableLoading ? (
                        <div style={{ padding: "64px", textAlign: "center", color: "#64748b" }}>
                            <span style={{ width: 24, height: 24, border: "3px solid #1d4ed8", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                            <div style={{ marginTop: 8, fontSize: 14 }}>Loading URLs...</div>
                        </div>
                    ) : urls.length === 0 ? (
                        <div style={{ padding: "64px 24px", textAlign: "center", color: "#64748b" }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ margin: "0 auto 12px" }}><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>
                            <div style={{ fontSize: 15, fontWeight: 500 }}>No URLs shortened yet. Create one above!</div>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "14px 20px", fontWeight: 600, color: "#475569" }}>Original URL</th>
                                        <th style={{ padding: "14px 20px", fontWeight: 600, color: "#475569" }}>Short URL</th>
                                        <th style={{ padding: "14px 10px", fontWeight: 600, color: "#475569", width: 90 }}>Actions</th>
                                        <th style={{ padding: "14px 20px", fontWeight: 600, color: "#475569" }}>Created Date</th>
                                        <th style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", textAlign: "center" }}>Clicks</th>
                                        <th style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", textAlign: "center", width: 140 }}>Analytics</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {urls.map((url, index) => (
                                        <tr key={url.id} style={{ borderBottom: "1px solid #f1f5f9", background: index % 2 === 0 ? "#ffffff" : "#fdfdfd", transition: "background 0.2s" }}>
                                            <td style={{ padding: "16px 20px", maxWidth: 260 }}>
                                                <a href={url.originalUrl} target="_blank" rel="noreferrer" title={url.originalUrl} style={{ color: "#334155", textDecoration: "none", fontWeight: 500, wordBreak: "break-all" }}>
                                                    {truncate(url.originalUrl, 50)}
                                                </a>
                                            </td>
                                            <td style={{ padding: "16px 20px" }}>
                                                <a href={url.shortUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                                                    {url.shortUrl}
                                                </a>
                                            </td>
                                            <td style={{ padding: "16px 10px" }}>
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <button onClick={() => handleCopy(url.shortUrl, url.shortCode)} title="Copy URL" style={{ background: copiedCode === url.shortCode ? "#10b981" : "#eff6ff", color: copiedCode === url.shortCode ? "#fff" : "#1d4ed8", border: "none", borderRadius: 6, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        {copiedCode === url.shortCode ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                        )}
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteId(url.id)} title="Delete URL" style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px 20px", color: "#64748b", whiteSpace: "nowrap" }}>
                                                {new Date(url.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: 700, color: "#1e293b" }}>
                                                {url.clickCount}
                                            </td>
                                            <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                                <Link to={`/analytics/${url.id}`} style={{ background: "#f1f5f9", color: "#475569", border: "none", textDecoration: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                                                    Analytics
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 40 }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", background: currentPage === 0 ? "#f1f5f9" : "#fff", cursor: currentPage === 0 ? "not-allowed" : "pointer", borderRadius: 6, color: "#475569", fontSize: 13 }}
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPage(idx)}
                                style={{
                                    padding: "8px 14px",
                                    border: "1px solid " + (idx === currentPage ? "#1d4ed8" : "#cbd5e1"),
                                    background: idx === currentPage ? "#1d4ed8" : "#fff",
                                    color: idx === currentPage ? "#fff" : "#475569",
                                    cursor: "pointer",
                                    borderRadius: 6,
                                    fontWeight: idx === currentPage ? 700 : 400,
                                    fontSize: 13
                                }}
                            >
                                {idx + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage === totalPages - 1}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", background: currentPage === totalPages - 1 ? "#f1f5f9" : "#not-allowed", cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer", borderRadius: 6, color: "#475569", fontSize: 13 }}
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Statistics Dashboard */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Dashboard Statistics</h3>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>Visual representation of URL activity over the last 10 days.</p>

                    {chartUrls.length === 0 ? (
                        <div style={{ textAlign: "center", color: "#94a3b8", padding: "48px 0" }}>No data to generate charts.</div>
                    ) : (
                        <div>
                            {/* Legends */}
                            <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 20, fontSize: 13 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ display: "inline-block", width: 16, height: 16, background: "rgba(59, 130, 246, 0.15)", border: "2px solid #3b82f6", borderRadius: 4 }}></span>URL Clicks
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ display: "inline-block", width: 16, height: 16, background: "#1d4ed8", borderRadius: 4 }}></span>URL Creations
                                </span>
                            </div>

                            {/* Custom SVG Charts */}
                            <div style={{ overflowX: "auto" }}>
                                <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", minWidth: 600, height: "auto", display: "block" }}>
                                    {/* Grid Lines */}
                                    {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                                        const y = padT + innerH * frac;
                                        return (
                                            <g key={i}>
                                                <line x1={padL} x2={chartW - padR} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />
                                                <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">{Math.round(chartMax * (1 - frac))}</text>
                                            </g>
                                        );
                                    })}

                                    {/* Bar Chart: URL Creations */}
                                    {sortedDates.map((_d, i) => {
                                        const x = padL + ((i + 0.3) / Math.max(n, 1)) * innerW;
                                        const v = chartCreations[i];
                                        const h = (v / chartMax) * innerH;
                                        return <rect key={i} x={x} y={padT + innerH - h} width={bW()} height={h} fill="#1d4ed8" rx="2" />;
                                    })}

                                    {/* Line Chart: URL Clicks */}
                                    {n > 1 && (() => {
                                        const pts = sortedDates.map((_d, i) => [padL + ((i + 0.5) / n) * innerW, yPos(chartClicks[i])]);
                                        const area = `M${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map(p => `L${p[0]},${p[1]}`).join(" ") + ` L${pts[pts.length - 1][0]},${padT + innerH} L${pts[0][0]},${padT + innerH} Z`;
                                        const linePath = `M${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map(p => `L${p[0]},${p[1]}`).join(" ");
                                        return (
                                            <g>
                                                <path d={area} fill="rgba(59, 130, 246, 0.08)" />
                                                <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
                                                {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill="#3b82f6" stroke="#fff" strokeWidth="2" />)}
                                            </g>
                                        );
                                    })()}

                                    {/* X-axis labels */}
                                    {sortedDates.map((d, i) => (
                                        <text key={i} x={padL + ((i + 0.5) / Math.max(n, 1)) * innerW} y={chartH - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="500">{fmtDateShort(d)}</text>
                                    ))}

                                    <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="#cbd5e1" strokeWidth="1" />
                                    <line x1={padL} x2={chartW - padR} y1={padT + innerH} y2={padT + innerH} stroke="#cbd5e1" strokeWidth="1" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Overall Summary Cards */}
                    <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                        {[
                            ["Total Shortened", chartUrls.length],
                            ["Total Clicks Recorded", chartUrls.reduce((s, u) => s + u.clickCount, 0)],
                            ["Most Visited URL Clicks", chartUrls.length ? Math.max(...chartUrls.map(u => u.clickCount)) : 0]
                        ].map(([label, val]) => (
                            <div key={label} style={{ flex: "1 1 180px", background: "#f8fafc", borderRadius: 8, padding: "16px 20px", border: "1px solid #f1f5f9" }}>
                                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{val}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>

            {/* Keyframes style */}
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}

// --- ANALYTICS PAGE COMPONENT ---
function AnalyticsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<UrlAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
        setToast({ message, type });
    }, []);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await apiService.getAnalytics(Number(id));
                setAnalytics(data);
            } catch (err) {
                showToast("Failed to retrieve analytics details.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [id, showToast]);

    if (loading) {
        return (
            <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
                <div style={{ textAlign: "center", color: "#64748b" }}>
                    <span style={{ width: 32, height: 32, border: "3px solid #1d4ed8", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                    <div style={{ marginTop: 12, fontSize: 15, fontWeight: 500 }}>Loading analytics...</div>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter', sans-serif", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 16, color: "#64748b" }}>Analytics profile not found.</div>
                <button onClick={() => navigate("/")} style={{ padding: "10px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Back to Dashboard</button>
            </div>
        );
    }

    // Chart logic for clicks over time specifically for this URL
    const clickMap: Record<string, number> = {};
    analytics.clickHistory.forEach(event => {
        const d = event.clickedAt.slice(0, 10);
        clickMap[d] = (clickMap[d] || 0) + 1;
    });

    const sortedClickDates = Object.keys(clickMap).sort().slice(-7);
    const chartUrlClicks = sortedClickDates.map(d => clickMap[d]);
    const maxClicksSingleDay = Math.max(...chartUrlClicks, 1);

    const chartW = 700, chartH = 200, padL = 36, padR = 16, padT = 16, padB = 40;
    const innerW = chartW - padL - padR, innerH = chartH - padT - padB;
    const n = sortedClickDates.length;

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#1e293b", fontFamily: "'Inter', system-ui, sans-serif", padding: "40px 24px" }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <div style={{ marginBottom: 24 }}>
                    <button onClick={() => navigate("/")} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#475569", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                        ← Back to Dashboard
                    </button>
                </div>

                {/* Info Card */}
                <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>URL Analytics Details</h1>
                            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>ID: {analytics.id} • Created on {formatDate(analytics.createdAt)}</span>
                        </div>
                        <div style={{ background: "#dbeafe", color: "#1d4ed8", padding: "6px 14px", borderRadius: 9999, fontWeight: 700, fontSize: 14 }}>
                            {analytics.clickCount} Clicks Total
                        </div>
                    </div>

                    <div style={{ display: "grid", gap: 16, background: "#f8fafc", borderRadius: 8, padding: 18, border: "1px solid #f1f5f9", fontSize: 14 }}>
                        <div>
                            <span style={{ fontWeight: 600, color: "#475569", display: "block", marginBottom: 2 }}>Original URL</span>
                            <a href={analytics.originalUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500, wordBreak: "break-all" }}>
                                {analytics.originalUrl}
                            </a>
                        </div>
                        <div>
                            <span style={{ fontWeight: 600, color: "#475569", display: "block", marginBottom: 2 }}>Short URL</span>
                            <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/${analytics.shortCode}`} target="_blank" rel="noreferrer" style={{ color: "#16a34a", textDecoration: "none", fontWeight: 700 }}>
                                {`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/${analytics.shortCode}`}
                            </a>
                        </div>
                        {analytics.lastAccessedAt && (
                            <div>
                                <span style={{ fontWeight: 600, color: "#475569", display: "block", marginBottom: 2 }}>Last Click Timestamp</span>
                                <span style={{ color: "#334155" }}>{formatDate(analytics.lastAccessedAt)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Click Activity Chart */}
                <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>Click Frequency History</h2>

                    {analytics.clickHistory.length === 0 ? (
                        <div style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0", fontSize: 14 }}>No clicks recorded yet. Click the short URL to trigger analytics tracking.</div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", minWidth: 500, height: "auto", display: "block" }}>
                                {[0, 0.5, 1].map((frac, i) => {
                                    const y = padT + innerH * frac;
                                    return (
                                        <g key={i}>
                                            <line x1={padL} x2={chartW - padR} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />
                                            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">{Math.round(maxClicksSingleDay * (1 - frac))}</text>
                                        </g>
                                    );
                                })}

                                {n > 1 && (() => {
                                    const pts = sortedClickDates.map((_d, i) => [padL + ((i + 0.5) / n) * innerW, padT + innerH - (clickMap[_d] / maxClicksSingleDay) * innerH]);
                                    const pathD = `M${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map(p => `L${p[0]},${p[1]}`).join(" ");
                                    return (
                                        <g>
                                            <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
                                            {pts.map(([x, y], i) => (
                                                <g key={i}>
                                                    <circle cx={x} cy={y} r={4} fill="#2563eb" stroke="#fff" strokeWidth="2" />
                                                    <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fill="#1e293b" fontWeight="700">{clickMap[sortedClickDates[i]]}</text>
                                                </g>
                                            ))}
                                        </g>
                                    );
                                })()}

                                {sortedClickDates.map((d, i) => (
                                    <text key={i} x={padL + ((i + 0.5) / Math.max(n, 1)) * innerW} y={chartH - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="500">
                                        {d.slice(5)}
                                    </text>
                                ))}

                                <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="#cbd5e1" />
                                <line x1={padL} x2={chartW - padR} y1={padT + innerH} y2={padT + innerH} stroke="#cbd5e1" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Click History Log */}
                <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>Raw Click Event Log</h2>
                    {analytics.clickHistory.length === 0 ? (
                        <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "20px 0" }}>No clicks recorded.</div>
                    ) : (
                        <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                            {analytics.clickHistory.slice().reverse().map((e, index) => (
                                <div key={index} style={{ padding: "12px 18px", borderBottom: index === analytics.clickHistory.length - 1 ? "none" : "1px solid #f1f5f9", fontSize: 13, color: "#334155", display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontWeight: 600, color: "#94a3b8" }}>#{analytics.clickHistory.length - index}</span>
                                    <span style={{ fontWeight: 500 }}>{new Date(e.clickedAt).toLocaleString()}</span>
                                    <span style={{ color: "#16a34a", fontWeight: 600 }}>Active Redirect ✓</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// --- APP ENTRY POINT WITH ROUTER ---
export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/analytics/:id" element={<AnalyticsPage />} />
            </Routes>
        </Router>
    );
}
export { };
