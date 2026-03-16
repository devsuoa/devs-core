import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAdminDashboard } from "../../lib/adminDashboardController";
import { fetchAuditLogs, AuditLogRow, isAllowedAccess } from "../../lib/auditLogController";

const AdminCMSAuditLog: React.FC = () => {
  	const [allowed, setAllowed] = useState<boolean | null>(null);
  	const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    isAllowedAccess()
      .then((result) => {
        if (mounted) {
          setAllowed(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setAllowed(false);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

    if (loading) {
      return (
        <>
          <Header />
          <div className="p-8 text-center">
            <p>Checking access...</p>
          </div>
          <Footer />
        </>
      );
    }

    return allowed ? <AuditLog /> : (
      <>
        <Header />
        <div className="p-8 text-center">
          <h1>Access Denied</h1>
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
  const [filterAction, setFilterAction] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    if (!authorized) return;
    setLoading(true);
    fetchAuditLogs()
      .then((data) => {
        setLogs(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch audit logs");
      })
      .finally(() => setLoading(false));
  }, [authorized]);

  const actionColors: Record<string, string> = {
    CREATE: "#4CAF50",
    UPDATE: "#6E80DA",
    DELETE: "#E91E63",
    LOGIN: "#00BCD4",
    LOGOUT: "#FF8C42",
  };

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === "" ||
      log.admin_name.toLowerCase().includes(search.toLowerCase()) ||
      log.target_table.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      String(log.target_id).includes(search);
    const matchesAction = filterAction === "all" || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="p-8 text-center">
          <p>Checking authorization...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!authorized) {
    return (
      <>
        <Header />
        <div className="p-8 text-center">
          <p className="text-pink-600">You are not authorized to view this page.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="p-4 mt-12 max-w-5xl mx-auto">
        <h1 className="mb-2 text-2xl font-bold">Audit Logs - Extremely Confidential</h1>
        <p className="text-gray-500 mb-6">
          Showing {filteredLogs.length} of {logs.length} log entries
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by admin, table, action, or target ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px] px-3 py-2 rounded border border-gray-300 text-base"
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 text-base"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded mb-4">
            Error: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && <p className="text-center">Loading audit logs...</p>}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-600 text-left">
                  <th className="py-3 px-2 font-semibold border-b-2 border-gray-300">Timestamp</th>
                  <th className="py-3 px-5 font-semibold border-b-2 border-gray-300">Action</th>
                  <th className="py-3 px-2 font-semibold border-b-2 border-gray-300">Admin</th>
                  <th className="py-3 px-2 font-semibold border-b-2 border-gray-300">Team</th>
                  <th className="py-3 px-2 font-semibold border-b-2 border-gray-300">Table</th>
                  <th className="py-3 px-2 font-semibold border-b-2 border-gray-300">Target ID</th>
                  <th className="py-3 px-2 font-semibold border-b-2 border-gray-300">IP Address</th>
                  <th className="py-3 px-2 font-semibold border-b-2 border-gray-300">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">No audit logs found.</td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`border-b cursor-pointer ${expandedRow === log.id ? "bg-gray-600" : "hover:bg-gray-700"}`}
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        <td className="py-2 px-2 align-middle">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-2 px-2 align-middle">
                          <span
                            className="text-white px-3 mr-4 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: actionColors[log.action] || "#888" }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-2 align-middle">{log.admin_name}</td>
                        <td className="py-2 px-2 align-middle">{log.admin_team}</td>
                        <td className="py-2 px-2 align-middle"><code>{log.target_table}</code></td>
                        <td className="py-2 px-2 align-middle">{log.target_id}</td>
                        <td className="py-2 px-2 align-middle">{log.ip_address}</td>
                        <td className="py-2 px-2 align-middle">
                          <button
                            className="border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer bg-transparent"
                          >
                            {expandedRow === log.id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === log.id && (
                        <tr>
                          <td colSpan={8} className="p-4 bg-gray-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                              <div>
                                <strong>User Agent:</strong>
                                <p className="text-sm text-black break-all">{log.user_agent || "N/A"}</p>
                              </div>
                              <div>
                                <strong>Auth ID:</strong>
                                <p className="text-sm text-black break-all">{log.auth_id || "N/A"}</p>
                              </div>
                              {log.target_old && (
                                <div>
                                  <strong>Previous Value:</strong>
                                  <pre className="bg-red-700 p-2 rounded text-xs overflow-auto max-h-52">
                                    {JSON.stringify(log.target_old, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.target_new && (
                                <div>
                                  <strong>New Value:</strong>
                                  <pre className="bg-green-700 p-2 rounded text-xs overflow-auto max-h-52">
                                    {JSON.stringify(log.target_new, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};


export { AuditLog };
