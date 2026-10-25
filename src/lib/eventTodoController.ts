import { api } from "./api";

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

const eventPath = (eventId: string) => `/api/admin/events/${encodeURIComponent(eventId)}`;
const todoPath = (id: string) => `/api/admin/todos/${encodeURIComponent(id)}`;

// Deduplicates concurrent calls for the same event (e.g. StrictMode double-invoke).
// The API also guards against seeding the default items twice.
const _loadInFlight = new Map<string, Promise<EventTodoItem[]>>();

/** The event's checklist. The API creates the default items the first time it's opened. */
export function loadEventTodos(eventId: string): Promise<EventTodoItem[]> {
  const inflight = _loadInFlight.get(eventId);
  if (inflight) return inflight;

  const promise = api<EventTodoItem[]>(`${eventPath(eventId)}/todos`);
  _loadInFlight.set(eventId, promise);
  promise.finally(() => _loadInFlight.delete(eventId));
  return promise;
}

export async function toggleTodoItem(id: string, completed: boolean): Promise<void> {
  await api(todoPath(id), { method: "PATCH", body: { completed } });
}

export async function updateTodoItemNotes(id: string, item_notes: string): Promise<void> {
  await api(todoPath(id), { method: "PATCH", body: { item_notes } });
}

export async function updateTodoItemLabel(id: string, label: string): Promise<void> {
  await api(todoPath(id), { method: "PATCH", body: { label } });
}

export function addTodoItem(eventId: string, label: string): Promise<EventTodoItem> {
  return api<EventTodoItem>(`${eventPath(eventId)}/todos`, { method: "POST", body: { label } });
}

export async function deleteTodoItem(id: string): Promise<void> {
  await api(todoPath(id), { method: "DELETE" });
}

export async function loadEventNote(eventId: string): Promise<EventNote | null> {
  return (await api<EventNote | undefined>(`${eventPath(eventId)}/note`)) ?? null;
}

export async function saveEventNote(eventId: string, content: string): Promise<void> {
  await api(`${eventPath(eventId)}/note`, { method: "PUT", body: { content } });
}

export function loadEventDocLinks(eventId: string): Promise<EventDocLink[]> {
  return api<EventDocLink[]>(`${eventPath(eventId)}/doc-links`);
}

export function addDocLink(eventId: string, title: string, url: string): Promise<EventDocLink> {
  return api<EventDocLink>(`${eventPath(eventId)}/doc-links`, { method: "POST", body: { title, url } });
}

export async function deleteDocLink(id: string): Promise<void> {
  await api(`/api/admin/doc-links/${encodeURIComponent(id)}`, { method: "DELETE" });
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

export function loadTodoComments(todoItemId: string): Promise<TodoComment[]> {
  return api<TodoComment[]>(`${todoPath(todoItemId)}/comments`);
}

/** The API records the logged-in exec as the author. */
export function addTodoComment(todoItemId: string, message: string): Promise<TodoComment> {
  return api<TodoComment>(`${todoPath(todoItemId)}/comments`, { method: "POST", body: { message } });
}
