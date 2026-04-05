import { supabase } from "./supabase";

export interface EventTodoItem {
  id: string;
  event_id: string;
  label: string;
  completed: boolean;
  is_default: boolean;
  order: number;
  item_notes: string;
  created_at: string;
}

export interface EventNote {
  id: string;
  event_id: string;
  content: string;
  updated_at: string;
}

export interface EventDocLink {
  id: string;
  event_id: string;
  title: string;
  url: string;
  created_at: string;
}

const DEFAULT_TASKS = [
  "Room booking form submitted",
  "Marketing request submitted",
  "Catering ordered",
  "Budget approved",
];

// Deduplicates concurrent calls for the same event so that parallel React
// effects (e.g. StrictMode double-invoke) never both try to seed.
const _loadInFlight = new Map<string, Promise<EventTodoItem[]>>();

export function loadEventTodos(eventId: string): Promise<EventTodoItem[]> {
  const inflight = _loadInFlight.get(eventId);
  if (inflight) return inflight;

  const promise = _fetchAndSeed(eventId);
  _loadInFlight.set(eventId, promise);
  promise.finally(() => _loadInFlight.delete(eventId));
  return promise;
}

async function _fetchAndSeed(eventId: string): Promise<EventTodoItem[]> {
  const { data, error } = await supabase
    .from("event_todo_items")
    .select("*")
    .eq("event_id", eventId)
    .order("order", { ascending: true });

  if (error) throw error;

  if (data && data.length > 0) {
    return data as EventTodoItem[];
  }

  // Auto-seed the 4 default tasks on first open
  const seeds = DEFAULT_TASKS.map((label, idx) => ({
    event_id: eventId,
    label,
    completed: false,
    is_default: true,
    order: idx,
    item_notes: "",
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("event_todo_items")
    .insert(seeds)
    .select();

  if (insertError) throw insertError;

  return (inserted ?? []) as EventTodoItem[];
}

export async function toggleTodoItem(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from("event_todo_items")
    .update({ completed })
    .eq("id", id);

  if (error) throw error;
}

export async function updateTodoItemNotes(id: string, item_notes: string): Promise<void> {
  const { error } = await supabase
    .from("event_todo_items")
    .update({ item_notes })
    .eq("id", id);

  if (error) throw error;
}

export async function updateTodoItemLabel(id: string, label: string): Promise<void> {
  const { error } = await supabase
    .from("event_todo_items")
    .update({ label })
    .eq("id", id);

  if (error) throw error;
}

export async function addTodoItem(eventId: string, label: string): Promise<EventTodoItem> {
  const { data: existing } = await supabase
    .from("event_todo_items")
    .select("order")
    .eq("event_id", eventId)
    .order("order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].order as number) + 1 : 0;

  const { data, error } = await supabase
    .from("event_todo_items")
    .insert({
      event_id: eventId,
      label,
      completed: false,
      is_default: false,
      order: nextOrder,
      item_notes: "",
    })
    .select()
    .single();

  if (error) throw error;

  return data as EventTodoItem;
}

export async function deleteTodoItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("event_todo_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function loadEventNote(eventId: string): Promise<EventNote | null> {
  const { data, error } = await supabase
    .from("event_notes")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;

  return data as EventNote | null;
}

export async function saveEventNote(eventId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from("event_notes")
    .upsert(
      { event_id: eventId, content, updated_at: new Date().toISOString() },
      { onConflict: "event_id" }
    );

  if (error) throw error;
}

export async function loadEventDocLinks(eventId: string): Promise<EventDocLink[]> {
  const { data, error } = await supabase
    .from("event_doc_links")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as EventDocLink[];
}

export async function addDocLink(
  eventId: string,
  title: string,
  url: string
): Promise<EventDocLink> {
  const { data, error } = await supabase
    .from("event_doc_links")
    .insert({ event_id: eventId, title, url })
    .select()
    .single();

  if (error) throw error;

  return data as EventDocLink;
}

export async function deleteDocLink(id: string): Promise<void> {
  const { error } = await supabase
    .from("event_doc_links")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ── Comments ───────────────────────────────────────────────────────────────────

export interface TodoComment {
  id: string;
  todo_item_id: string;
  author_id: string;
  author_name: string;
  message: string;
  created_at: string;
}

export async function loadTodoComments(todoItemId: string): Promise<TodoComment[]> {
  const { data, error } = await supabase
    .from("event_todo_comments")
    .select("*")
    .eq("todo_item_id", todoItemId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as TodoComment[];
}

export async function addTodoComment(
  todoItemId: string,
  message: string
): Promise<TodoComment> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const authorName = profile?.username ?? user.email ?? "Unknown";

  const { data, error } = await supabase
    .from("event_todo_comments")
    .insert({
      todo_item_id: todoItemId,
      author_id: user.id,
      author_name: authorName,
      message,
    })
    .select()
    .single();

  if (error) throw error;

  return data as TodoComment;
}
