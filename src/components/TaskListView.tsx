import { Task } from "./TaskCard";

export default function TaskListView({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  return (
    <>
      {/* Mobile: card layout */}
      <div className="md:hidden flex flex-col gap-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="rounded-2xl border-2 border-[#6E80DA] bg-black/30 p-4 hover:bg-black/50 cursor-pointer transition active:scale-[0.99]"
          >
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-silkscreen uppercase text-white font-medium truncate">
                {task.name}
              </h3>
              <span className="px-2 py-0.5 text-xs rounded bg-[#6E80DA]/30 text-white shrink-0">
                {task.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/70">
              <span>{task.assignee}</span>
              <span>{task.due_date ?? "—"}</span>
              <span>{task.label}</span>
              <span className="text-white/50">{task.team}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border-2 border-[#6E80DA] bg-black/30">
        <table className="w-full text-left text-sm text-white">
          <thead className="border-b border-white/20">
            <tr className="text-white/70">
              <th className="p-3">Task name</th>
              <th className="p-3">Assignee</th>
              <th className="p-3">Status</th>
              <th className="p-3">Due</th>
              <th className="p-3">Label</th>
              <th className="p-3">Team</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="border-b border-white/10 hover:bg-black/50 cursor-pointer transition"
              >
                <td className="p-3 font-silkscreen uppercase">
                  {task.name}
                </td>
                <td className="p-3">{task.assignee}</td>
                <td className="p-3">
                  <span className="px-2 py-1 text-xs rounded bg-[#6E80DA]/30">
                    {task.status}
                  </span>
                </td>
                <td className="p-3 text-white/70">
                  {task.due_date ?? "—"}
                </td>
                <td className="p-3">{task.label}</td>
                <td className="p-3 text-white/50">{task.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
