"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { FolderKanban, Plus, Circle, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { projectsApi, type Project } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const pipelineStages = ["lead","requirement","design","development","testing","deployment","completed"] as const;

const stageColors: Record<string, string> = {
  lead: "bg-[#333] text-[#888]", requirement: "bg-purple-500/15 text-purple-400",
  design: "bg-pink-500/15 text-pink-400", development: "bg-blue-500/15 text-blue-400",
  testing: "bg-yellow-500/15 text-yellow-400", deployment: "bg-orange-500/15 text-orange-400",
  completed: "bg-[#2bb673]/15 text-[#2bb673]",
};

export default function Projects() {
  const { user: authUser } = useAppAuth();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"], queryFn: () => projectsApi.list(), refetchInterval: 10000,
  });

  const createProject = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project created"); },
    onError: () => toast.error("Failed to create project"),
  });

  const updateProject = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Project> }) => projectsApi.update(id, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project updated"); },
    onError: () => toast.error("Failed to update project"),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: "", client_name: "", project_type: "website", budget: "", status: "lead" as const });
  const isAdmin = authUser?.role === "founder" || String(authUser?.role) === "admin";
  const projectList: Project[] = (projects || []) as Project[];

  const handleCreate = async () => {
    if (!newProject.name.trim() || !newProject.client_name.trim()) return;
    await createProject.mutateAsync({ name: newProject.name, client_name: newProject.client_name, project_type: newProject.project_type, budget: newProject.budget ? Number(newProject.budget) : null, status: newProject.status });
    setShowCreate(false);
    setNewProject({ name: "", client_name: "", project_type: "website", budget: "", status: "lead" });
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48 bg-[#1a1a1a]" /><Skeleton className="h-64 bg-[#1a1a1a]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FolderKanban className="w-6 h-6 text-[#2bb673]" /> Projects</h1>
          <p className="text-[#888] text-sm mt-1">Track projects through the pipeline</p>
        </div>
        {isAdmin && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A] font-medium"><Plus className="w-4 h-4 mr-1" /> New Project</Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
              <DialogHeader><DialogTitle>Create New Project</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#888]">Project Name</Label>
                  <Input value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} placeholder="Project name" className="bg-[#222] border-[#333] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#888]">Client Name</Label>
                  <Input value={newProject.client_name} onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })} placeholder="Client name" className="bg-[#222] border-[#333] text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#888]">Type</Label>
                    <Select value={newProject.project_type} onValueChange={(v) => setNewProject({ ...newProject, project_type: v })}>
                      <SelectTrigger className="bg-[#222] border-[#333] text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#333]">
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="mobile">Mobile App</SelectItem>
                        <SelectItem value="branding">Branding</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#888]">Budget (ETB)</Label>
                    <Input type="number" value={newProject.budget} onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })} placeholder="0" className="bg-[#222] border-[#333] text-white" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-[#333] text-[#888]" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A]" disabled={!newProject.name.trim()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={!!editProject} onOpenChange={(open) => { if (!open) setEditProject(null); }}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          {editProject && (
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-[#888]">Project Name</Label><Input defaultValue={editProject.name} id="edit-name" className="bg-[#222] border-[#333] text-white" /></div>
              <div className="space-y-2"><Label className="text-[#888]">Client</Label><Input defaultValue={editProject.client_name} id="edit-client" className="bg-[#222] border-[#333] text-white" /></div>
              <div className="space-y-2"><Label className="text-[#888]">Budget (ETB)</Label><Input type="number" defaultValue={editProject.budget || ""} id="edit-budget" className="bg-[#222] border-[#333] text-white" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-[#333] text-[#888]" onClick={() => setEditProject(null)}>Cancel</Button>
            <Button className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A]" onClick={() => {
              if (!editProject) return;
              const name = (document.getElementById("edit-name") as HTMLInputElement)?.value;
              const client = (document.getElementById("edit-client") as HTMLInputElement)?.value;
              const budget = (document.getElementById("edit-budget") as HTMLInputElement)?.value;
              updateProject.mutate({ id: editProject.id, body: { name: name || editProject.name, client_name: client || editProject.client_name, budget: budget ? Number(budget) : editProject.budget } });
              setEditProject(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {pipelineStages.map((stage, i) => (
            <div key={stage} className="flex items-center">
              <Badge variant="outline" className={`text-xs px-3 py-1 ${stageColors[stage]}`}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</Badge>
              {i < pipelineStages.length - 1 && <ChevronRight className="w-3 h-3 text-[#333] mx-1" />}
            </div>
          ))}
        </div>

        {projectList.length === 0 ? (
          <div className="bg-[#141414] border border-[#222] rounded-xl p-12 text-center">
            <FolderKanban className="w-10 h-10 text-[#333] mx-auto mb-3" />
            <p className="text-[#555] text-sm">No projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectList.map((project: Project, idx: number) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, duration: 0.3 }}>
                <Card className="bg-[#141414] border-[#222] p-5 hover:border-[#2bb673]/10 transition-colors cursor-pointer" onClick={() => setEditProject(project)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                      <p className="text-xs text-[#666] mt-0.5">{project.client_name}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${stageColors[project.status] || stageColors.lead}`}>{project.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {pipelineStages.map((stage) => (
                      <button key={stage} className="flex-1" onClick={(e) => { e.stopPropagation(); if (isAdmin) updateProject.mutate({ id: project.id, body: { status: stage } }); }}>
                        <Circle className={`w-3 h-3 ${pipelineStages.indexOf(stage) <= pipelineStages.indexOf(project.status) ? "text-[#2bb673] fill-[#2bb673]" : "text-[#333]"}`} />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#222]">
                    {project.budget && <span className="text-xs text-[#888]">ETB {project.budget.toLocaleString()}</span>}
                    <span className="text-[10px] text-[#555]">{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
