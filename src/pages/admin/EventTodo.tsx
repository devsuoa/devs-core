import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { PageTitle } from "../../components/PageTitle";
import EventsCard from "../../components/EventsCard";
import Pagination from "../../components/Pagination";
import BinaryBackground from "../../components/BinaryBackground";
import { useAdminDashboard } from "../../lib/adminDashboardController";
import { useEvents, formatEventDate } from "../../lib/eventsController";
import { PublicEvent } from "../../lib/eventsController";
import {
  EventTodoItem,
  EventDocLink,
  TodoComment,
  loadEventTodos,
  toggleTodoItem,
  updateTodoItemNotes,
  updateTodoItemLabel,
  addTodoItem,
  deleteTodoItem,
  loadEventNote,
  saveEventNote,
  loadEventDocLinks,
  addDocLink,
  deleteDocLink,
  loadTodoComments,
  addTodoComment,
} from "../../lib/eventTodoController";

function formatNZDate(utcDate: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(utcDate));
}

// ── Task Detail Sidebar ────────────────────────────────────────────────────────

function TodoItemSidebar({
  item,
  onClose,
  onToggle,
  onNotesChange,
  onLabelChange,
}: {
  item: EventTodoItem;
  onClose: () => void;
  onToggle: (id: string, completed: boolean) => void;
  onNotesChange: (id: string, notes: string) => void;
  onLabelChange: (id: string, label: string) => void;
}) {
  const [notes, setNotes] = useState(item.item_notes ?? "");
  const [label, setLabel] = useState(item.label);
  const [saving, setSaving] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [comments, setComments] = useState<TodoComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNotes(item.item_notes ?? "");
    setLabel(item.label);
    setComments([]);
    setCommentText("");
    setCommentsLoading(true);
    loadTodoComments(item.id)
      .then(setComments)
      .catch(console.error)
      .finally(() => setCommentsLoading(false));
  }, [item.id, item.item_notes, item.label]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    setSaving(true);
    notesTimer.current = setTimeout(async () => {
      try {
        await updateTodoItemNotes(item.id, value);
        onNotesChange(item.id, value);
      } catch {
        /* retry on next keystroke */
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  const handleLabelBlur = async () => {
    if (item.is_default || label.trim() === item.label) return;
    try {
      await updateTodoItemLabel(item.id, label.trim());
      onLabelChange(item.id, label.trim());
    } catch {
      setLabel(item.label);
    }
  };

  const handleAddComment = async () => {
    const msg = commentText.trim();
    if (!msg) return;
    setCommentSubmitting(true);
    try {
      const comment = await addTodoComment(item.id, msg);
      setComments((prev) => [...prev, comment]);
      setCommentText("");
    } catch {
      alert("Failed to post comment. Please try again.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <aside className="fixed right-0 top-0 w-full sm:w-[400px] max-w-full h-full bg-black border-l-2 border-[#6E80DA] p-4 sm:p-6 z-60 overflow-y-auto shadow-2xl flex flex-col gap-5">
      <button onClick={onClose} className="text-white/70 font-silkscreen text-sm self-start">
        ← Back
      </button>

      <div>
        <p className="text-xs text-white/50 font-silkscreen mb-1 uppercase tracking-widest">Task</p>
        {item.is_default ? (
          <h2 className="font-silkscreen text-white text-base leading-relaxed">{item.label}</h2>
        ) : (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelBlur}
            className="w-full p-2 rounded bg-black border border-white/30 text-white font-silkscreen text-sm focus:outline-none focus:border-[#6E80DA]"
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="item-completed"
          type="checkbox"
          checked={item.completed}
          onChange={(e) => onToggle(item.id, e.target.checked)}
          className="w-4 h-4 accent-[#6E80DA] cursor-pointer"
        />
        <label htmlFor="item-completed" className="font-silkscreen text-white/80 text-sm cursor-pointer select-none">
          Mark as completed
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50 font-silkscreen uppercase tracking-widest">Notes</p>
          {saving && <span className="text-xs text-white/30 font-silkscreen">Saving…</span>}
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add notes, context, or action details here…"
          rows={5}
          className="w-full p-3 rounded bg-black border border-white/20 text-white text-sm resize-none focus:outline-none focus:border-[#6E80DA] placeholder:text-white/20"
        />
      </div>

      <div className="border-t border-white/10" />

      <div className="flex flex-col gap-3">
        <p className="text-xs text-white/50 font-silkscreen uppercase tracking-widest">Comments</p>

        {commentsLoading ? (
          <p className="font-silkscreen text-white/30 text-xs">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="font-silkscreen text-white/20 text-xs">No comments yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((c) => (
              <li key={c.id} className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-silkscreen text-[#6E80DA] text-xs">{c.author_name}</span>
                  <span className="font-silkscreen text-white/30 text-xs">{formatNZDate(c.created_at)}</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{c.message}</p>
              </li>
            ))}
            <div ref={commentsEndRef} />
          </ul>
        )}

        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
          placeholder="Add a comment… (⌘↵ to submit)"
          rows={3}
          className="w-full p-3 rounded bg-black border border-white/20 text-white text-sm resize-none focus:outline-none focus:border-[#6E80DA] placeholder:text-white/20"
        />
        <button
          onClick={handleAddComment}
          disabled={!commentText.trim() || commentSubmitting}
          className="w-full py-2 border border-[#6E80DA] rounded font-silkscreen text-white text-sm hover:bg-[#6E80DA]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {commentSubmitting ? "Posting…" : "Post Comment"}
        </button>
      </div>
    </aside>
  );
}

// ── Event Todo Panel ───────────────────────────────────────────────────────────

function EventTodoPanel({
  event,
  onClose,
}: {
  event: PublicEvent;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<EventTodoItem[]>([]);
  const [eventNote, setEventNote] = useState("");
  const [docLinks, setDocLinks] = useState<EventDocLink[]>([]);
  const [activeTodo, setActiveTodo] = useState<EventTodoItem | null>(null);

  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveTodo(null);
    Promise.all([
      loadEventTodos(event.id),
      loadEventNote(event.id),
      loadEventDocLinks(event.id),
    ])
      .then(([todoData, noteData, linkData]) => {
        if (cancelled) return;
        setTodos(todoData);
        setEventNote(noteData?.content ?? "");
        setDocLinks(linkData);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load event todo data:", err);
        alert("Failed to load data. Please try again.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [event.id]);

  const handleToggle = async (id: string, completed: boolean) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    setActiveTodo((prev) => (prev?.id === id ? { ...prev, completed } : prev));
    try {
      await toggleTodoItem(id, completed);
    } catch {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
    }
  };

  const handleNotesChange = (id: string, notes: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, item_notes: notes } : t)));
    setActiveTodo((prev) => (prev?.id === id ? { ...prev, item_notes: notes } : prev));
  };

  const handleLabelChange = (id: string, label: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
    setActiveTodo((prev) => (prev?.id === id ? { ...prev, label } : prev));
  };

  const handleAddTask = async () => {
    const label = newTaskLabel.trim();
    if (!label) return;
    try {
      const item = await addTodoItem(event.id, label);
      setTodos((prev) => [...prev, item]);
      setNewTaskLabel("");
    } catch {
      alert("Failed to add task. Please try again.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (activeTodo?.id === id) setActiveTodo(null);
    try {
      await deleteTodoItem(id);
    } catch {
      alert("Failed to delete task. Please try again.");
    }
  };

  const handleEventNoteChange = (value: string) => {
    setEventNote(value);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    setNoteSaving(true);
    noteTimer.current = setTimeout(async () => {
      try {
        await saveEventNote(event.id, value);
      } catch {
        /* retry */
      } finally {
        setNoteSaving(false);
      }
    }, 1000);
  };

  const handleAddLink = async () => {
    const title = newLinkTitle.trim();
    const url = newLinkUrl.trim();
    if (!title || !url) return;
    try {
      const link = await addDocLink(event.id, title, url);
      setDocLinks((prev) => [...prev, link]);
      setNewLinkTitle("");
      setNewLinkUrl("");
    } catch {
      alert("Failed to add link. Please try again.");
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Remove this link?")) return;
    setDocLinks((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteDocLink(id);
    } catch {
      alert("Failed to delete link. Please try again.");
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40 sm:hidden"
        aria-hidden="true"
      />

      <aside className="fixed right-0 top-0 w-full sm:w-[520px] max-w-full h-full bg-[#07090f] border-l-2 border-[#6E80DA]/60 z-50 overflow-y-auto shadow-2xl flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 bg-[#07090f] border-b border-white/10 px-5 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex flex-col gap-0.5 min-w-0">
            <button
              onClick={onClose}
              className="text-white/40 font-silkscreen text-xs hover:text-white transition-colors self-start mb-1"
            >
              ← All Events
            </button>
            <h2 className="font-silkscreen text-white text-sm leading-snug">{event.title}</h2>
            <p className="font-silkscreen text-white/40 text-xs">{formatEventDate(event.event_date)}</p>
          </div>
          {!loading && (
            <span className={`shrink-0 mt-1 px-2 py-1 rounded font-silkscreen text-xs border ${
              completedCount === todos.length && todos.length > 0
                ? "border-green-500/60 text-green-400"
                : "border-white/20 text-white/50"
            }`}>
              {completedCount}/{todos.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <p className="font-pixelify text-white/50">Loading…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 px-5 py-6">

            {/* Checklist */}
            <section>
              <p className="text-xs text-white/40 font-silkscreen uppercase tracking-widest mb-3">Checklist</p>
              <ul className="flex flex-col gap-2">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className={`flex items-center gap-3 border rounded px-3 py-3 cursor-pointer transition-colors ${
                      activeTodo?.id === todo.id
                        ? "border-[#6E80DA] bg-[#6E80DA]/10"
                        : "border-white/10 hover:border-white/25"
                    }`}
                    onClick={() => setActiveTodo(activeTodo?.id === todo.id ? null : todo)}
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={(e) => { e.stopPropagation(); handleToggle(todo.id, e.target.checked); }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-[#6E80DA] cursor-pointer shrink-0"
                    />
                    <span className={`flex-1 font-silkscreen text-xs leading-relaxed ${todo.completed ? "line-through text-white/25" : "text-white"}`}>
                      {todo.label}
                    </span>
                    {todo.item_notes && (
                      <span className="text-white/25 text-xs font-silkscreen shrink-0">notes</span>
                    )}
                    {!todo.is_default && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(todo.id); }}
                        className="text-white/20 hover:text-red-400 transition-colors shrink-0 text-base leading-none"
                        title="Delete task"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 mt-3">
                <input
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Add a task…"
                  className="flex-1 p-2 rounded bg-black border border-white/15 text-white text-xs font-silkscreen focus:outline-none focus:border-[#6E80DA] placeholder:text-white/20"
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskLabel.trim()}
                  className="px-3 py-2 border border-[#6E80DA] rounded font-silkscreen text-white text-xs hover:bg-[#6E80DA]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </section>

            {/* General Notes */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs text-white/40 font-silkscreen uppercase tracking-widest">Notes</p>
                {noteSaving && <span className="text-xs text-white/25 font-silkscreen">Saving…</span>}
              </div>
              <textarea
                value={eventNote}
                onChange={(e) => handleEventNoteChange(e.target.value)}
                placeholder="General event notes, reminders, context…"
                rows={5}
                className="w-full p-3 rounded bg-black border border-white/15 text-white text-sm resize-y focus:outline-none focus:border-[#6E80DA] placeholder:text-white/20"
              />
            </section>

            {/* Linked Documents */}
            <section>
              <p className="text-xs text-white/40 font-silkscreen uppercase tracking-widest mb-3">Linked Documents</p>

              {docLinks.length > 0 ? (
                <ul className="flex flex-col gap-2 mb-3">
                  {docLinks.map((link) => (
                    <li key={link.id} className="flex items-center gap-3 border border-white/10 rounded px-3 py-2.5">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 font-silkscreen text-[#6E80DA] hover:text-white text-xs transition-colors truncate"
                      >
                        {link.title}
                      </a>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-white/20 hover:text-red-400 transition-colors shrink-0 text-base leading-none"
                        title="Remove link"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-silkscreen text-white/25 text-xs mb-3">No documents linked yet.</p>
              )}

              <div className="flex flex-col gap-2">
                <input
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Link title (e.g. Meeting Minutes)"
                  className="w-full p-2 rounded bg-black border border-white/15 text-white text-xs font-silkscreen focus:outline-none focus:border-[#6E80DA] placeholder:text-white/20"
                />
                <div className="flex gap-2">
                  <input
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                    placeholder="https://docs.google.com/…"
                    className="flex-1 p-2 rounded bg-black border border-white/15 text-white text-xs font-silkscreen focus:outline-none focus:border-[#6E80DA] placeholder:text-white/20"
                  />
                  <button
                    onClick={handleAddLink}
                    disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                    className="px-3 py-2 border border-[#6E80DA] rounded font-silkscreen text-white text-xs hover:bg-[#6E80DA]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </aside>

      {/* Task detail sidebar stacked on top */}
      {activeTodo && (
        <TodoItemSidebar
          item={activeTodo}
          onClose={() => setActiveTodo(null)}
          onToggle={handleToggle}
          onNotesChange={handleNotesChange}
          onLabelChange={handleLabelChange}
        />
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const getScreenSize = () => {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 768) return "sm";
  if (w < 1024) return "tablet";
  if (w < 1280) return "desktop";
  return "large";
};

const getEventsPerPage = (isUpcoming: boolean) => {
  const s = getScreenSize();
  if (isUpcoming) {
    return s === "mobile" || s === "sm" || s === "tablet" ? 2 : 3;
  }
  return s === "mobile" ? 3 : s === "sm" || s === "tablet" ? 4 : 6;
};

export default function EventTodo() {
  const { loading: authLoading, authorized } = useAdminDashboard();
  const { upcomingEvents, pastEvents, loading: eventsLoading, error } = useEvents();

  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);

  // Pagination
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);
  const [upcomingPerPage, setUpcomingPerPage] = useState(() => getEventsPerPage(true));
  const [pastPerPage, setPastPerPage] = useState(() => getEventsPerPage(false));
  const [upcomingDirection, setUpcomingDirection] = useState(1);
  const [pastDirection, setPastDirection] = useState(1);

  // Tag filters
  const [upcomingTagFilter, setUpcomingTagFilter] = useState<string | null>(null);
  const [pastTagFilter, setPastTagFilter] = useState<string | null>(null);

  const upcomingTags = useMemo(() => Array.from(new Set(upcomingEvents.map((e) => e.tag).filter(Boolean))), [upcomingEvents]);
  const pastTags = useMemo(() => Array.from(new Set(pastEvents.map((e) => e.tag).filter(Boolean))), [pastEvents]);

  const filteredUpcoming = useMemo(() => upcomingTagFilter ? upcomingEvents.filter((e) => e.tag === upcomingTagFilter) : upcomingEvents, [upcomingEvents, upcomingTagFilter]);
  const filteredPast = useMemo(() => pastTagFilter ? pastEvents.filter((e) => e.tag === pastTagFilter) : pastEvents, [pastEvents, pastTagFilter]);

  // Swipe state
  const [upcomingTouchStart, setUpcomingTouchStart] = useState<number | null>(null);
  const [upcomingTouchEnd, setUpcomingTouchEnd] = useState<number | null>(null);
  const [pastTouchStart, setPastTouchStart] = useState<number | null>(null);
  const [pastTouchEnd, setPastTouchEnd] = useState<number | null>(null);
  const minSwipe = 50;

  useEffect(() => {
    const handleResize = () => {
      setUpcomingPage(0);
      setPastPage(0);
      setUpcomingPerPage(getEventsPerPage(true));
      setPastPerPage(getEventsPerPage(false));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedEvent(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const paginate = (items: PublicEvent[], page: number, perPage: number) => ({
    items: items.slice(page * perPage, page * perPage + perPage),
    totalPages: Math.ceil(items.length / perPage),
  });

  const { items: paginatedUpcoming, totalPages: upcomingTotalPages } = paginate(filteredUpcoming, upcomingPage, upcomingPerPage);
  const { items: paginatedPast, totalPages: pastTotalPages } = paginate(filteredPast, pastPage, pastPerPage);

  const handleUpcomingPageChange = (newPage: number) => {
    setUpcomingDirection(newPage > upcomingPage ? 1 : -1);
    setTimeout(() => setUpcomingPage(newPage), 0);
  };
  const handlePastPageChange = (newPage: number) => {
    setPastDirection(newPage > pastPage ? 1 : -1);
    setTimeout(() => setPastPage(newPage), 0);
  };

  const handleCardFlipChange = useCallback((event: PublicEvent, flipped: boolean) => {
    if (flipped) setSelectedEvent(event);
  }, []);

  const closePanel = useCallback(() => setSelectedEvent(null), []);

  if (authLoading) {
    return (
      <>
        <BinaryBackground />
        <Header />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="font-pixelify text-white">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!authorized) return null;

  if (eventsLoading) {
    return (
      <main className="relative min-h-screen">
        <BinaryBackground />
        <Header />
        <div className="flex justify-center mt-[20vh] min-h-[80vh]">
          <p className="font-pixelify text-white">Loading events...</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative min-h-screen">
        <BinaryBackground />
        <Header />
        <div className="flex justify-center mt-[20vh] min-h-[80vh]">
          <p className="font-pixelify text-red-400">{error}</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen select-none">
      {/* Overlay behind panel on desktop */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40 hidden sm:block"
            onClick={closePanel}
          />
        )}
      </AnimatePresence>

      <BinaryBackground />
      <Header />

      {/* Back to dashboard */}
      <div className="mx-[1vw] sm:mx-[5vw] md:mx-[6vw] lg:mx-[7.5vw] mt-4">
        <Link
          to="/admin/dashboard"
          className="font-silkscreen text-white/40 hover:text-white text-xs transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* UPCOMING EVENTS */}
      <div className="lg:hidden min-h-[10vh]">
        <PageTitle title="Upcoming Events" className="scale-110 ml-5" />
      </div>
      <div className="hidden lg:flex mx-auto w-[88.75vw] justify-between">
        <PageTitle title="Upcoming Events" className="pl-0! ml-20! scale-110" />
        <div className="flex items-center gap-3 mr-[4.725vw]">
          <span className="font-silkscreen text-white/60 text-base mr-2">Filter:</span>
          <button
            onClick={() => { setUpcomingTagFilter(null); setUpcomingPage(0); }}
            className={`px-4 py-2 font-silkscreen text-base border transition-colors ${upcomingTagFilter === null ? "bg-purple-500/30 border-purple-400 text-white" : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"}`}
          >
            All
          </button>
          {upcomingTags.map((tag) => (
            <button
              key={tag}
              onClick={() => { setUpcomingTagFilter(tag!); setUpcomingPage(0); }}
              className={`px-4 py-2 font-silkscreen text-base border transition-colors ${upcomingTagFilter === tag ? "bg-purple-500/30 border-purple-400 text-white" : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <section
        className="transition-all duration-500 ease-in-out mx-[1vw] sm:mx-[5vw] md:mx-[6vw] lg:mx-[7.5vw] mb-[3vh] sm:mb-[4vh] md:mb-[5vh] min-h-[20vh]"
        onTouchStart={(e) => { setUpcomingTouchEnd(null); setUpcomingTouchStart(e.targetTouches[0].clientX); }}
        onTouchMove={(e) => setUpcomingTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={() => {
          if (!upcomingTouchStart || !upcomingTouchEnd) return;
          const d = upcomingTouchStart - upcomingTouchEnd;
          if (d > minSwipe && upcomingPage < upcomingTotalPages - 1) handleUpcomingPageChange(upcomingPage + 1);
          if (d < -minSwipe && upcomingPage > 0) handleUpcomingPageChange(upcomingPage - 1);
        }}
      >
        {upcomingEvents.length === 0 ? (
          <p className="font-pixelify text-white text-center text-sm sm:text-base">No upcoming events.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 sm:gap-y-10 md:gap-y-12 lg:gap-y-15 gap-x-4 sm:gap-x-6 md:gap-x-8 justify-items-center">
              <AnimatePresence mode="wait" initial={false}>
                {paginatedUpcoming.map((event, index) => (
                  <motion.div
                    key={`${event.id}-${upcomingPage}`}
                    initial={{ opacity: 0, x: upcomingDirection * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: upcomingDirection * -30 }}
                    transition={{ duration: 0.4, delay: index * 0.1, ease: "easeInOut" }}
                  >
                    <EventsCard
                      id={event.id}
                      title={event.title}
                      image={event.image_url || "/events/placeholder_event.png"}
                      imageAlt={event.title}
                      tag={event.tag || "Event"}
                      date={event.event_date}
                      time={event.event_time || ""}
                      location={event.location || ""}
                      description={event.description || ""}
                      registerUrl=""
                      groupRSVPEnabled={false}
                      rsvpQuestions={[]}
                      isFlipped={false}
                      onFlipChange={(flipped) => handleCardFlipChange(event, flipped)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {upcomingTotalPages > 1 && (
              <div className="flex justify-center items-center mt-6 sm:mt-8 md:mt-10 font-silkscreen">
                <Pagination currentPage={upcomingPage} totalPages={upcomingTotalPages} onPageChange={handleUpcomingPageChange} />
              </div>
            )}
          </>
        )}
      </section>

      {/* PAST EVENTS */}
      <div className="lg:hidden">
        <PageTitle title="Past Events" className="scale-110 ml-5" />
      </div>
      <div className="hidden lg:flex mx-auto w-[88.75vw] justify-between">
        <PageTitle title="Past Events" className="pl-0! ml-20! scale-110" />
        <div className="flex items-center gap-3 mr-[4.725vw]">
          <span className="font-silkscreen text-white/60 text-base mr-2">Filter:</span>
          <button
            onClick={() => { setPastTagFilter(null); setPastPage(0); }}
            className={`px-4 py-2 font-silkscreen text-base border transition-colors ${pastTagFilter === null ? "bg-purple-500/30 border-purple-400 text-white" : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"}`}
          >
            All
          </button>
          {pastTags.map((tag) => (
            <button
              key={tag}
              onClick={() => { setPastTagFilter(tag!); setPastPage(0); }}
              className={`px-4 py-2 font-silkscreen text-base border transition-colors ${pastTagFilter === tag ? "bg-purple-500/30 border-purple-400 text-white" : "border-white/30 text-white/60 hover:border-white/50 hover:text-white"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <section
        className="transition-all duration-500 ease-in-out mx-[6.5vw] sm:mx-[5vw] md:mx-[6vw] lg:mx-[7.5vw] mb-[3vh] sm:mb-[4vh] md:mb-[5vh] min-h-[20vh]"
        onTouchStart={(e) => { setPastTouchEnd(null); setPastTouchStart(e.targetTouches[0].clientX); }}
        onTouchMove={(e) => setPastTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={() => {
          if (!pastTouchStart || !pastTouchEnd) return;
          const d = pastTouchStart - pastTouchEnd;
          if (d > minSwipe && pastPage < pastTotalPages - 1) handlePastPageChange(pastPage + 1);
          if (d < -minSwipe && pastPage > 0) handlePastPageChange(pastPage - 1);
        }}
      >
        {pastEvents.length === 0 ? (
          <p className="font-pixelify text-white text-center text-sm sm:text-base">No past events.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 sm:gap-y-10 md:gap-y-12 lg:gap-y-15 gap-x-4 sm:gap-x-6 md:gap-x-8 justify-items-center">
              <AnimatePresence mode="wait" initial={false}>
                {paginatedPast.map((event, index) => (
                  <motion.div
                    key={`${event.id}-${pastPage}`}
                    initial={{ opacity: 0, x: pastDirection * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: pastDirection * -30 }}
                    transition={{ duration: 0.4, delay: index * 0.1, ease: "easeInOut" }}
                  >
                    <EventsCard
                      id={event.id}
                      title={event.title}
                      image={event.image_url || "/events/placeholder_event.png"}
                      imageAlt={event.title}
                      tag={event.tag || "Event"}
                      date={event.event_date}
                      time={event.event_time || ""}
                      location={event.location || ""}
                      description={event.description || ""}
                      registerUrl=""
                      groupRSVPEnabled={false}
                      rsvpQuestions={[]}
                      isFlipped={false}
                      onFlipChange={(flipped) => handleCardFlipChange(event, flipped)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {pastTotalPages > 1 && (
              <div className="flex justify-center items-center mt-6 sm:mt-8 md:mt-10 font-silkscreen">
                <Pagination currentPage={pastPage} totalPages={pastTotalPages} onPageChange={handlePastPageChange} />
              </div>
            )}
          </>
        )}
      </section>

      <Footer />

      {/* Event todo panel */}
      {selectedEvent && (
        <EventTodoPanel event={selectedEvent} onClose={closePanel} />
      )}
    </main>
  );
}
