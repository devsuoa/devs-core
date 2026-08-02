import { useEffect, useState } from "react";
import { Task, Comment } from "./TaskCard";
import CloseConfirmDialog from "./CloseConfirmDialog";
import DescriptionEditorDialog from "./DescriptionEditorDialog.tsx";
import {
  GLOBAL_TEAMS,
  loadAdmins,
  loadComments,
  addComment,
  getCurrentUserTeam,
  archiveTask,
  deleteComment,
  AdminUser,
  formatNZDate,
  getCurrentUserId,
  getCurrentUserRole,
  updateComment,
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
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserIsSuperuser, setCurrentUserIsSuperuser] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [showDescriptionEditor, setShowDescriptionEditor] = useState(false);
  const [showMobileDescriptionEditor, setShowMobileDescriptionEditor] =
    useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(
    mode === "edit" && Boolean(task),
  );

  const [form, setForm] = useState({
    name: task?.name ?? "",
    label: task?.label ?? "",
    assignee: task?.assignee ?? "",
    description: task?.description ?? "",
    team: task?.team ?? "",
    due_date: task?.due_date ?? "",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const shouldShowLoading = mode === "edit" && Boolean(task);
      setIsTaskLoading(shouldShowLoading);

      if (task) {
        setForm({
          name: task.name ?? "",
          label: task.label ?? "",
          assignee: task.assignee ?? "",
          description: task.description ?? "",
          team: task.team ?? "",
          due_date: task.due_date ?? "",
        });
        setComments([]);
        setCommentText("");
        setEditingCommentId(null);
        setEditingCommentText("");
        setShowDescriptionEditor(false);
        setShowMobileDescriptionEditor(false);
      }

      try {
        const team = await getCurrentUserTeam();
        const userId = await getCurrentUserId();
        const userRole = await getCurrentUserRole();
        if (cancelled) return;

        setCurrentTeam(team);
        setCurrentUserId(userId);
        setCurrentUserRole(userRole.role);
        setCurrentUserIsSuperuser(userRole.isSuperuser);
        setAdmins(await loadAdmins());

        if (task) setComments(await loadComments(task.id));
        if (!task) setForm((f) => ({ ...f, team }));
      } catch (error) {
        console.error("Failed to load sidebar data:", error);
      } finally {
        if (!cancelled) {
          setIsTaskLoading(false);
        }
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [mode, task]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll =
      document.documentElement.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overscrollBehavior =
        previousHtmlOverscroll;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, []);

  const canChooseTeam = GLOBAL_TEAMS.includes(currentTeam);

  const requestClose = () => {
    setShowCloseConfirm(true);
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  const requestArchive = () => {
    if (!task) return;
    setShowArchiveConfirm(true);
  };

  const cancelArchive = () => {
    if (isArchiving) return;
    setShowArchiveConfirm(false);
  };

  const confirmArchive = async () => {
    if (!task) return;

    try {
      setIsArchiving(true);
      await archiveTask(task.id);
      setShowArchiveConfirm(false);
      onUpdate({ ...task, archived: true });
      onClose();
    } catch (error) {
      console.error("Failed to archive task:", error);
      alert("Failed to archive task. Please try again.");
    } finally {
      setIsArchiving(false);
    }
  };

  const submitAndMaybeClose = (closeAfterSave: boolean) => {
    if (!form.name.trim() || !form.assignee) return;

    const payload: Task = {
      id:
        task?.id ?? `TASK-${crypto.randomUUID().substring(0, 4).toUpperCase()}`,
      name: form.name.trim(),
      label: form.label.trim() || "general",
      assignee: form.assignee,
      description: form.description,
      team: canChooseTeam ? form.team : currentTeam,
      status: task?.status ?? "todo",
      order: task?.order ?? 0,
      archived: task?.archived ?? false,
      due_date: form.due_date || null,
      comments: task?.comments ?? comments,
    };

    if (mode === "create") {
      onCreate(payload);
    } else {
      onUpdate(payload);
    }

    if (closeAfterSave) {
      onClose();
    }
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

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.message);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const saveEditedComment = async () => {
    if (!editingCommentId || !editingCommentText.trim()) return;

    try {
      const updatedComment = await updateComment(
        editingCommentId,
        editingCommentText.trim(),
      );
      setComments((previousComments) =>
        previousComments.map((comment) =>
          comment.id === editingCommentId ? updatedComment : comment,
        ),
      );
      cancelEditingComment();
    } catch (error) {
      console.error("Failed to edit comment:", error);
      alert("Failed to edit comment. Please try again.");
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((previousComments) =>
        previousComments.filter((comment) => comment.id !== commentId),
      );
      if (editingCommentId === commentId) {
        cancelEditingComment();
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  const canModerateAllComments =
    currentUserIsSuperuser ||
    currentUserRole === "admin" ||
    currentUserRole === "president";

  return (
    <>
      {/* Mobile backdrop - tap to close */}
      <div
        onClick={requestClose}
        className="fixed inset-0 bg-black/60 z-40 "
        aria-hidden="true"
      />
      <aside className="fixed right-0 top-0 w-full sm:w-105 max-w-full h-full bg-black border-l-2 border-[#6E80DA] z-50 overflow-visible shadow-lg">
        <div className="relative h-full overflow-y-auto p-4 sm:p-6">
          <h2 className="font-sans text-white uppercase mb-6">
            {mode === "create" ? "Task Creator" : "Task Editor"}
          </h2>

          {isTaskLoading ? (
            <div className="flex h-[calc(100%-3rem)] items-center justify-center">
              <p className="font-sans text-sm uppercase tracking-wide text-white/80">
                Loading...
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-white/80 font-sans mb-1"> Task Name</p>
              <input
                placeholder="Task name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mb-3 p-2 rounded bg-black border border-white/30 text-white"
              />

              <p className="text-sm text-white/80 font-sans mb-1"> Label</p>
              <input
                placeholder="Label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full mb-3 p-2 rounded bg-black border border-white/30 text-white"
              />

              <p className="text-sm text-white/80 font-sans mb-1"> Assignee</p>
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

              <p className="text-sm text-white/80 font-sans mb-1"> Due Date</p>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full mb-3 p-2 rounded bg-black border border-white/30 text-white"
              />

              {canChooseTeam && (
                <>
                  <p className="text-sm text-white/80 font-sans mb-1"> Team</p>
                  <input
                    placeholder="Team"
                    value={form.team}
                    onChange={(e) => setForm({ ...form, team: e.target.value })}
                    className="w-full mb-7 p-2 rounded bg-black border border-white/30 text-white"
                  />
                </>
              )}

              <div className="mb-10 hidden md:block">
                <button
                  onClick={() => setShowDescriptionEditor(true)}
                  className="w-full rounded-xl border border-[#6E80DA] px-4 py-2.5 text-center text-sm font-sans font-semibold text-white transition-all duration-200 hover:bg-[#6E80DA]/35 hover:shadow-[0_0_0_1px_rgba(110,128,218,0.45)] active:translate-y-px"
                >
                  Open Description Editor
                </button>
              </div>

              <div className="mb-4 md:hidden">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-sm text-white/80 font-sans">
                    {" "}
                    Description
                  </p>
                </div>
                <button
                  onClick={() =>
                    setShowMobileDescriptionEditor((previous) => !previous)
                  }
                  className="w-full rounded border border-white/30 bg-black px-3 py-2 text-left text-sm font-sans text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Description Editor{" "}
                  {showMobileDescriptionEditor ? "(Collapse)" : "(Expand)"}
                </button>

                {showMobileDescriptionEditor && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((previous) => ({
                          ...previous,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter description..."
                      className="h-28 w-full rounded border border-white/20 bg-black p-2 text-sm text-white"
                    />
                  </div>
                )}
              </div>
              <div className="mb-5">
                <div className="flex flex-row gap-3 sm:gap-5">
                  {mode === "edit" ? (
                    <>
                      <button
                        onClick={() => submitAndMaybeClose(false)}
                        className="w-full py-2 border rounded-xl font-sans border-[#6E80DA] text-white transition hover:bg-[#6E80DA]/15"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => submitAndMaybeClose(true)}
                        className="w-full py-2 border rounded-xl font-sans border-[#6E80DA] text-white transition hover:bg-[#6E80DA]/15"
                      >
                        Save and Close
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => submitAndMaybeClose(false)}
                      className="w-full py-2 border rounded-xl font-sans border-[#6E80DA] text-white transition hover:bg-[#6E80DA]/15"
                    >
                      Create Task
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-5">
                <div className="flex flex-row gap-3 sm:gap-5">
                  <button
                    onClick={requestClose}
                    className="w-full py-2 border rounded-xl font-sans border-red-500 text-red-400 transition hover:bg-red-500/15 hover:text-red-300"
                  >
                    Discard Changes
                  </button>
                  {mode === "edit" && task && (
                    <button
                      onClick={requestArchive}
                      disabled={isArchiving}
                      className="w-full py-2 border rounded-xl font-sans border-red-500 text-red-400 transition hover:bg-red-500/15 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-red-400"
                    >
                      Archive Task
                    </button>
                  )}
                </div>
              </div>
              {mode === "edit" && task && (
                <>
                  <div className="mt-6">
                    <p className="text-sm text-white/80 font-sans mb-1">
                      {" "}
                      Comments
                    </p>

                    {comments.map((c) => {
                      const canEditOwnComment =
                        c.author_id === currentUserId || canModerateAllComments;
                      const isEditing = editingCommentId === c.id;

                      return (
                        <div
                          key={c.id}
                          className="mb-3 rounded-xl border border-white/10 p-3 text-sm text-white/80"
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 text-xs text-white/50">
                                {formatNZDate(c.created_at)} -{" "}
                                <strong>{c.author_name}</strong>
                              </div>
                              {isEditing ? (
                                <textarea
                                  value={editingCommentText}
                                  onChange={(e) =>
                                    setEditingCommentText(e.target.value)
                                  }
                                  className="w-full h-20 p-2 rounded bg-black border border-white/30 text-white"
                                />
                              ) : (
                                <p className="wrap-break-word text-white/80">
                                  {c.message}
                                </p>
                              )}
                            </div>

                            {canEditOwnComment && !isEditing && (
                              <div className="flex flex-row items-center gap-1 shrink-0">
                                <button
                                  onClick={() => startEditingComment(c)}
                                  className="rounded px-1.5 py-0.5 text-[10px] font-sans text-white/40 transition hover:bg-white/10 hover:text-white/70"
                                >
                                  Edit Comment
                                </button>
                                <button
                                  onClick={() => removeComment(c.id)}
                                  className="rounded px-1.5 py-0.5 text-[10px] font-sans text-white/35 transition hover:bg-white/10 hover:text-white/60"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={saveEditedComment}
                                className="rounded-xl border border-[#6E80DA] px-3 py-1.5 text-xs text-white transition hover:bg-[#6E80DA]/15"
                              >
                                Save Comment
                              </button>
                              <button
                                onClick={cancelEditingComment}
                                className="rounded-xl border border-white/20 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add comment..."
                      className="w-full h-16 mt-2 p-2 rounded bg-black border border-white/30 text-white"
                    />

                    <button
                      onClick={submitComment}
                      className="mt-2 w-full py-2 border rounded-xl font-sans border-[#6E80DA] text-white transition hover:bg-[#6E80DA]/15"
                    >
                      Add Comment
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {!isTaskLoading && (
          <DescriptionEditorDialog
            isOpen={showDescriptionEditor}
            initialValue={form.description}
            onClose={() => setShowDescriptionEditor(false)}
            onDiscard={() => setShowDescriptionEditor(false)}
            onStash={(description: string) => {
              setForm((previous) => ({ ...previous, description }));
              setShowDescriptionEditor(false);
            }}
          />
        )}
      </aside>
      <CloseConfirmDialog
        isOpen={showCloseConfirm}
        onCancel={cancelClose}
        onConfirm={confirmClose}
      />
      <CloseConfirmDialog
        isOpen={showArchiveConfirm}
        onCancel={cancelArchive}
        onConfirm={confirmArchive}
        title="Confirm Archive"
        description="Archive this task? You can still view it in archived items."
        cancelLabel="Cancel"
        confirmLabel={isArchiving ? "Archiving..." : "Archive Task"}
        disableConfirm={isArchiving}
      />
    </>
  );
}
