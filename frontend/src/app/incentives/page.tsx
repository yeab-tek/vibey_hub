"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Plus, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { incentivesApi, usersApi, calculateLevel, aiApi, type User, type Incentive, type AiSummary } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Incentives() {
  const { user: authUser } = useAppAuth();
  const queryClient = useQueryClient();
  const isAdmin = authUser?.role === "founder" || String(authUser?.role) === "admin";

  const { data: incentives, isLoading } = useQuery({
    queryKey: ["incentives"], queryFn: () => incentivesApi.list(), refetchInterval: 10000,
  });
  const { data: members } = useQuery({
    queryKey: ["users"], queryFn: () => usersApi.list(),
  });

  const createIncentive = useMutation({
    mutationFn: incentivesApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["incentives"] }); toast.success("Incentive created"); },
    onError: () => toast.error("Failed to create incentive"),
  });
  const updateIncentive = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Incentive> }) => incentivesApi.update(id, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["incentives"] }); toast.success("Incentive updated"); },
    onError: () => toast.error("Failed to update incentive"),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editIncentive, setEditIncentive] = useState<Incentive | null>(null);
  const [newIncentive, setNewIncentive] = useState({ userId: "", month: new Date().toISOString().slice(0, 7), recommendedReward: "", founderDecision: "approved" as "approved" | "not_this_month" | "custom" });
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const incentiveList: Incentive[] = (incentives || []) as Incentive[];
  const memberList: User[] = (members || []) as User[];

  const handleCreate = async () => {
    if (!newIncentive.userId) return;
    await createIncentive.mutateAsync({ user_id: newIncentive.userId, month: newIncentive.month, recommended_reward: newIncentive.recommendedReward || null, founder_decision: newIncentive.founderDecision });
    setShowCreate(false);
    setNewIncentive({ userId: "", month: new Date().toISOString().slice(0, 7), recommendedReward: "", founderDecision: "approved" });
  };

  const handleGenerateSummary = async () => {
    if (!newIncentive.userId || !newIncentive.month) return;
    setAiLoading(true);
    setAiSummary(null);
    try {
      const result = await aiApi.getSummary(newIncentive.userId, newIncentive.month);
      setAiSummary(result);
      if (result.incentive_suggestion) {
        setNewIncentive((prev) => ({ ...prev, founderDecision: result.incentive_suggestion as "approved" | "not_this_month" | "custom" }));
      }
    } catch (err) {
      toast.error("Failed to generate AI summary");
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48 bg-[#1a1a1a]" />{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 bg-[#1a1a1a]" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Award className="w-6 h-6 text-[#2bb673]" /> Incentives</h1>
          <p className="text-[#888] text-sm mt-1">Monthly reward review and decisions</p>
        </div>
        {isAdmin && (
          <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setAiSummary(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A] font-medium"><Plus className="w-4 h-4 mr-1" /> New Incentive</Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
              <DialogHeader><DialogTitle>Create Incentive</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#888]">Team Member</Label>
                  <Select value={newIncentive.userId} onValueChange={(v) => setNewIncentive({ ...newIncentive, userId: v })}>
                    <SelectTrigger className="bg-[#222] border-[#333] text-white"><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333]">
                      {memberList.filter((m) => m.role !== "founder").map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#888]">Month</Label>
                  <Input type="month" value={newIncentive.month} onChange={(e) => setNewIncentive({ ...newIncentive, month: e.target.value })} className="bg-[#222] border-[#333] text-white" />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full border-[#333] text-[#888] hover:border-[#2bb673]/50 hover:text-[#2bb673]"
                  onClick={handleGenerateSummary}
                  disabled={!newIncentive.userId || !newIncentive.month || aiLoading}
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                  Generate AI Summary
                </Button>
                {aiSummary && (
                  <div className="bg-[#1a1a1a] border border-[#2bb673]/20 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-[#ccc]">{aiSummary.summary}</p>
                    <p className="text-[10px] text-[#666]">
                      {aiSummary.contribution_count} contributions &middot; {aiSummary.month_points} pts this month &middot; {aiSummary.level}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-[#888]">Recommended Reward</Label>
                  <Textarea value={newIncentive.recommendedReward} onChange={(e) => setNewIncentive({ ...newIncentive, recommendedReward: e.target.value })} placeholder="e.g. ETB 5,000 bonus" className="bg-[#222] border-[#333] text-white" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#888]">Decision</Label>
                  <Select value={newIncentive.founderDecision} onValueChange={(v) => setNewIncentive({ ...newIncentive, founderDecision: v as "approved" | "not_this_month" | "custom" })}>
                    <SelectTrigger className="bg-[#222] border-[#333] text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333]">
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="not_this_month">Not This Month</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-[#333] text-[#888]" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A]" disabled={!newIncentive.userId}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={!!editIncentive} onOpenChange={(open) => { if (!open) setEditIncentive(null); }}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
          <DialogHeader><DialogTitle>Update Incentive</DialogTitle></DialogHeader>
          {editIncentive && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#888]">Decision</Label>
                <Select value={editIncentive.founder_decision || "approved"} onValueChange={(v) => setEditIncentive({ ...editIncentive, founder_decision: v as "approved" | "not_this_month" | "custom" })}>
                  <SelectTrigger className="bg-[#222] border-[#333] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="not_this_month">Not This Month</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#888]">Note</Label>
                <Textarea value={editIncentive.founder_note || ""} onChange={(e) => setEditIncentive({ ...editIncentive, founder_note: e.target.value })} placeholder="Add a note..." className="bg-[#222] border-[#333] text-white" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-[#333] text-[#888]" onClick={() => setEditIncentive(null)}>Cancel</Button>
            <Button onClick={() => { if (!editIncentive) return; updateIncentive.mutate({ id: editIncentive.id, body: { founder_decision: editIncentive.founder_decision, founder_note: editIncentive.founder_note } }); setEditIncentive(null); }} className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A]">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {incentiveList.length === 0 ? (
          <div className="bg-[#141414] border border-[#222] rounded-xl p-12 text-center">
            <Award className="w-10 h-10 text-[#333] mx-auto mb-3" />
            <p className="text-[#555] text-sm">No incentives yet.</p>
          </div>
        ) : (
          incentiveList.map((inc: Incentive) => {
            const member = memberList.find((m) => m.id === inc.user_id);
            const level = calculateLevel(member?.total_points || 0);
            return (
              <div key={inc.id} className="bg-[#141414] border border-[#222] rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/15 flex items-center justify-center text-[#8b5cf6] font-semibold text-sm">
                      {member?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{member?.name || "Unknown"}</p>
                      <p className="text-xs text-[#666]">{inc.month} &middot; {level}</p>
                    </div>
                  </div>
                  <Badge className={inc.founder_decision === "approved" ? "bg-[#2bb673]/15 text-[#2bb673]" : inc.founder_decision === "not_this_month" ? "bg-yellow-500/15 text-yellow-400" : "bg-[#333] text-[#888]"}>
                    {inc.founder_decision || "pending"}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-[#555] uppercase tracking-wider">Recommended</p><p className="text-xs text-[#ccc] mt-1">{inc.recommended_reward || "—"}</p></div>
                  <div><p className="text-[10px] text-[#555] uppercase tracking-wider">Note</p><p className="text-xs text-[#ccc] mt-1">{inc.founder_note || inc.founder_decision || "—"}</p></div>
                </div>
                {isAdmin && (
                  <div className="mt-3 pt-3 border-t border-[#222]">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-[#333] text-[#888] hover:border-[#2bb673]/50 hover:text-[#2bb673]" onClick={() => setEditIncentive({ ...inc })}>Update Decision</Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
