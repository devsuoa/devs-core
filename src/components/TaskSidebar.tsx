import { useEffect, useState } from "react";
import { Task, Comment } from "./TaskCard";
import {
  GLOBAL_TEAMS,
  loadAdmins,
  loadComments,
  addComment,
  getCurrentUserTeam,
  archiveTask,
  AdminUser,
  formatNZDate,
} from "../lib/taskTrackerController";

export default function TaskSidebar({
  mode,
  task,
  onClose,
  onCreate,
  onUpdate,
}: {
  mode: "create" | "edit";
  task?: Task;
  onClose: () => void;
  onCreate: (task: Task) => void;
  onUpdate: (task: Task) => void;
}) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentTeam, setCurrentTeam] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");

  const [form, setForm] = useState({
    name: task?.name ?? "",
    label: task?.label ?? "",
    assignee: task?.assignee ?? "",
    description: task?.description ?? "",
    team: task?.team ?? "",
    due_date: task?.due_date ?? "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const team = await getCurrentUserTeam();
        setCurrentTeam(team);
        setAdmins(await loadAdmins());

        if (task) setComments(await loadComments(task.id));
        if (!task) setForm((f) => ({ ...f, team }));
      } catch (error) {
        console.error("Failed to load sidebar data:", error);
      }
    };
    load();
  }, [task]);

  const canChooseTeam = GLOBAL_TEAMS.includes(currentTeam);

  const submit = () => {
    if (!form.name.trim() || !form.assignee) return;

    const payload: Task = {
      id: task?.id ?? `TASK-${crypto.randomUUID().substring(0, 4).toUpperCase()}`,
      name: form.name.trim(),
      label: form.label.trim() || "general",
      assignee: form.assignee,
      description: form.description,
      team: canChooseTeam ? form.team : currentTeam,
      status: task?.status ?? "todo",
      order: task?.order ?? 0,
      archived: false,
      due_date: form.due_date || null,
      comments: [],
    };

    mode === "create" ? onCreate(payload) : onUpdate(payload);
  };

  const submitComment = async () => {
    if (!task || !commentText.trim()) return;
    try {
      const c = await addComment(task.id, commentText.trim());
      if (c) {
        setComments((p) => [...p, c]);
        setCommentText("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  return (
    <>
      {/* Mobile backdrop - tap to close */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40 sm:hidden"
        aria-hidden="true"
      />
      <aside className="fixed right-0 top-0 w-full sm:w-[420px] max-w-full h-full bg-black border-l-2 border-[#6E80DA] p-4 sm:p-6 z-50 overflow-y-auto shadow-lg">
        <button onClick={onClose} className="text-white/70 mb-4">
          ← Close
        </button>

        <h2 className="font-silkscreen text-white uppercase mb-6">
          {mode === "create" ? "Create Task" : "Edit Task"}
        </h2>

        <p className="text-sm text-white/80 font-silkscreen mb-1"> Task Name</p>
        <input
          placeholder="Task name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full mb-3 p-2 rounded bg-black border border-white/30 text-white"
        />

        <p className="text-sm text-white/80 font-silkscreen mb-1"> Label</p>
        <input
          placeholder="Label"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="w-full mb-3 p-2 rounded bg-black border border-white/30 text-white"
        />

        <p className="text-sm text-white/80 font-silkscreen mb-1"> Assignee</p>
        <select
          value={form.assignee}
          onChange={(e) => setForm({ ...form, assignee: e.target.value })}
          className="w-full mb-3 p-2 rounded bg-black border border-white/30 text-white"
        >
          <option value="" disabled>
            Select assignee
          </option>
          {admins.map((a) => (
            <option key={a.id} value={a.username}>
              {a.username}
            </option>
          ))}
        </select>

        <p className="text-sm text-white/80 font-silkscreen mb-1"> Due Date</p>
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          className="w-full mb-3 p-2 rounded bg-black border border-white/30 text-white"
        />

        {canChooseTeam && (
          <>
            <p className="text-sm text-white/80 font-silkscreen mb-1"> Team</p>
            <input
              placeholder="Team"
              value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
              className="w-full mb-3 p-2 rounded bg-black border border-white/30 text-white"
            />
          </>
        )}

        <p className="text-sm text-white/80 font-silkscreen mb-1"> Description</p>
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full h-24 mb-4 p-2 rounded bg-black border border-white/30 text-white"
        />

        <button
          onClick={submit}
          className="w-full py-2 border rounded-xl font-silkscreen border-[#6E80DA] text-white"
        >
          {mode === "create" ? "Create Task" : "Save Changes"}
        </button>

        {mode === "edit" && task && (
          <>
            <div className="mt-6">
              <p className="text-sm text-white/80 font-silkscreen mb-1"> Comments</p>

              {comments.map((c) => (
                <div key={c.id} className="mb-2 text-white/80 text-sm">
                  {formatNZDate(c.created_at)} - <strong>{c.author_name}</strong>: {c.message}
                </div>
              ))}

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add comment..."
                className="w-full h-16 mt-2 p-2 rounded bg-black border border-white/30 text-white"
              />

              <button
                onClick={submitComment}
                className="mt-2 w-full py-2 border rounded-xl font-silkscreen border-[#6E80DA] text-white"
              >
                Add Comment
              </button>
            </div>

            <button
              onClick={async () => {
                if (!confirm("Archive this task?")) return;
                try {
                  await archiveTask(task.id);
                  onUpdate({ ...task, archived: true });
                  onClose();
                } catch (error) {
                  console.error("Failed to archive task:", error);
                  alert("Failed to archive task. Please try again.");
                }
              }}
              className="mt-6 w-full py-2 border rounded-xl font-silkscreen border-red-500 text-red-400"
            >
              Archive Task
            </button>
          </>
        )}
      </aside>
    </>
  );
}
