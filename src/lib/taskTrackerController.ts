import { supabase } from "./supabase";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";

  const { data } = await supabase.from("profiles").select("team").eq("id", user.id).single();

  return data?.team ?? "";
}

export async function loadTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("order", { ascending: true });

  if (error) throw error;

  return (
    data?.map((t: any) => ({
      ...t,
      archived: t.archived ?? false,
      due_date: t.due_date ?? null,
      comments: [],
    })) ?? []
  );
}

export async function persistLane(lane: Task[]) {
  const updates = lane.map((t) => ({
    id: t.id,
    status: t.status,
    order: t.order,
  }));
  try {
    const results = await Promise.allSettled(
      updates.map((u) =>
        supabase.from("tasks").update({ status: u.status, order: u.order }).eq("id", u.id),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error("Some updates failed:", failed);
      throw new Error(`Failed to update ${failed.length} tasks`);
    }
  } catch (error) {
    console.error("persistLane failed:", error);
    throw error;
  }
}

export async function createTask(task: Task) {
  await supabase.from("tasks").insert(toDbTask(task));
}

export async function updateTask(task: Task) {
  await supabase.from("tasks").update(toDbTask(task)).eq("id", task.id);
}

export async function archiveTask(taskId: string) {
  await supabase.from("tasks").update({ archived: true }).eq("id", taskId);
}

export type AdminUser = {
  id: string;
  username: string;
};

export async function loadAdmins(): Promise<AdminUser[]> {
  const { data } = await supabase.from("profiles").select("id, username").eq("role", "admin");

  return data ?? [];
}

export async function loadComments(taskId: string) {
  const { data } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");

  return data ?? [];
}

export async function addComment(taskId: string, message: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      author_id: user.id,
      author_name: user.user_metadata?.username ?? user.email ?? "Unknown",
      message,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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
