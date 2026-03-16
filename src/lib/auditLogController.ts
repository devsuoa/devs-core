import { supabase } from "./supabase";

export type AuditLogRow = {
    id: number;
    created_at: string;
    target_id: number | string;
    target_table: string;
    action: string;
    admin_name: string;
    admin_team: string;
    user_agent: string;
    ip_address: string;
    auth_id: string;
    target_old: string | null;
    target_new: string | null;
};

export async function isAllowedAccess(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    const {data, error } = await supabase
        .from("profiles")
        .select("id, is_superuser")
        .eq("id", user?.id)
        .eq('is_superuser', true)

    if (error) {
        console.error("Error validating access:", error);
        return false;
    
    }
    return data.length > 0 ? true : false;
}
export async function fetchAuditLogs(): Promise<AuditLogRow[]> {
    const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching audit logs:", error);
        throw error;
    }

    return data;
}