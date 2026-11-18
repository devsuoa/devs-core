import { api, fetchMe } from "./api";
import { Task, TaskStatus } from "../components/TaskCard";

export const STATUSES: TaskStatus[] = ["todo", "doing", "review", "done"];

export const GLOBAL_TEAMS = ["president", "senior_advisor"];

export function toDbTask(task: Task) {
  return {
    id: task.id,
    name: task.name,
    label: task.label,
    assignee: task.assignee,
    status: task.status,
    description: task.description,
    team: task.team,
    order: task.order,
    archived: task.archived,
    due_date: task.due_date,
  };
}

export function sortByOrder(list: Task[]) {
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function reindex(list: Task[]) {
  return list.map((t, idx) => ({ ...t, order: idx }));
}

export function isStatus(id: unknown): id is TaskStatus {
  return typeof id === "string" && STATUSES.includes(id as TaskStatus);
}

export async function getCurrentUserTeam(): Promise<string> {
  try {
    return (await fetchMe()).team ?? "";
  } catch {
    return "";
  }
}

export async function getCurrentUserId(): Promise<string> {
  try {
    return (await fetchMe()).id;
  } catch {
    return "";
  }
}

export async function getCurrentUserRole(): Promise<{
  role: string;
  isSuperuser: boolean;
}> {
  try {
    const me = await fetchMe();
    return { role: me.role, isSuperuser: me.is_superuser };
  } catch {
    return { role: "", isSuperuser: false };
  }
}

/** Tasks the logged-in exec can see: their team's, or every team's for the president and senior advisor. */
export async function loadTasks(): Promise<Task[]> {
  const data = await api<any[]>("/api/admin/tasks");
  return data.map((t) => ({
    ...t,
    archived: t.archived ?? false,
    due_date: t.due_date ?? null,
    comments: [],
  }));
}

/** Saves a lane's new order (and status, after a drag between lanes) in one request. */
export async function persistLane(lane: Task[]) {
  try {
    await api("/api/admin/tasks/lanes", {
      method: "PUT",
      body: { updates: lane.map((t) => ({ id: t.id, status: t.status, order: t.order })) },
    });
  } catch (error) {
    console.error("persistLane failed:", error);
    throw error;
  }
}

export async function createTask(task: Task) {
  await api("/api/admin/tasks", { method: "POST", body: toDbTask(task) });
}

export async function updateTask(task: Task) {
  await api(`/api/admin/tasks/${encodeURIComponent(task.id)}`, {
    method: "PUT",
    body: toDbTask(task),
  });
}

export async function archiveTask(taskId: string) {
  await api(`/api/admin/tasks/${encodeURIComponent(taskId)}/archive`, { method: "POST" });
}

export type AdminUser = {
  id: string;
  username: string;
};

export async function loadAdmins(): Promise<AdminUser[]> {
  try {
    return await api<AdminUser[]>("/api/admin/admins");
  } catch {
    return [];
  }
}

export async function loadComments(taskId: string) {
  try {
    return await api<any[]>(`/api/admin/tasks/${encodeURIComponent(taskId)}/comments`);
  } catch {
    return [];
  }
}

/** The API records the logged-in exec as the author. */
export function addComment(taskId: string, message: string) {
  return api<any>(`/api/admin/tasks/${encodeURIComponent(taskId)}/comments`, {
    method: "POST",
    body: { message },
  });
}

/** Only the author can edit a comment. */
export function updateComment(commentId: string, message: string) {
  return api<any>(`/api/admin/task-comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    body: { message },
  });
}

/** The author or a superuser can delete a comment. */
export async function deleteComment(commentId: string) {
  await api(`/api/admin/task-comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
}

export function formatNZDate(utcDate: string) {
  const date = new Date(utcDate);

  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
