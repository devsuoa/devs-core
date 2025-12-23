import { useMemo, useState } from "react";
import { Task } from "./TaskCard";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function TaskCalendarView({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(
    startOfMonth(new Date())
  );

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const firstDay = start.getDay(); // 0 = Sun
    const totalDays = end.getDate();

    const cells: Date[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(addDays(start, -i - 1));
    }

    for (let d = 1; d <= totalDays; d++) {
      cells.push(new Date(start.getFullYear(), start.getMonth(), d));
    }

    while (cells.length % 7 !== 0) {
      cells.push(addDays(cells[cells.length - 1], 1));
    }

    return cells;
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.due_date) continue;
      const key = t.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  return (
    <div className="border-2 border-[#6E80DA] rounded-2xl bg-black/30 p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
              )
            )
          }
          className="px-3 py-1 border border-white/30 rounded text-white/70"
        >
          ←
        </button>

        <h2 className="text-white font-silkscreen uppercase">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
              )
            )
          }
          className="px-3 py-1 border border-white/30 rounded text-white/70"
        >
          →
        </button>
      </div>

      {/* WEEKDAYS */}
      <div className="grid grid-cols-7 text-xs text-white/50 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (d) => (
            <div key={d} className="text-center">
              {d}
            </div>
          )
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, idx) => {
          const key = formatDateKey(date);
          const isCurrentMonth =
            date.getMonth() === currentMonth.getMonth();

          return (
            <div
              key={idx}
              className={`min-h-[120px] rounded border border-white/20 p-1 ${
                isCurrentMonth
                  ? "bg-black/40"
                  : "bg-black/20 opacity-40"
              }`}
            >
              <div className="text-xs text-white/60 mb-1">
                {date.getDate()}
              </div>

              <div className="flex flex-col gap-1">
                {(tasksByDate[key] ?? []).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="text-left text-[10px] px-1 py-0.5 rounded bg-[#6E80DA]/30 hover:bg-[#6E80DA]/50 text-white truncate"
                  >
                    {task.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
