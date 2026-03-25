# Task Tracker UI Components

These components power **`/admin/tasks`** together with **`taskTrackerController`**. They share the **`Task`** and **`Comment`** types exported from **`TaskCard.tsx`**.

## Shared types (`TaskCard.tsx`)

- **`TaskStatus`:** `"todo" | "doing" | "review" | "done"`
- **`Task`:** `id`, `name`, `label`, `assignee`, `status`, `description`, `team`, `order`, `archived`, `due_date`, `comments`
- **`Comment`:** `id`, `author_id`, `author_name`, `message`, `created_at`

---

## TaskCard

Compact **summary card** for one task: id, label badge, title, assignee, optional due date, team (team hidden on smallest breakpoint).

Used inside **`TaskColumn`** (sortable) and as the visual reference for task shape across the feature.

---

## TaskColumn

A **Kanban column** for one **`TaskStatus`**: title + **droppable** region (`@dnd-kit/core` **`useDroppable`**) listing **sortable** tasks (`@dnd-kit/sortable` **`SortableContext`**, vertical strategy).

- **`SortableTask`** wraps **`TaskCard`** with drag listeners; **click** opens the sidebar unless a drag is in progress.
- **Props:** `title`, `status`, `tasks`, `onTaskClick(task)`

---

## TaskListView

**Responsive list** of all tasks (used when the tracker is in list mode).

- **Mobile:** stacked tappable cards with status badge and metadata row.
- **Desktop:** wide **table** with columns for name, assignee, status, due, label, team.

**Props:** `tasks`, `onTaskClick(task)`

---

## TaskCalendarView

**Month grid** calendar; tasks appear under cells matching **`due_date`** (string key, typically `YYYY-MM-DD`).

- Month navigation with **← / →** buttons.
- Weekday headers: short labels on small screens, full on larger.
- **Props:** `tasks`, `onTaskClick(task)`

---

## TaskSidebar

**Slide-over panel** for **create** or **edit** task, plus **comments** when editing.

- Loads **admins** (`loadAdmins`), **current user team** (`getCurrentUserTeam`), and **comments** (`loadComments`) via `taskTrackerController`.
- **Team field:** only users whose team is in **`GLOBAL_TEAMS`** can pick a different team; others default to their own team.
- **Submit:** builds a **`Task`** payload and calls **`onCreate`** or **`onUpdate`**.
- **Comments:** `addComment` appends to thread; errors surface with **`alert`** in the catch path.
- Mobile: **backdrop** tap closes; layout adapts for small screens.

**Props:** `mode` (`"create" | "edit"`), optional `task`, `onClose`, `onCreate`, `onUpdate`

---

## Related

- `src/pages/admin/TaskTracker.tsx` – wires DnD sensors, views, and sidebar
- `src/lib/taskTrackerController.ts` – Supabase persistence
- [@dnd-kit](https://docs.dndkit.com/) – drag-and-drop primitives
