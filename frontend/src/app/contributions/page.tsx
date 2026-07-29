"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { SendHorizontal, Plus, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contributionsApi, categoriesApi, type Contribution, type ContributionCategory } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Contributions() {
  const { user: authUser } = useAppAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: contributions, isLoading } = useQuery({
    queryKey: ["contributions", filter],
    queryFn: () => filter !== "all" ? contributionsApi.list({ status: filter }) : contributionsApi.list(),
    refetchInterval: 10000,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    refetchInterval: 60000,
  });

  const createContribution = useMutation({
    mutationFn: contributionsApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contributions"] }); toast.success("Contribution submitted!"); },
    onError: () => toast.error("Failed to submit contribution"),
  });

  const updateContribution = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status: string; reviewer_note?: string } }) =>
      contributionsApi.update(id, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contributions"] }); toast.success("Contribution updated"); },
    onError: () => toast.error("Failed to update contribution"),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<Contribution | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [newContribution, setNewContribution] = useState({
    title: "", category: "", description: "", evidence_url: "",
    difficulty: "medium" as "easy" | "medium" | "hard" | "exceptional",
  });

  const filteredContributions = (contributions || []) as Contribution[];
  const isAdmin = authUser?.role === "founder" || String(authUser?.role) === "admin";
  const categoryOptions: ContributionCategory[] = categories || [];

  const handleCreate = async () => {
    if (!newContribution.title.trim() || !newContribution.category || !authUser) return;
    await createContribution.mutateAsync({
      user_id: authUser.id, title: newContribution.title,
      category: newContribution.category, description: newContribution.description || undefined,
      evidence_url: newContribution.evidence_url || undefined, difficulty: newContribution.difficulty,
    });
    setShowCreate(false);
    setNewContribution({ title: "", category: "", description: "", evidence_url: "", difficulty: "medium" });
  };

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    await updateContribution.mutateAsync({ id, body: { status, reviewer_note: reviewNote } });
    setReviewDialog(null); setReviewNote("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-[#1a1a1a]" />
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 bg-[#1a1a1a]" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SendHorizontal className="w-6 h-6 text-[#2bb673]" /> Contributions
          </h1>
          <p className="text-[#888] text-sm mt-1">Submit and review team contributions</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A] font-medium">
              <Plus className="w-4 h-4 mr-1" /> Submit Contribution
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
            <DialogHeader><DialogTitle>Submit Contribution</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#888]">Title</Label>
                <Input value={newContribution.title} onChange={(e) => setNewContribution({ ...newContribution, title: e.target.value })} placeholder="What did you contribute?" className="bg-[#222] border-[#333] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#888]">Category</Label>
                <Select value={newContribution.category} onValueChange={(v) => setNewContribution({ ...newContribution, category: v })}>
                  <SelectTrigger className="bg-[#222] border-[#333] text-white"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    {categoryOptions.map((cat) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#888]">Description</Label>
                <Textarea value={newContribution.description} onChange={(e) => setNewContribution({ ...newContribution, description: e.target.value })} placeholder="Describe your contribution..." className="bg-[#222] border-[#333] text-white" rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#888]">Evidence URL</Label>
                <Input value={newContribution.evidence_url} onChange={(e) => setNewContribution({ ...newContribution, evidence_url: e.target.value })} placeholder="https://..." className="bg-[#222] border-[#333] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#888]">Difficulty</Label>
                <Select value={newContribution.difficulty} onValueChange={(v) => setNewContribution({ ...newContribution, difficulty: v as "easy" | "medium" | "hard" | "exceptional" })}>
                  <SelectTrigger className="bg-[#222] border-[#333] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    <SelectItem value="easy">Easy (5 pts)</SelectItem>
                    <SelectItem value="medium">Medium (10 pts)</SelectItem>
                    <SelectItem value="hard">Hard (20 pts)</SelectItem>
                    <SelectItem value="exceptional">Exceptional (50 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-[#333] text-[#888]" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A]" disabled={!newContribution.title.trim()}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!reviewDialog} onOpenChange={(open) => { if (!open) setReviewDialog(null); }}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
          <DialogHeader><DialogTitle>Review Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-white">{reviewDialog?.title}</p>
              <p className="text-xs text-[#666] mt-1">{reviewDialog?.description}</p>
              {reviewDialog?.evidence_url && (
                <a href={reviewDialog.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2bb673] flex items-center gap-1 mt-2">
                  <ExternalLink className="w-3 h-3" /> View evidence
                </a>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[#888]">Reviewer Note</Label>
              <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Leave a note..." className="bg-[#222] border-[#333] text-white" rows={3} />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="border-[#333] text-[#888]" onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button onClick={() => reviewDialog && handleReview(reviewDialog.id, "rejected")} className="bg-red-500 hover:bg-red-600 text-white">
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button onClick={() => reviewDialog && handleReview(reviewDialog.id, "approved")} className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A]">
              <CheckCircle className="w-4 h-4 mr-1" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-[#141414] border border-[#222]">
          <TabsTrigger value="all" className="data-[state=active]:bg-[#2bb673]/15 data-[state=active]:text-[#2bb673]">All</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/15 data-[state=active]:text-yellow-400">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-[#2bb673]/15 data-[state=active]:text-[#2bb673]">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-500/15 data-[state=active]:text-red-400">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={filter}>
          <div className="space-y-3 mt-4">
            {filteredContributions.length === 0 ? (
              <div className="bg-[#141414] border border-[#222] rounded-xl p-12 text-center">
                <SendHorizontal className="w-10 h-10 text-[#333] mx-auto mb-3" />
                <p className="text-[#555] text-sm">No contributions found.</p>
              </div>
            ) : (
              filteredContributions.map((c: Contribution, idx: number) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03, duration: 0.2 }}
                  className="bg-[#141414] border border-[#222] rounded-xl p-4 hover:border-[#2bb673]/10 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                        <Badge variant="outline" className="text-[10px] border-[#333] text-[#888]">{c.category}</Badge>
                        <span className="text-[10px] text-[#555]">{c.points} pts</span>
                      </div>
                      {c.description && <p className="text-xs text-[#888] line-clamp-2">{c.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-[#555]">{new Date(c.created_at).toLocaleDateString()}</span>
                        {c.evidence_url && (
                          <a href={c.evidence_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#2bb673] flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Evidence
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${c.status === "pending" ? "bg-yellow-500/15 text-yellow-400" : c.status === "approved" ? "bg-[#2bb673]/15 text-[#2bb673]" : "bg-red-500/15 text-red-400"}`}>
                        {c.status === "pending" && <Clock className="w-3 h-3" />}
                        {c.status === "approved" && <CheckCircle className="w-3 h-3" />}
                        {c.status === "rejected" && <XCircle className="w-3 h-3" />}
                        {c.status}
                      </span>
                      {c.reviewer_note && <p className="text-[10px] text-[#555] italic max-w-[200px]">&quot;{c.reviewer_note}&quot;</p>}
                      {isAdmin && c.status === "pending" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-[#333] text-[#888] hover:border-[#2bb673]/50 hover:text-[#2bb673]"
                          onClick={() => { setReviewDialog(c); setReviewNote(""); }}>
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
