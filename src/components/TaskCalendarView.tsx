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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function TaskCalendarView({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

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

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdaysShort = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="border-2 border-[#6E80DA] rounded-2xl bg-black/30 p-3 sm:p-4 overflow-x-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
          }
          className="px-2 sm:px-3 py-1 border border-white/30 rounded text-white/70 text-sm sm:text-base touch-manipulation"
        >
          ←
        </button>

        <h2 className="text-white font-silkscreen uppercase text-sm sm:text-base">
          {currentMonth.toLocaleString("default", {
            month: "short",
            year: "numeric",
          })}
        </h2>

        <button
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
          }
          className="px-2 sm:px-3 py-1 border border-white/30 rounded text-white/70 text-sm sm:text-base touch-manipulation"
        >
          →
        </button>
      </div>

      {/* WEEKDAYS - short on mobile, full on larger screens */}
      <div className="hidden sm:grid grid-cols-7 text-xs text-white/50 mb-2 min-w-[280px]">
        {weekdays.map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid sm:hidden grid-cols-7 text-[10px] text-white/50 mb-1 min-w-[280px]">
        {weekdaysShort.map((d, i) => (
          <div key={weekdays[i]} className="text-center">
            {d}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[280px]">
        {days.map((date, idx) => {
          const key = formatDateKey(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <div
              key={idx}
              className={`min-h-[60px] sm:min-h-[80px] md:min-h-[120px] rounded border border-white/20 p-0.5 sm:p-1 ${
                isCurrentMonth ? "bg-black/40" : "bg-black/20 opacity-40"
              }`}
            >
              <div className="flex mb-0.5 sm:mb-1">
                <span
                  className={`text-[10px] sm:text-xs flex items-center justify-center rounded-full ${
                    formatDateKey(date) === formatDateKey(new Date())
                      ? "bg-[#6E80DA] text-white w-5 h-5 sm:w-6 sm:h-6 font-bold"
                      : "text-white/60 w-5 h-5 sm:w-6 sm:h-6"
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 sm:gap-1">
                {(tasksByDate[key] ?? []).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`text-left text-[9px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded bg-[#6E80DA]/30 hover:bg-[#6E80DA]/50 active:bg-[#6E80DA]/60 text-white truncate touch-manipulation ${
                      task.status === "done" ? "line-through opacity-50" : ""
                    }`}
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
