"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi, type User, calculateLevel, roleLabels } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Team() {
  const { user: authUser } = useAppAuth();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
    refetchInterval: 10000,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role updated successfully");
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });

  const [roleDialog, setRoleDialog] = useState<{
    userId: string;
    currentRole: string;
  } | null>(null);
  const [newRole, setNewRole] = useState("team_member");

  const teamMembers =
    members?.filter(
      (m: User) => m.role === "intern" || m.role === "team_member"
    ) || [];
  const founders =
    members?.filter(
      (m: User) => m.role === "founder" || String(m.role) === "admin"
    ) || [];

  const handleUpdateRole = async () => {
    if (!roleDialog) return;
    await updateRoleMutation.mutateAsync({
      id: roleDialog.userId,
      role: newRole,
    });
    setRoleDialog(null);
  };

  const isAdmin =
    authUser?.role === "founder" || String(authUser?.role) === "admin";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-[#1a1a1a]" />
        <Skeleton className="h-16 bg-[#1a1a1a]" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-[#1a1a1a]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2bb673]" />
            Team
          </h1>
          <p className="text-[#888] text-sm mt-1">
            Manage your team members and roles
          </p>
        </div>
      </div>

      {/* Founders */}
      {founders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider">
            Founders
          </h2>
          <div className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden">
            {founders.map((founder: User) => (
              <div
                key={founder.id}
                className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] last:border-0"
              >
                <Link href={`/team/${founder.id}`}>
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-[#2bb673]/15 flex items-center justify-center text-[#2bb673] font-semibold text-sm">
                      {founder.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {founder.name}
                      </p>
                      <p className="text-xs text-[#666]">{founder.email}</p>
                    </div>
                  </div>
                </Link>
                <span className="text-xs px-3 py-1 rounded-full bg-[#2bb673]/15 text-[#2bb673] flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {roleLabels[founder.role] || founder.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members / Interns */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider">
            Team Members & Interns ({teamMembers.length})
          </h2>
        </div>
        <div className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden">
          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="w-10 h-10 text-[#333] mx-auto mb-3" />
              <p className="text-[#555] text-sm">No team members yet.</p>
              <p className="text-[#444] text-xs mt-1">
                Team members will appear here once they are added.
              </p>
            </div>
          ) : (
            teamMembers.map((member: User, idx: number) => {
              const level = calculateLevel(member.total_points || 0);
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] last:border-0 hover:bg-[#1a1a1a]/30 transition-colors"
                >
                  <Link href={`/team/${member.id}`}>
                    <div className="flex items-center gap-3 cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-[#3b82f6]/15 flex items-center justify-center text-[#3b82f6] font-semibold text-sm">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {member.name}
                        </p>
                        <p className="text-xs text-[#666]">{member.email}</p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        level === "Top Contributor"
                          ? "bg-[#2bb673]/15 text-[#2bb673]"
                          : level === "Core Contributor"
                          ? "bg-blue-500/15 text-blue-400"
                          : level === "Contributor"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-[#333] text-[#888]"
                      }`}
                    >
                      {level}
                    </span>
                    {isAdmin && (
                      <Dialog
                        open={roleDialog?.userId === member.id}
                        onOpenChange={(open) => {
                          if (!open) setRoleDialog(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-[#333] text-[#888] hover:border-[#2bb673]/50 hover:text-[#2bb673]"
                            onClick={() => {
                              setRoleDialog({
                                userId: member.id,
                                currentRole: member.role,
                              });
                              setNewRole(member.role);
                            }}
                          >
                            {roleLabels[member.role] || member.role}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                          <DialogHeader>
                            <DialogTitle>Change Role</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Select
                              value={newRole}
                              onValueChange={setNewRole}
                            >
                              <SelectTrigger className="bg-[#222] border-[#333] text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                                <SelectItem value="founder">Founder</SelectItem>
                                <SelectItem value="team_member">
                                  Team Member
                                </SelectItem>
                                <SelectItem value="intern">Intern</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              className="border-[#333] text-[#888]"
                              onClick={() => setRoleDialog(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleUpdateRole}
                              className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A]"
                            >
                              Save
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
