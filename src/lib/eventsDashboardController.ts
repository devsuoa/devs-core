import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import { emailsFromStoredRsvp } from "./eventsRSVPController";

export type AttendeeRow = {
    rsvp_id: string | null;
    rsvp_created_at: string;

    event_id: string;
    event_title: string;
    event_date: string | null;

    /** Person for this row (one of the group_emails). */
    member_email: string;
    /** Submitter email for this RSVP; dietary_requirements apply to this person only. */
    rsvp_leader_email: string;
    member_first_name: string | null;
    member_last_name: string | null;
    member_student_id: number | null;
    member_upi: string | null;
    dietary_requirements: string | null;
    /** Full group for this RSVP (same on every expanded row). */
    group_emails: string[];
    rsvp_answers: Record<string, string | string[]>;
    present: boolean;
};

type MemberProfile = {
    email: string;
    first_name: string | null;
    last_name: string | null;
    student_id: number | null;
    upi: string | null;
};

function buildAttendeeRowsFromRsvp(raw: any, memberByEmail: Map<string, MemberProfile>): AttendeeRow[] {
    const ev = raw.events ?? raw.event ?? null;
    const leaderEmail = String(raw.email).trim().toLowerCase();
    const leaderMem = raw.members ?? raw.member ?? null;
    const groupEmailsStored = Array.isArray(raw.group_emails) ? raw.group_emails : [];
    const seatEmails = emailsFromStoredRsvp(raw.email, raw.group_emails);

    const rsvp_answers =
        raw.rsvp_answers && typeof raw.rsvp_answers === "object" && !Array.isArray(raw.rsvp_answers)
            ? raw.rsvp_answers
            : {};

    return seatEmails.map((personEmail) => {
        const fromMap = memberByEmail.get(personEmail);
        const mem = fromMap ?? (personEmail === leaderEmail ? leaderMem : null);
        return {
            rsvp_id: raw.id ? String(raw.id) : null,
            rsvp_created_at: raw.created_at,
            event_id: raw.event_id,
            event_title: ev?.title ?? "(Unknown event)",
            event_date: ev?.event_date ?? null,

            member_email: personEmail,
            rsvp_leader_email: leaderEmail,
            member_first_name: mem?.first_name ?? null,
            member_last_name: mem?.last_name ?? null,
            member_student_id: mem?.student_id ?? null,
            member_upi: mem?.upi ?? null,
            dietary_requirements: personEmail === leaderEmail ? (raw.dietary_requirements ?? null) : null,
            group_emails: groupEmailsStored,
            rsvp_answers,
            present: Boolean(raw.present),
        };
    });
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

export function useEventAttendees(eventIdFilter?: string | null) {
    const [rows, setRows] = useState<AttendeeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);

        let query = supabase
            .from("events_rsvp")
            .select(
                `
        id,
        created_at,
        event_id,
        email,
        dietary_requirements,
        group_emails,
        rsvp_answers,
        present,
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
            );

        if (eventIdFilter) {
            query = query.eq("event_id", eventIdFilter);
        }

        const { data, error: qErr } = await query.order("created_at", { ascending: false });

        if (qErr) {
            console.error("Event Attendees load failed:", qErr);
            setError(qErr.message ?? "Failed to load attendees");
            setRows([]);
            setLoading(false);
            return;
        }

        const rawRows = data ?? [];
        const emailsToFetch = new Set<string>();
        for (const raw of rawRows) {
            for (const em of emailsFromStoredRsvp(raw.email, raw.group_emails)) {
                emailsToFetch.add(em);
            }
        }

        const memberByEmail = new Map<string, MemberProfile>();
        if (emailsToFetch.size > 0) {
            const { data: membersData, error: memErr } = await supabase
                .from("members")
                .select("email, first_name, last_name, student_id, upi")
                .in("email", Array.from(emailsToFetch));

            if (memErr) {
                console.error("Event Attendees members lookup failed:", memErr);
            }
            for (const m of membersData ?? []) {
                memberByEmail.set(String(m.email).trim().toLowerCase(), m as MemberProfile);
            }
        }

        const expanded: AttendeeRow[] = [];
        for (const raw of rawRows) {
            expanded.push(...buildAttendeeRowsFromRsvp(raw, memberByEmail));
        }

        const seen = new Set<string>();
        const deduped: AttendeeRow[] = [];
        for (const r of expanded) {
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
    }, [eventIdFilter]);

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

    const setAttendeePresentLocal = (target: { rsvpId: string | null; eventId: string; memberEmail: string }, present: boolean) => {
        setRows((current) =>
            current.map((row) => {
                if (target.rsvpId && row.rsvp_id === target.rsvpId) {
                    return { ...row, present };
                }
                if (!target.rsvpId && row.event_id === target.eventId && row.member_email === target.memberEmail) {
                    return { ...row, present };
                }
                return row;
            })
        );
    };

    return { grouped, loading, error, reload: load, setAttendeePresentLocal };
}

export async function updateAttendeePresentStatus(input: {
    rsvpId: string | null;
    eventId: string;
    memberEmail: string;
    present: boolean;
}) {
    if (input.rsvpId) {
        const { data, error } = await supabase
            .from("events_rsvp")
            .update({ present: input.present })
            .eq("id", input.rsvpId)
            .select("id");

        if (error) {
            throw error;
        }
        if ((data ?? []).length > 0) {
            return;
        }
    }

    const { data, error } = await supabase
        .from("events_rsvp")
        .update({ present: input.present })
        .eq("event_id", input.eventId)
        .eq("email", input.memberEmail)
        .select("id");

    if (error) {
        throw error;
    }
    if ((data ?? []).length === 0) {
        throw new Error("Attendance update did not persist. Check events_rsvp update policy.");
    }
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
        "Group Emails",
        "Present",
    ];

    const rows = attendees.map((a) => [
        eventTitle,
        eventDate ?? "",
        `${a.member_first_name ?? ""} ${a.member_last_name ?? ""}`.trim(),
        a.member_email,
        a.member_student_id ?? "",
        a.member_upi ?? "",
        a.dietary_requirements ?? "",
        a.group_emails.join("; "),
        a.present ? "Yes" : "No",
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