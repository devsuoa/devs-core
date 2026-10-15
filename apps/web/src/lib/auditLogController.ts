import { supabase } from "./supabase";

export type AuditSource = "dashboard" | "edge_function" | "system" | "public";

export type AuditLogRow = {
  id: number;
  created_at: string;

  admin_name: string;
  admin_team: string;
  auth_id: string;
  action: string;
  target_table: string;
  target_id: number | string;
  target_old: Record<string, unknown> | null;
  target_new: Record<string, unknown> | null;
  user_agent: string;
  ip_address: string;

  actor: string;
  actor_team: string;
  source: AuditSource;
  function_name: string | null;
};

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

function inferSource(
  adminName: string,
  adminTeam: string,
  userAgent: string,
  _authId: string,
): { source: AuditSource; functionName: string | null } {
  const isUnknown = adminName === "unknown";
  const hasNoTeam = adminTeam === "db-access" || adminTeam === "";
  const uaLower = userAgent.toLowerCase();
  const isDeno = uaLower.includes("deno");
  const isServerUA = userAgent === "server" || userAgent === "";
  const isBrowser = !isDeno && !isServerUA;

  if (isDeno || (isUnknown && !hasNoTeam)) {
    const functionName = isUnknown && !hasNoTeam ? adminTeam : null;
    return { source: "edge_function", functionName };
  }

  if (isServerUA && isUnknown) {
    return { source: "system", functionName: null };
  }

  if (isBrowser && hasNoTeam) {
    return { source: "public", functionName: null };
  }

  return { source: "dashboard", functionName: null };
}

function normaliseRow(raw: Record<string, unknown>): AuditLogRow {
  const adminName = (raw.admin_name as string) || "unknown";
  const adminTeam = (raw.admin_team as string) || "";
  const userAgent = (raw.user_agent as string) || "";
  const authId = (raw.auth_id as string) || NIL_UUID;
  const { source, functionName } = inferSource(adminName, adminTeam, userAgent, authId);

  let actor: string;
  if (source === "edge_function") {
    actor = functionName ?? "Edge Function";
  } else if (source === "system") {
    actor = "System";
  } else if (source === "public") {
    actor = adminName !== "unknown" ? adminName : "Anonymous";
  } else {
    actor = adminName;
  }

  return {
    id: raw.id as number,
    created_at: raw.created_at as string,

    admin_name: adminName,
    admin_team: adminTeam,
    auth_id: (raw.auth_id as string) || NIL_UUID,
    action: raw.action as string,
    target_table: (raw.target_table as string) || "",
    target_id: (raw.target_id as number | string) ?? "",
    target_old: raw.target_old
      ? ((typeof raw.target_old === "string"
          ? JSON.parse(raw.target_old)
          : raw.target_old) as Record<string, unknown>)
      : null,
    target_new: raw.target_new
      ? ((typeof raw.target_new === "string"
          ? JSON.parse(raw.target_new)
          : raw.target_new) as Record<string, unknown>)
      : null,
    user_agent: (raw.user_agent as string) || "",
    ip_address: (raw.ip_address as string) || "",

    actor,
    actor_team: source === "dashboard" ? adminTeam : "",
    source,
    function_name: functionName,
  };
}

export function actionLabel(action: string): string {
  const map: Record<string, string> = {
    INSERT: "Inserted",
    UPDATE: "Updated",
    DELETE: "Deleted",
    CREATE: "Created",
    INVOKE: "Invoked",
    LOGIN: "Logged in",
    LOGOUT: "Logged out",
  };
  return map[action] ?? action;
}

const TABLE_CONTEXT: Record<string, string> = {
  events_rsvp: "RSVP'd for an event",
  members: "signed up as a member",
};

export function describeLine(log: AuditLogRow): string {
  const verb = actionLabel(log.action).toLowerCase();
  const target = log.target_id ? `row ${log.target_id} in ${log.target_table}` : log.target_table;

  if (log.source === "edge_function") {
    return `Edge function "${log.function_name}" ${verb} ${target}`;
  }
  if (log.source === "system") {
    return `System ${verb} ${target}`;
  }
  if (log.source === "public") {
    const friendly =
      log.action === "INSERT" || log.action === "CREATE"
        ? TABLE_CONTEXT[log.target_table]
        : undefined;
    if (friendly) return `${log.actor} ${friendly} (${log.target_table} #${log.target_id})`;
    return `Public user ${log.actor} ${verb} ${target}`;
  }
  if (!log.target_table) return `${log.actor} ${verb}`;
  return `${log.actor} ${verb} ${target}`;
}

