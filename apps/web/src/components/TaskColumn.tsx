import TaskCard, { Task, TaskStatus } from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTask({ task, onClick }: { task: Task; onClick: () => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

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
    <div className="flex flex-col gap-2 md:gap-4 min-w-[180px] sm:min-w-[220px] md:min-w-0 shrink-0 md:shrink snap-center">
      <h2 className="font-silkscreen text-white uppercase text-xs md:text-base">{title}</h2>

      <div
        ref={setNodeRef}
        className={`min-h-[120px] md:min-h-[140px] rounded-xl md:rounded-2xl border-2 border-[#6E80DA] p-2 md:p-3 flex flex-col gap-2 md:gap-3 ${
          isOver ? "bg-black/50" : "bg-black/30"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
