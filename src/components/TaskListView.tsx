import { Task } from "./TaskCard";

export default function TaskListView({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-[#6E80DA] bg-black/30">
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
  );
}