export function diffFields(
  oldSnap: Record<string, unknown> | null,
  newSnap: Record<string, unknown> | null,
): { key: string; before: unknown; after: unknown }[] {
  if (!oldSnap && !newSnap) return [];
  const keys = new Set([...Object.keys(oldSnap ?? {}), ...Object.keys(newSnap ?? {})]);
  const changes: { key: string; before: unknown; after: unknown }[] = [];
  for (const key of keys) {
    const before = oldSnap?.[key] ?? null;
    const after = newSnap?.[key] ?? null;
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push({ key, before, after });
    }
  }
  return changes;
}

export async function isAllowedAccess(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, is_superuser")
    .eq("id", user?.id)
    .eq("is_superuser", true);

  if (error) {
    console.error("Error validating access:", error);
    return false;
  }
  return data.length > 0;
}

export const AUDIT_PAGE_SIZE = 5000;

export async function fetchAuditLogs(
  page = 0,
  pageSize = AUDIT_PAGE_SIZE,
): Promise<{ rows: AuditLogRow[]; hasMore: boolean }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }

  const rows = (data as Record<string, unknown>[]).map(normaliseRow);
  return { rows, hasMore: rows.length === pageSize };
}

export type RestoreAction = "revert_insert" | "revert_delete" | "revert_update";

export function getRestoreAction(log: AuditLogRow): RestoreAction | null {
  const action = log.action.toUpperCase();
  if ((action === "INSERT" || action === "CREATE") && log.target_id && log.target_table) {
    return "revert_insert";
  }
  if (action === "DELETE" && log.target_old && log.target_table) {
    return "revert_delete";
  }
  if (action === "UPDATE" && log.target_old && log.target_id && log.target_table) {
    return "revert_update";
  }
  return null;
}

export function getRestoreDescription(action: RestoreAction): {
  label: string;
  verb: string;
  warning: string;
} {
  switch (action) {
    case "revert_insert":
      return {
        label: "Undo Insert",
        verb: "DELETE the row that was inserted",
        warning:
          "This will permanently delete the row from the target table. Any changes made to it since this audit entry will also be lost.",
      };
    case "revert_delete":
      return {
        label: "Undo Delete",
        verb: "RE-INSERT the deleted row",
        warning:
          "This will re-insert the row using the snapshot captured at deletion time. It may fail if foreign key constraints or unique constraints are violated.",
      };
    case "revert_update":
      return {
        label: "Revert to Previous",
        verb: "OVERWRITE the row with its previous state",
        warning:
          "This will overwrite the current row data with the state captured before this update. Any changes made after this audit entry will be lost.",
      };
  }
}

function detectPkColumn(log: AuditLogRow): string {
  const snap = log.target_old ?? log.target_new;
  if (snap) {
    if ("id" in snap) return "id";
    if ("student_id" in snap) return "student_id";
  }
  return "id";
}

// Execute an undo operation against the target table via PostgREST.

export async function restoreAuditEntry(log: AuditLogRow): Promise<void> {
  const action = getRestoreAction(log);
  if (!action) throw new Error("This entry cannot be restored");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated — please log in again");

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const headers: Record<string, string> = {
    apikey: apiKey,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
    "x-audit-undo": String(log.id),
  };

  const table = encodeURIComponent(log.target_table);
  const pkCol = detectPkColumn(log);
  const pkVal = encodeURIComponent(String(log.target_id));

  let res: Response;

  switch (action) {
    case "revert_insert": {
      res = await fetch(`${baseUrl}/rest/v1/${table}?${pkCol}=eq.${pkVal}`, {
        method: "DELETE",
        headers,
      });
      break;
    }
    case "revert_delete": {
      res = await fetch(`${baseUrl}/rest/v1/${table}`, {
        method: "POST",
        headers,
        body: JSON.stringify(log.target_old),
      });
      break;
    }
    case "revert_update": {
      res = await fetch(`${baseUrl}/rest/v1/${table}?${pkCol}=eq.${pkVal}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(log.target_old),
      });
      break;
    }
  }

  if (!res!.ok) {
    const body = await res!.text();
    throw new Error(body || `Restore failed (HTTP ${res!.status})`);
  }
}
