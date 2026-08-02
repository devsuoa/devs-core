import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { PageTitle } from "../../components/PageTitle";
import TaskColumn from "../../components/TaskColumn";
import TaskSidebar from "../../components/TaskSidebar";
import TaskListView from "../../components/TaskListView";
import { Task, TaskStatus } from "../../components/TaskCard";
import TaskCalendarView from "../../components/TaskCalendarView";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useAdminDashboard } from "../../lib/adminDashboardController";
import {
  STATUSES,
  GLOBAL_TEAMS,
  getCurrentUserTeam,
  loadTasks,
  persistLane,
  sortByOrder,
  reindex,
  isStatus,
  createTask,
  updateTask,
} from "../../lib/taskTrackerController";

export default function TaskTracker() {
  const { loading, authorized } = useAdminDashboard();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sidebarMode, setSidebarMode] = useState<"create" | "edit" | null>(null);
  const [userTeam, setUserTeam] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "list" | "calendar">("board");

  useEffect(() => {
    const load = async () => {
      try {
        setUserTeam(await getCurrentUserTeam());
        setTasks(await loadTasks());
      } catch (error) {
        console.error("Failed to load tasks:", error);
        alert("Failed to load tasks. Please try again.");
      }
    };
    load();
  }, []);

  const visibleTasks = useMemo(() => {
    const active = tasks.filter((t) => !t.archived);
    if (GLOBAL_TEAMS.includes(userTeam)) return active;
    return active.filter((t) => t.team === userTeam);
  }, [tasks, userTeam]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      doing: [],
      review: [],
      done: [],
    };
    for (const t of visibleTasks) map[t.status].push(t);
    for (const s of STATUSES) map[s] = sortByOrder(map[s]);
    return map;
  }, [visibleTasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    let lanesToPersist: Task[][] = [];

    setTasks((prev) => {
      const moving = prev.find((t) => t.id === active.id);
      if (!moving) return prev;

      if (!GLOBAL_TEAMS.includes(userTeam) && moving.team !== userTeam) return prev;

      const sourceStatus = moving.status;
      const destStatus = isStatus(over.id) ? over.id : prev.find((t) => t.id === over.id)?.status;

      if (!destStatus) return prev;

      const team = moving.team;

      const sourceLane = sortByOrder(
        prev.filter((t) => t.team === team && t.status === sourceStatus),
      );

      const destLane =
        sourceStatus === destStatus
          ? sourceLane
          : sortByOrder(prev.filter((t) => t.team === team && t.status === destStatus));

      const sourceIndex = sourceLane.findIndex((t) => t.id === moving.id);

      const destIndex = isStatus(over.id)
        ? destLane.length
        : destLane.findIndex((t) => t.id === over.id);

      if (sourceStatus === destStatus) {
        const reordered = reindex(arrayMove(sourceLane, sourceIndex, destIndex));
        lanesToPersist = [reordered];
        return [
          ...prev.filter((t) => !(t.team === team && t.status === sourceStatus)),
          ...reordered,
        ];
      }

      const newSource = reindex(sourceLane.filter((t) => t.id !== moving.id));

      const movedTask = { ...moving, status: destStatus };

      const newDest = reindex([
        ...destLane.slice(0, destIndex),
        movedTask,
        ...destLane.slice(destIndex),
      ]);

      lanesToPersist = [newSource, newDest];

      return [
        ...prev.filter(
          (t) => !(t.team === team && (t.status === sourceStatus || t.status === destStatus)),
        ),
        ...newSource,
        ...newDest,
      ];
    });

    for (const lane of lanesToPersist) {
      await persistLane(lane);
    }
  };

  if (loading || !authorized) return null;

  return (
    <>
      <Header />
      <div className="px-[8vw] pt-4 sm:pt-6">
        <Link
          to="/admin/dashboard"
          className="font-silkscreen text-sm sm:text-base text-white/80 hover:text-white py-2 touch-manipulation w-fit"
        >
          ← Back to dashboard
        </Link>
      </div>
      <main className="px-4 sm:px-6 md:px-[8vw] py-6 md:py-12 min-h-[90vh]">
        <PageTitle
          title="Task Tracker"
          subtext="Track your tasks and their progress. You can only see tasks assigned to your team."
          className="p-0"
        />

        {/* ACTION BAR */}
        <div className="mt-4 md:mt-6 mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => {
              setActiveTask(null);
              setSidebarMode("create");
            }}
            className="px-4 sm:px-6 py-2 border-2 border-[#6E80DA] rounded text-white font-silkscreen w-full sm:w-auto shrink-0"
          >
            + Add Task
          </button>

          <div className="flex gap-2">
            {[
              { key: "board", label: "Board" },
              { key: "list", label: "List" },
              { key: "calendar", label: "Calendar" },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key as any)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 border rounded font-silkscreen text-sm sm:text-base ${
                  viewMode === v.key
                    ? "border-[#6E80DA] text-white"
                    : "border-white/30 text-white/50"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* BOARD VIEW */}
        {viewMode === "board" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible snap-x snap-mandatory">
              {STATUSES.map((status) => (
                <TaskColumn
                  key={status}
                  title={status}
                  status={status}
                  tasks={tasksByStatus[status]}
                  onTaskClick={(t) => {
                    setActiveTask(t);
                    setSidebarMode("edit");
                  }}
                />
              ))}
            </div>
          </DndContext>
        )}

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <TaskListView
            tasks={visibleTasks}
            onTaskClick={(t) => {
              setActiveTask(t);
              setSidebarMode("edit");
            }}
          />
        )}

        {/* CALENDAR VIEW */}
        {viewMode === "calendar" && (
          <TaskCalendarView
            tasks={visibleTasks}
            onTaskClick={(t) => {
              setActiveTask(t);
              setSidebarMode("edit");
            }}
          />
        )}

        {sidebarMode && (
          <TaskSidebar
            mode={sidebarMode}
            task={activeTask ?? undefined}
            onClose={() => setSidebarMode(null)}
            onCreate={async (t) => {
              try {
                await createTask(t);
                setTasks((p) => [...p, t]);
                setSidebarMode(null);
              } catch (error) {
                console.error("Failed to create task:", error);
                alert("Failed to create task. Please try again.");
              }
            }}
            onUpdate={async (t) => {
              try {
                await updateTask(t);
                setTasks((p) => p.map((x) => (x.id === t.id ? t : x)));
              } catch (error) {
                console.error("Failed to update task:", error);
                alert("Failed to update task. Please try again.");
              }
            }}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
