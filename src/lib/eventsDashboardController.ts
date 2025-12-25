import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export type AttendeeRow = {
    rsvp_created_at: string;

    event_id: string;
    event_title: string;
    event_date: string | null;

    member_email: string;
    member_first_name: string | null;
    member_last_name: string | null;
    member_student_id: number | null;
    member_upi: string | null;
    dietary_requirements: string | null;
};

function normalizeRow(raw: any): AttendeeRow {
    const ev = raw.events ?? raw.event ?? null;
    const mem = raw.members ?? raw.member ?? null;

    return {
        rsvp_created_at: raw.created_at,
        event_id: raw.event_id,
        event_title: ev?.title ?? "(Unknown event)",
        event_date: ev?.event_date ?? null,

        member_email: raw.email,
        member_first_name: mem?.first_name ?? null,
        member_last_name: mem?.last_name ?? null,
        member_student_id: mem?.student_id ?? null,
        member_upi: mem?.upi ?? null,
        dietary_requirements: raw.dietary_requirements ?? null,
    };
}

export function formatNZDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-NZ", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function memberFullName(a: AttendeeRow): string {
    const first = (a.member_first_name ?? "").trim();
    const last = (a.member_last_name ?? "").trim();
    const full = `${first} ${last}`.trim();
    return full.length ? full : "—";
}

export function useEventAttendees() {
    const [rows, setRows] = useState<AttendeeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);

        const { data, error: qErr } = await supabase
            .from("events_rsvp")
            .select(
                `
        created_at,
        event_id,
        email,
        dietary_requirements,
        events (
          id,
          title,
          event_date
        ),
        members (
          email,
          first_name,
          last_name,
          student_id,
          upi
        )
      `
            )
            .order("created_at", { ascending: false });

        if (qErr) {
            console.error("Event Attendees load failed:", qErr);
            setError(qErr.message ?? "Failed to load attendees");
            setRows([]);
            setLoading(false);
            return;
        }

        const normalized = (data ?? []).map(normalizeRow);

        const seen = new Set<string>();
        const deduped: AttendeeRow[] = [];
        for (const r of normalized) {
            const key = `${r.event_id}::${r.member_email}`;
            if (seen.has(key)) continue;
            seen.add(key);
            deduped.push(r);
        }

        setRows(deduped);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    const grouped = useMemo(() => {
        const map = new Map<
            string,
            { event_id: string; title: string; event_date: string | null; attendees: AttendeeRow[] }
        >();

        for (const r of rows) {
            if (!map.has(r.event_id)) {
                map.set(r.event_id, {
                    event_id: r.event_id,
                    title: r.event_title,
                    event_date: r.event_date,
                    attendees: [],
                });
            }
            map.get(r.event_id)!.attendees.push(r);
        }

        // Sort events by date desc (nulls last), then title
        const list = Array.from(map.values()).sort((a, b) => {
            const ad = a.event_date ? new Date(a.event_date).getTime() : -Infinity;
            const bd = b.event_date ? new Date(b.event_date).getTime() : -Infinity;
            if (ad !== bd) return bd - ad;
            return a.title.localeCompare(b.title);
        });

        // Sort attendees per event by name then email
        for (const e of list) {
            e.attendees.sort((x, y) => {
                const xn = memberFullName(x).toLowerCase();
                const yn = memberFullName(y).toLowerCase();
                if (xn !== yn) return xn.localeCompare(yn);
                return x.member_email.localeCompare(y.member_email);
            });
        }

        return list;
    }, [rows]);

    return { grouped, loading, error, reload: load };
}

export function downloadEventAttendeesCSV(
    eventTitle: string,
    eventDate: string | null,
    attendees: AttendeeRow[]
) {
    const headers = [
        "Event Name",
        "Event Date",
        "Member Name",
        "Member Email",
        "Student ID",
        "UPI",
        "Dietary Requirements",
    ];

    const rows = attendees.map((a) => [
        eventTitle,
        eventDate ?? "",
        `${a.member_first_name ?? ""} ${a.member_last_name ?? ""}`.trim(),
        a.member_email,
        a.member_student_id ?? "",
        a.member_upi ?? "",
        a.dietary_requirements ?? "",
    ]);

    const csvContent =
        [headers, ...rows]
            .map((row) =>
                row
                    .map((cell) =>
                        `"${String(cell).replace(/"/g, '""')}"`
                    )
                    .join(",")
            )
            .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${eventTitle
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_attendees.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}