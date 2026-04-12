import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAdminDashboard } from "../../lib/adminDashboardController";
import {
  fetchAuditLogs,
  AuditLogRow,
  AuditSource,
  isAllowedAccess,
  actionLabel,
  describeLine,
  diffFields,
  getRestoreAction,
  getRestoreDescription,
  restoreAuditEntry,
} from "../../lib/auditLogController";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const ACTION_COLOURS: Record<string, string> = {
  INSERT: "#22c55e",
  CREATE: "#22c55e",
  UPDATE: "#6366f1",
  DELETE: "#ef4444",
  INVOKE: "#f59e0b",
  LOGIN: "#06b6d4",
  LOGOUT: "#f97316",
};

const SOURCE_LABELS: Record<AuditSource, { label: string; colour: string }> = {
  dashboard: { label: "Dashboard", colour: "#6366f1" },
  edge_function: { label: "Edge Function", colour: "#f59e0b" },
  public: { label: "Public", colour: "#06b6d4" },
  system: { label: "System", colour: "#64748b" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function avatarInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const AdminCMSAuditLog: React.FC = () => {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    isAllowedAccess()
      .then((r) => mounted && (setAllowed(r), setLoading(false)))
      .catch(() => mounted && (setAllowed(false), setLoading(false)));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <>
        <Header />
        <div className="p-8 text-center text-gray-400">Checking access…</div>
        <Footer />
      </>
    );

  return allowed ? (
    <AuditLog />
  ) : (
    <>
      <Header />
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold">Access Denied</h1>
      </div>
      <Footer />
    </>
  );
};

export default AdminCMSAuditLog;

const AuditLog: React.FC = () => {
  const { loading: authLoading, authorized } = useAdminDashboard();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterSource, setFilterSource] = useState<AuditSource | "all">("all");
  const [filterActor, setFilterActor] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const refreshLogs = useCallback(() => {
    setLoading(true);
    setPage(0);
    fetchAuditLogs(0)
      .then(({ rows, hasMore: more }) => {
        setLogs(rows);
        setHasMore(more);
        setError(null);
      })
      .catch((e) => setError(e.message || "Failed to fetch audit logs"))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchAuditLogs(nextPage)
      .then(({ rows, hasMore: more }) => {
        setLogs((prev) => [...prev, ...rows]);
        setPage(nextPage);
        setHasMore(more);
      })
      .catch((e) => setError(e.message || "Failed to load more logs"))
      .finally(() => setLoadingMore(false));
  }, [page, hasMore, loadingMore]);

  useEffect(() => {
    if (!authorized) return;
    refreshLogs();
  }, [authorized, refreshLogs]);

  useEffect(() => {
    if (loading || error || logs.length === 0) return;

    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, loading, error, logs.length]);

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs]);
  const uniqueSources = useMemo(
    () => Array.from(new Set(logs.map((l) => l.source))) as AuditSource[],
    [logs],
  );
  const uniqueActors = useMemo(() => Array.from(new Set(logs.map((l) => l.actor))), [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterAction !== "all" && log.action !== filterAction) return false;
      if (filterSource !== "all" && log.source !== filterSource) return false;
      if (filterActor !== "all" && log.actor !== filterActor) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          log.actor,
          log.target_table,
          log.action,
          String(log.target_id),
          log.function_name ?? "",
          log.ip_address,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, filterAction, filterSource, filterActor, search]);

  if (authLoading)
    return (
      <>
        <Header />
        <div className="p-8 text-center text-gray-400">Checking authorization…</div>
        <Footer />
      </>
    );

  if (!authorized)
    return (
      <>
        <Header />
        <div className="p-8 text-center">
          <p className="text-pink-500">You are not authorized to view this page.</p>
        </div>
        <Footer />
      </>
    );

  return (
    <>
      <Header />
      <div className="mx-auto mt-12 max-w-6xl px-4 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">DEVS Audit Log</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredLogs.length} of {logs.length} entries &middot; Confidential
          </p>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowStats((p) => !p)}
            className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {showStats ? "Hide Statistics ▲" : "Show Statistics ▼"}
          </button>
        </div>

        {showStats && logs.length > 0 && <AuditStats logs={logs} />}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search actor, table, action, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-50 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
          />

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>
                {actionLabel(a)}
              </option>
            ))}
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as AuditSource | "all")}
            className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]?.label ?? s}
              </option>
            ))}
          </select>

          <select
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Actors</option>
            {uniqueActors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-700 bg-red-900/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {loading && <p className="py-12 text-center text-gray-400">Loading audit entries…</p>}

        {!loading && !error && (
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <p className="py-12 text-center text-gray-500">No matching audit entries.</p>
            ) : (
              <>
                {filteredLogs.map((log) => (
                  <AuditEntry
                    key={log.id}
                    log={log}
                    expanded={expandedId === log.id}
                    onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    onRestoreComplete={refreshLogs}
                  />
                ))}
                <div ref={sentinelRef} className="py-4 text-center text-xs text-gray-500">
                  {loadingMore ? "Loading more…" : hasMore ? "" : `All ${logs.length} entries loaded`}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export { AuditLog };

interface AuditEntryProps {
  log: AuditLogRow;
  expanded: boolean;
  onToggle: () => void;
  onRestoreComplete: () => void;
}

const AuditEntry: React.FC<AuditEntryProps> = ({ log, expanded, onToggle, onRestoreComplete }) => {
  const changes = useMemo(() => diffFields(log.target_old, log.target_new), [log]);
  const sourceInfo = SOURCE_LABELS[log.source] ?? SOURCE_LABELS.dashboard;

  const restoreAction = getRestoreAction(log);
  const restoreInfo = restoreAction ? getRestoreDescription(restoreAction) : null;
  const [showConfirm, setShowConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const handleRestore = async () => {
    setRestoring(true);
    setRestoreError(null);
    try {
      await restoreAuditEntry(log);
      setRestoreSuccess(true);
      setShowConfirm(false);
      setTimeout(() => {
        setRestoreSuccess(false);
        onRestoreComplete();
      }, 1500);
    } catch (e: unknown) {
      setRestoreError(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div
      className={`rounded-lg border transition-colors ${
        expanded ? "border-indigo-500/60 bg-gray-800" : "border-gray-700 bg-gray-800/60 hover:border-gray-500"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{
            backgroundColor:
              log.source === "edge_function"
                ? "#f59e0b"
                : log.source === "system"
                  ? "#64748b"
                  : log.source === "public"
                    ? "#06b6d4"
                    : "#6366f1",
          }}
          title={log.actor}
        >
          {log.source === "edge_function"
            ? "EF"
            : log.source === "public"
              ? "PU"
              : avatarInitials(log.actor)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">
            <span className="font-semibold text-white">{log.actor}</span>{" "}
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: ACTION_COLOURS[log.action] ?? "#555" }}
            >
              {actionLabel(log.action)}
            </span>{" "}
            {log.source === "edge_function" && log.function_name ? (
              <span className="text-amber-300 font-mono text-xs">{log.function_name}</span>
            ) : log.target_table ? (
              <>
                <span className="text-gray-300">
                  {log.target_id ? `row ${log.target_id}` : ""}
                </span>{" "}
                <span className="text-gray-400">in</span>{" "}
                <span className="font-mono text-indigo-300 text-xs">{log.target_table}</span>
              </>
            ) : null}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
            <span title={new Date(log.created_at).toLocaleString()}>
              {timeAgo(log.created_at)}
            </span>
            <span className="text-gray-600">&middot;</span>
            <span
              className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
              style={{ borderColor: sourceInfo.colour, color: sourceInfo.colour }}
            >
              {sourceInfo.label}
            </span>
            {log.actor_team && (
              <>
                <span className="text-gray-600">&middot;</span>
                <span>{log.actor_team}</span>
              </>
            )}
            {log.ip_address && (
              <>
                <span className="text-gray-600">&middot;</span>
                <span className="font-mono">{log.ip_address}</span>
              </>
            )}
          </div>
        </div>

        <span className="mt-1 shrink-0 text-gray-500 text-xs select-none">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-700 px-4 py-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <MetaField label="Timestamp" value={new Date(log.created_at).toLocaleString()} />
            <MetaField label="Auth ID" value={log.auth_id ?? "N/A"} mono />
            <MetaField label="Source" value={`${sourceInfo.label}${log.function_name ? ` — ${log.function_name}` : ""}`} />
            <MetaField label="Action" value={`${log.action} (${actionLabel(log.action)})`} />
            <MetaField label="IP Address" value={log.ip_address || "N/A"} mono />
            <MetaField label="User Agent" value={log.user_agent || "N/A"} />
          </div>

          {changes.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                What Changed
              </h4>
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-700/60 text-gray-300">
                      <th className="px-3 py-2 text-left font-semibold">Field</th>
                      <th className="px-3 py-2 text-left font-semibold">Before</th>
                      <th className="px-3 py-2 text-left font-semibold">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((c) => (
                      <tr key={c.key} className="border-t border-gray-700/50">
                        <td className="px-3 py-1.5 font-mono text-indigo-300">{c.key}</td>
                        <td className="px-3 py-1.5">
                          <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-red-300 break-all">
                            {c.before === null ? <em className="text-gray-500">null</em> : String(c.before)}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-green-300 break-all">
                            {c.after === null ? <em className="text-gray-500">null</em> : String(c.after)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {changes.length === 0 && (log.target_old || log.target_new) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {log.target_old && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-400">
                    Previous Snapshot
                  </h4>
                  <pre className="max-h-52 overflow-auto rounded-lg bg-red-900/30 p-3 text-xs text-red-200">
                    {JSON.stringify(log.target_old, null, 2)}
                  </pre>
                </div>
              )}
              {log.target_new && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-400">
                    New Snapshot
                  </h4>
                  <pre className="max-h-52 overflow-auto rounded-lg bg-green-900/30 p-3 text-xs text-green-200">
                    {JSON.stringify(log.target_new, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <p className="rounded-lg bg-gray-700/40 px-3 py-2 text-xs text-gray-300 italic">
            {describeLine(log)}
          </p>

          {restoreAction && restoreInfo && (
            <div className="rounded-lg border border-gray-600 bg-gray-900/60 p-3">
              {restoreSuccess ? (
                <p className="text-sm font-medium text-green-400">✓ Restored successfully — a new audit entry has been created.</p>
              ) : !showConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-300">Restore</p>
                    <p className="text-[11px] text-gray-500">Roll back this change: {restoreInfo.verb.toLowerCase()}</p>
                  </div>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="rounded-lg border border-amber-600 bg-amber-600/10 px-4 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-600/20 transition-colors cursor-pointer"
                  >
                    ↩ {restoreInfo.label}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 text-base leading-none mt-0.5">⚠</span>
                    <div>
                      <p className="text-xs font-semibold text-amber-300">Confirm: {restoreInfo.verb}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{restoreInfo.warning}</p>
                    </div>
                  </div>
                  {restoreError && (
                    <p className="text-xs text-red-400 rounded bg-red-900/30 px-2 py-1 break-all">{restoreError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleRestore}
                      disabled={restoring}
                      className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {restoring ? "Restoring…" : "Confirm Restore"}
                    </button>
                    <button
                      onClick={() => { setShowConfirm(false); setRestoreError(null); }}
                      disabled={restoring}
                      className="rounded-lg border border-gray-600 px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CHART_PALETTE = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#06b6d4", "#f97316", "#8b5cf6", "#ec4899"];

const AuditStats: React.FC<{ logs: AuditLogRow[] }> = ({ logs }) => {
  const activityByDay = useMemo(() => {
    const map: Record<string, { dashboard: number; edge_function: number; public: number; system: number }> = {};
    for (const log of logs) {
      const day = log.created_at.slice(0, 10);
      if (!map[day]) map[day] = { dashboard: 0, edge_function: 0, public: 0, system: 0 };
      map[day][log.source]++;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts, total: counts.dashboard + counts.edge_function + counts.public + counts.system }));
  }, [logs]);

  const actionBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of logs) {
      const label = actionLabel(log.action);
      map[label] = (map[label] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));
  }, [logs]);

  const sourceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of logs) {
      const label = SOURCE_LABELS[log.source]?.label ?? log.source;
      map[label] = (map[label] ?? 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [logs]);

  const topActors = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of logs) {
      map[log.actor] = (map[log.actor] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [logs]);

  const tableBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of logs) {
      if (!log.target_table) continue;
      map[log.target_table] = (map[log.target_table] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [logs]);

  const tooltipStyle = { backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" };

  return (
    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Activity Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={activityByDay}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#d1d5db" }} itemStyle={{ color: "#a5b4fc" }} />
            <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#gradTotal)" strokeWidth={2} />
            <Area type="monotone" dataKey="public" stroke="#06b6d4" fill="none" strokeWidth={1} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Actions Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={actionBreakdown} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} width={70} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#d1d5db" }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {actionBreakdown.map((_, i) => (
                <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Source Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={sourceBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
              {sourceBreakdown.map((entry, i) => {
                const srcColour = Object.values(SOURCE_LABELS).find((s) => s.label === entry.name)?.colour;
                return <Cell key={i} fill={srcColour ?? CHART_PALETTE[i % CHART_PALETTE.length]} />;
              })}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Most Active Tables</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tableBreakdown} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} width={100} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#d1d5db" }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 lg:col-span-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Top Actors</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topActors}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#d1d5db" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {topActors.map((_, i) => (
                <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MetaField: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
      {label}
    </span>
    <span className={`block truncate text-gray-200 ${mono ? "font-mono" : ""}`} title={value}>
      {value}
    </span>
  </div>
);
