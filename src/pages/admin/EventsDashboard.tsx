import React, { useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { PageTitle } from "../../components/PageTitle";
import { useAdminDashboard } from "../../lib/adminDashboardController";
import { formatNZDate, memberFullName, useEventAttendees, downloadEventAttendeesCSV } from "../../lib/eventsDashboardController";

const EventsDashboard: React.FC = () => {
    const { loading: authLoading, authorized } = useAdminDashboard();
    const { grouped, loading, error, reload } = useEventAttendees();

    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return grouped;

        return grouped
            .map((ev) => {
                const attendees = ev.attendees.filter((a) => {
                    const name = memberFullName(a).toLowerCase();
                    const email = (a.member_email ?? "").toLowerCase();
                    const upi = (a.member_upi ?? "").toLowerCase();
                    const sid = a.member_student_id?.toString() ?? "";
                    return (
                        name.includes(q) ||
                        email.includes(q) ||
                        upi.includes(q) ||
                        sid.includes(q) ||
                        ev.title.toLowerCase().includes(q)
                    );
                });
                return { ...ev, attendees };
            })
            .filter((ev) => ev.attendees.length > 0);
    }, [grouped, query]);

    if (authLoading || loading) {
        return (
            <>
                <Header />
                <div className="flex justify-center mt-[20vh] min-h-[80vh]">
                    <p className="font-pixelify text-white">Loading...</p>
                </div>
                <Footer />
            </>
        );
    }

    if (!authorized) return null;

    return (
        <>
            <Header />
            <PageTitle
                image="/theme/title_icon.png"
                title="Event Attendees"
                subtext="Confirmed RSVPs grouped by event"
                className="mt-[5vh]"
            />

            <div className="flex justify-center px-4 py-12 mb-[10vh] min-h-[80vh]">
                <div className="w-[70vw] min-w-[650px] max-w-[1100px]">
                    <div className="pixel-panel p-8 mb-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex flex-col gap-2">
                                <p className="font-silkscreen text-white text-lg">Search</p>
                                <input
                                    className="pixel-input w-full max-w-full font-rethink"
                                    placeholder="Search by name, email, UPI, student ID, event..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>

                            <button
                                className="pixel-button font-silkscreen"
                                onClick={reload}
                                type="button"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="pixel-panel mb-6 p-4">
                            <p className="font-pixelify text-red-400 text-xs">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-6">
                        {filtered.length === 0 ? (
                            <div className="pixel-panel p-10">
                                <p className="font-pixelify text-white text-sm">
                                    No attendees found.
                                </p>
                            </div>
                        ) : (
                            filtered.map((ev) => (
                                <div key={ev.event_id} className="pixel-panel p-8">
                                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                                        <div>
                                            <p className="font-silkscreen text-white text-[1.25rem]">
                                                {ev.title}
                                            </p>
                                            <p className="font-pixelify text-gray-400 text-xs mt-1">
                                                {formatNZDate(ev.event_date)} • {ev.attendees.length} attendee
                                                {ev.attendees.length === 1 ? "" : "s"}
                                            </p>
                                        </div>
                                        <button
                                            className="pixel-button text-xs font-silkscreen"
                                            onClick={() =>
                                                downloadEventAttendeesCSV(
                                                    ev.title,
                                                    ev.event_date,
                                                    ev.attendees
                                                )
                                            }
                                        >
                                            Download CSV
                                        </button>

                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/20">
                                                    <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">
                                                        Member
                                                    </th>
                                                    <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">
                                                        Email
                                                    </th>
                                                    <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">
                                                        Student ID
                                                    </th>
                                                    <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">
                                                        UPI
                                                    </th>
                                                    <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">
                                                        Dietary Requirements
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ev.attendees.map((a) => (
                                                    <tr
                                                        key={`${a.event_id}::${a.member_email}`}
                                                        className="border-b border-white/10"
                                                    >
                                                        <td className="py-3 pr-4 font-pixelify text-sm text-white">
                                                            {memberFullName(a)}
                                                        </td>
                                                        <td className="py-3 pr-4 font-pixelify text-sm text-white">
                                                            {a.member_email}
                                                        </td>
                                                        <td className="py-3 pr-4 font-pixelify text-sm text-white">
                                                            {a.member_student_id ?? "—"}
                                                        </td>
                                                        <td className="py-3 pr-4 font-pixelify text-sm text-white">
                                                            {a.member_upi ?? "—"}
                                                        </td>
                                                        <td className="py-3 pr-4 font-pixelify text-sm text-white">
                                                            {a.dietary_requirements ?? "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default EventsDashboard;
