import TaskCard, { Task, TaskStatus } from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTask({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick()}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <TaskCard task={task} />
    </div>
  );
}

export default function TaskColumn({
  title,
  status,
  tasks,
  onTaskClick,
}: {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-silkscreen text-white uppercase">{title}</h2>

      <div
        ref={setNodeRef}
        className={`min-h-[140px] rounded-2xl border-2 border-[#6E80DA] p-3 flex flex-col gap-3 ${
          isOver ? "bg-black/50" : "bg-black/30"
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
