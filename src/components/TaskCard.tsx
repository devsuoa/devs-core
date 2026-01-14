export type TaskStatus = "todo" | "doing" | "review" | "done";

export type Comment = {
  id: string;
  author_id: string;
  author_name: string;
  message: string;
  created_at: string;
};

export type Task = {
  id: string;
  name: string;
  label: string;
  assignee: string;
  status: TaskStatus;
  description: string;
  team: string;
  order: number;
  archived: boolean;
  due_date: string | null;
  comments: Comment[];
};

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-2xl border-2 border-[#6E80DA] bg-black/40 p-4 hover:bg-black/60 transition">
      <div className="flex justify-between">
        <span className="text-xs text-white/60">#{task.id}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-[#6E80DA]/30 text-white">
          {task.label}
        </span>
      </div>

      <h3 className="mt-2 font-rethink text-white text-sm uppercase">
        {task.name}
      </h3>

      <p className="text-xs text-white/70 mt-1">
        Assignee: {task.assignee}
      </p>

      {task.due_date && (
        <p className="text-[10px] text-white/50 mt-1">
          Due: {task.due_date}
        </p>
      )}

      <p className="text-[10px] text-white/40 mt-1">
        Team: {task.team}
      </p>
    </div>
  );
}
