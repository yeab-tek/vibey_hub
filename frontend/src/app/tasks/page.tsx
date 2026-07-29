"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  KanbanSquare,
  Plus,
  Clock,
  CheckCircle2,
  GripVertical,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { tasksApi, usersApi, type Task, type User } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Tasks() {
  const { user: authUser } = useAppAuth();
  const queryClient = useQueryClient();

  const { data: allTasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list(),
    refetchInterval: 10000,
  });

  const { data: members } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
    refetchInterval: 10000,
  });

  const createTask = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
    },
    onError: () => toast.error("Failed to create task"),
  });

  const updateTask = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{ status: string; priority: string; deadline: string }>;
    }) => tasksApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error("Failed to update task"),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [filterUser, setFilterUser] = useState<string>("all");
  const [newTask, setNewTask] = useState({
    title: "",
    priority: "medium" as "low" | "medium" | "high",
    assigned_user: "" as string,
    deadline: "",
  });

  const tasksList: Task[] = (allTasks || []) as Task[];
  const todo = tasksList.filter(
    (t) =>
      t.status === "todo" &&
      (filterUser === "all" || t.assigned_user === filterUser)
  );
  const inProgress = tasksList.filter(
    (t) =>
      t.status === "in_progress" &&
      (filterUser === "all" || t.assigned_user === filterUser)
  );
  const done = tasksList.filter(
    (t) =>
      t.status === "done" &&
      (filterUser === "all" || t.assigned_user === filterUser)
  );

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    await createTask.mutateAsync({
      title: newTask.title,
      priority: newTask.priority,
      assigned_user: newTask.assigned_user || undefined,
      deadline: newTask.deadline || undefined,
    });
    setShowCreate(false);
    setNewTask({ title: "", priority: "medium", assigned_user: "", deadline: "" });
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateTask.mutateAsync({ id: taskId, body: { status: newStatus } });
  };

  const isAdmin =
    authUser?.role === "founder" || String(authUser?.role) === "admin";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-[#1a1a1a]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 bg-[#1a1a1a]" />
          ))}
        </div>
      </div>
    );
  }

  const columns = [
    { title: "To Do", status: "todo", items: todo, icon: Clock, color: "#f59e0b" },
    {
      title: "In Progress",
      status: "in_progress",
      items: inProgress,
      icon: GripVertical,
      color: "#3b82f6",
    },
    {
      title: "Done",
      status: "done",
      items: done,
      icon: CheckCircle2,
      color: "#2bb673",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-[#2bb673]" />
            Tasks
          </h1>
          <p className="text-[#888] text-sm mt-1">
            Manage and track team tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A] font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" /> New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#888]">Title</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      placeholder="Task title"
                      className="bg-[#222] border-[#333] text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#888]">Priority</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(v) =>
                          setNewTask({
                            ...newTask,
                            priority: v as "low" | "medium" | "high",
                          })
                        }
                      >
                        <SelectTrigger className="bg-[#222] border-[#333] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#333]">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#888]">Assignee</Label>
                      <Select
                        value={newTask.assigned_user || "none"}
                        onValueChange={(v) =>
                          setNewTask({
                            ...newTask,
                            assigned_user: v === "none" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger className="bg-[#222] border-[#333] text-white">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#333]">
                          <SelectItem value="none">Unassigned</SelectItem>
                          {(members || [])
                            .filter(
                              (m: User) =>
                                m.role === "intern" ||
                                m.role === "team_member"
                            )
                            .map((m: User) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#888]">Deadline</Label>
                    <Input
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) =>
                        setNewTask({ ...newTask, deadline: e.target.value })
                      }
                      className="bg-[#222] border-[#333] text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="border-[#333] text-[#888]"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A]"
                    disabled={!newTask.title.trim()}
                  >
                    Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#666]">Filter by assignee:</span>
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-48 bg-[#141414] border-[#222] text-white text-sm h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#333]">
            <SelectItem value="all">All</SelectItem>
            {(members || [])
              .filter(
                (m: User) =>
                  m.role === "intern" || m.role === "team_member"
              )
              .map((m: User) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col.status}
            className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <col.icon className="w-4 h-4" style={{ color: col.color }} />
                <h3 className="text-sm font-semibold text-white">
                  {col.title}
                </h3>
              </div>
              <span className="text-xs text-[#666] bg-[#1a1a1a] px-2 py-0.5 rounded-full">
                {col.items.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {col.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#444] text-xs">No tasks</p>
                </div>
              ) : (
                col.items.map((task: Task) => {
                  const assignee = (members || []).find(
                    (m: User) => m.id === task.assigned_user
                  );
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="bg-[#141414] border-[#222] p-3 cursor-pointer hover:border-[#2bb673]/20 transition-colors">
                        <p className="text-sm font-medium text-white">
                          {task.title}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                task.priority === "high"
                                  ? "bg-red-500/15 text-red-400"
                                  : task.priority === "medium"
                                  ? "bg-yellow-500/15 text-yellow-400"
                                  : "bg-[#333] text-[#888]"
                              }`}
                            >
                              {task.priority}
                            </span>
                            {task.deadline && (
                              <span className="text-[10px] text-[#555] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(task.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {assignee && (
                            <div className="w-6 h-6 rounded-full bg-[#2bb673]/15 flex items-center justify-center text-[#2bb673] text-[10px] font-semibold">
                              {assignee.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 mt-2 pt-2 border-t border-[#222]">
                            {columns.map((c) => (
                              <button
                                key={c.status}
                                onClick={() =>
                                  handleStatusChange(task.id, c.status)
                                }
                                className={`text-[10px] px-2 py-0.5 rounded ${
                                  task.status === c.status
                                    ? "bg-[#2bb673]/20 text-[#2bb673]"
                                    : "bg-[#1a1a1a] text-[#666] hover:text-white"
                                }`}
                              >
                                {c.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
