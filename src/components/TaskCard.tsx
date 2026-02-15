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
    <div className="rounded-xl md:rounded-2xl border-2 border-[#6E80DA] bg-black/40 p-2 md:p-4 hover:bg-black/60 transition">
      <div className="flex justify-between gap-1">
        <span className="text-[10px] md:text-xs text-white/60 truncate">#{task.id}</span>
        <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded bg-[#6E80DA]/30 text-white shrink-0">
          {task.label}
        </span>
      </div>

      <h3 className="mt-1 md:mt-2 font-rethink text-white text-xs md:text-sm uppercase line-clamp-2">
        {task.name}
      </h3>

      <p className="text-[10px] md:text-xs text-white/70 mt-0.5 md:mt-1 truncate">
        <span className="hidden md:inline">Assignee: </span>{task.assignee}
      </p>

      {task.due_date && (
        <p className="text-[9px] md:text-[10px] text-white/50 mt-0.5 md:mt-1">
          Due: {task.due_date}
        </p>
      )}

      <p className="text-[9px] md:text-[10px] text-white/40 mt-0.5 md:mt-1 hidden md:block">
        Team: {task.team}
      </p>
    </div>
  );
}
