import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { PageTitle } from "../../components/PageTitle";
import { useAdminDashboard } from "../../lib/adminDashboardController";
import {
  formatNZDate,
  memberFullName,
  useEventAttendees,
  downloadEventAttendeesCSV,
  updateAttendeePresentStatus,
} from "../../lib/eventsDashboardController";

const EventsDashboard: React.FC = () => {
  const { loading: authLoading, authorized } = useAdminDashboard();
  const [searchParams] = useSearchParams();
  const eventIdFilter = searchParams.get("eventId");
  const { grouped, loading, error, reload, setAttendeePresentLocal } = useEventAttendees(eventIdFilter);

  const [query, setQuery] = useState("");
  const [showAttendee, setShowAttendee] = useState(false);
  const [updatingRowKey, setUpdatingRowKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sortedGrouped = grouped.map((ev) => ({
      ...ev,
      attendees: [...ev.attendees].sort((a, b) => {
        // Memoize the length check inside the sort to avoid repeated lowercasing
        const valA =
          (a.dietary_requirements || "").toLowerCase() === "none" ? 0 : (a.dietary_requirements?.length ?? 0);
        const valB =
          (b.dietary_requirements || "").toLowerCase() === "none" ? 0 : (b.dietary_requirements?.length ?? 0);
        return valB - valA;
      }),
    }));

    if (!q) return sortedGrouped;

    return sortedGrouped
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

  const handlePresentToggle = async (
    attendee: { rsvp_id: string | null; event_id: string; member_email: string },
    present: boolean
  ) => {
    const key = attendee.rsvp_id ?? `${attendee.event_id}::${attendee.member_email}`;
    const previousValue = grouped
      .flatMap((eventGroup) => eventGroup.attendees)
      .find(
        (row) =>
          (attendee.rsvp_id && row.rsvp_id === attendee.rsvp_id) ||
          (row.event_id === attendee.event_id && row.member_email === attendee.member_email)
      )?.present;

    setAttendeePresentLocal(
      { rsvpId: attendee.rsvp_id, eventId: attendee.event_id, memberEmail: attendee.member_email },
      present
    );
    setUpdatingRowKey(key);
    try {
      await updateAttendeePresentStatus({
        rsvpId: attendee.rsvp_id,
        eventId: attendee.event_id,
        memberEmail: attendee.member_email,
        present,
      });
    } catch (err) {
      console.error("Failed to update attendance status:", err);
      if (typeof previousValue === "boolean") {
        setAttendeePresentLocal(
          { rsvpId: attendee.rsvp_id, eventId: attendee.event_id, memberEmail: attendee.member_email },
          previousValue
        );
      }
    } finally {
      setUpdatingRowKey(null);
    }
  };

  return (
    <>
      <Header />
      <div className="px-[8vw] pt-4 sm:pt-6">
        <Link
          to="/admin/dashboard"
          className="font-silkscreen text-sm sm:text-base text-white/80 hover:text-white py-2 touch-manipulation w-fit"
        >
          ← Back to dashboard
        </Link>
      </div>
      <PageTitle title="Event Attendees" subtext="Confirmed RSVPs grouped by event" className="mt-[5vh]" />

      <div className="flex justify-center px-4 sm:px-6 py-8 sm:py-12 mb-8 sm:mb-[10vh] min-h-[80vh]">
        <div className="w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[70vw] lg:min-w-[650px] lg:max-w-[1100px] min-w-0">
          <div className="pixel-panel p-6 sm:p-8 mb-6">
            {eventIdFilter && (
              <p className="font-pixelify text-xs text-white/70 mb-4">
                Filtered to a single event.{" "}
                <Link to="/admin/event-attendees" className="underline hover:text-white">
                  Clear filter
                </Link>
              </p>
            )}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <p className="font-silkscreen text-white text-base sm:text-lg">Search</p>
                <input
                  className="pixel-input w-full font-rethink"
                  placeholder="Search by name, email, UPI, student ID, event..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button
                className="pixel-button font-silkscreen min-h-[44px] touch-manipulation shrink-0"
                onClick={reload}
                type="button"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="pixel-panel mb-6 p-4 sm:p-5">
              <p className="font-pixelify text-red-400 text-xs">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {filtered.length === 0 ? (
              <div className="pixel-panel p-6 sm:p-10">
                <p className="font-pixelify text-white text-sm">No attendees found.</p>
              </div>
            ) : (
              filtered.map((ev) => {
                const presentCount = ev.attendees.filter((attendee) => attendee.present).length;
                return (
                  <div key={ev.event_id} className="pixel-panel p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                      <div className="min-w-0">
                        <p className="font-silkscreen text-white text-lg sm:text-[1.25rem]">{ev.title}</p>
                        <p className="font-pixelify text-gray-400 text-xs mt-1">
                          {formatNZDate(ev.event_date)} • {ev.attendees.length} attendee
                          {ev.attendees.length === 1 ? "" : "s"} • {presentCount}/{ev.attendees.length} present
                        </p>
                      </div>
                      <div>
                        <button
                          className="pixel-button text-xs font-silkscreen min-h-[40px] touch-manipulation shrink-0"
                          onClick={() => downloadEventAttendeesCSV(ev.title, ev.event_date, ev.attendees)}
                        >
                          Download CSV
                        </button>
                        <button
                          className="pixel-button text-xs font-silkscreen min-h-[40px] touch-manipulation shrink-0"
                          onClick={() => setShowAttendee((prev) => !prev)}
                        >
                          {showAttendee ? "<" : ">"}
                        </button>
                      </div>
                    </div>

                    {showAttendee && (
                      <>
                        {/* Mobile: card layout */}
                        <div className="flex flex-col gap-3 md:hidden">
                          {ev.attendees.map((a) => (
                            <div
                              key={`${a.event_id}::${a.member_email}`}
                              className="rounded-lg border border-white/20 bg-white/5 p-4"
                            >
                              <p className="font-silkscreen text-white text-sm">{memberFullName(a)}</p>
                              <p className="font-pixelify text-gray-400 text-xs mt-1 break-all">{a.member_email}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 font-pixelify text-xs text-white/80">
                                <span>ID: {a.member_student_id ?? "—"}</span>
                                <span>UPI: {a.member_upi ?? "—"}</span>
                              </div>
                              {a.group_emails.length > 0 && (
                                <p className="font-pixelify text-xs text-white/70 mt-2 break-all">
                                  Group emails: {a.group_emails.join(", ")}
                                </p>
                              )}
                              {a.dietary_requirements && (
                                <p className="font-pixelify text-xs text-white/70 mt-2">
                                  Diet: {a.dietary_requirements}
                                </p>
                              )}
                              <label className="font-pixelify text-xs text-white/80 mt-3 inline-flex items-center">
                                <input
                                  type="checkbox"
                                  aria-label={`Toggle attendance for ${memberFullName(a)}`}
                                  className="h-5 w-5 cursor-pointer rounded-sm border border-white/40 bg-[#0e1026] accent-purple-300 transition disabled:opacity-50"
                                  checked={a.present}
                                  disabled={updatingRowKey === (a.rsvp_id ?? `${a.event_id}::${a.member_email}`)}
                                  onChange={(e) =>
                                    handlePresentToggle(a, e.target.checked)
                                  }
                                />
                              </label>
                            </div>
                          ))}
                        </div>

                        {/* Desktop: table layout */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-white/20">
                                <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">Member</th>
                                <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">Email</th>
                                <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">Student ID</th>
                                <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">UPI</th>
                                <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">Group</th>
                                <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">
                                  Dietary Requirements
                                </th>
                                <th className="text-left py-3 pr-4 font-silkscreen text-sm text-white">Present</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ev.attendees.map((a) => (
                                <tr key={`${a.event_id}::${a.member_email}`} className="border-b border-white/10">
                                  <td className="py-3 pr-4 font-pixelify text-sm text-white">{memberFullName(a)}</td>
                                  <td className="py-3 pr-4 font-pixelify text-sm text-white">{a.member_email}</td>
                                  <td className="py-3 pr-4 font-pixelify text-sm text-white">
                                    {a.member_student_id ?? "—"}
                                  </td>
                                  <td className="py-3 pr-4 font-pixelify text-sm text-white">{a.member_upi ?? "—"}</td>
                                  <td className="py-3 pr-4 font-pixelify text-sm text-white">
                                    {a.group_emails.length > 0 ? a.group_emails.join(", ") : "—"}
                                  </td>
                                  <td className="py-3 pr-4 font-pixelify text-sm text-white">
                                    {a.dietary_requirements ?? "—"}
                                  </td>
                                  <td className="py-3 pr-4 font-pixelify text-sm text-white">
                                    <label className="inline-flex items-center">
                                      <input
                                        type="checkbox"
                                        aria-label={`Toggle attendance for ${memberFullName(a)}`}
                                        className="h-5 w-5 cursor-pointer rounded-sm border border-white/40 bg-[#0e1026] accent-purple-300 transition disabled:opacity-50"
                                        checked={a.present}
                                        disabled={updatingRowKey === (a.rsvp_id ?? `${a.event_id}::${a.member_email}`)}
                                        onChange={(e) =>
                                          handlePresentToggle(a, e.target.checked)
                                        }
                                      />
                                    </label>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default EventsDashboard;
