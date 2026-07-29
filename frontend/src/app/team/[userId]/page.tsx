"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Award,
  SendHorizontal,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  usersApi,
  contributionsApi,
  calculateLevel,
  roleLabels,
  type User,
  type Contribution,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";

export default function UserProfile() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.get(userId!),
    enabled: !!userId,
  });

  const { data: userContributions, isLoading: contributionsLoading } = useQuery(
    {
      queryKey: ["contributions", "user", userId],
      queryFn: () => contributionsApi.list({ user_id: userId! }),
      enabled: !!userId,
    }
  );

  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 bg-[#1a1a1a]" />
          <Skeleton className="h-64 bg-[#1a1a1a]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-[#555]">User not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const level = calculateLevel(user.total_points || 0);

  const levelColors: Record<string, string> = {
    "New Contributor": "bg-[#333] text-[#888]",
    Contributor: "bg-yellow-500/15 text-yellow-400",
    "Core Contributor": "bg-blue-500/15 text-blue-400",
    "Top Contributor": "bg-[#2bb673]/15 text-[#2bb673]",
  };

  const skills: string[] = Array.isArray(user.skills) ? user.skills : [];
  const contributions: Contribution[] = (userContributions || []) as Contribution[];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/team">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#888] hover:text-white p-0 h-8"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
        </div>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#141414] border border-[#222] rounded-xl p-6"
        >
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-[#2bb673]/15 flex items-center justify-center text-[#2bb673] font-bold text-2xl shrink-0">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-white">{user.name}</h1>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    levelColors[level] || levelColors["New Contributor"]
                  }`}
                >
                  <Award className="w-3 h-3 mr-1" />
                  {level}
                </Badge>
              </div>
              <p className="text-sm text-[#666]">{user.email}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-[#888]">
                <span className="px-2 py-0.5 rounded bg-[#333] text-xs">
                  {roleLabels[user.role] || user.role}
                </span>
                <span className="text-xs text-[#555] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {skills.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[10px] border-[#333] text-[#888]"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 pt-5 border-t border-[#222] grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#2bb673]">
                {contributions.length}
              </p>
              <p className="text-xs text-[#555]">Contributions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#2bb673]">
                {
                  contributions.filter((c) => c.status === "approved").length
                }
              </p>
              <p className="text-xs text-[#555]">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#2bb673]">
                {user.total_points || 0}
              </p>
              <p className="text-xs text-[#555]">Total Points</p>
            </div>
          </div>
        </motion.div>

        {/* Contribution history */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider flex items-center gap-2">
            <SendHorizontal className="w-4 h-4" />
            Contribution History
          </h2>
          {contributionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 bg-[#1a1a1a]" />
              ))}
            </div>
          ) : contributions.length === 0 ? (
            <div className="bg-[#141414] border border-[#222] rounded-xl p-8 text-center">
              <SendHorizontal className="w-8 h-8 text-[#333] mx-auto mb-2" />
              <p className="text-[#555] text-sm">No contributions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contributions.map((c: Contribution, idx: number) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  className="bg-[#141414] border border-[#222] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[#666] mt-0.5">
                        {c.category}
                      </p>
                      {c.description && (
                        <p className="text-xs text-[#888] mt-1">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          c.status === "approved"
                            ? "bg-[#2bb673]/15 text-[#2bb673]"
                            : c.status === "rejected"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-yellow-500/15 text-yellow-400"
                        }`}
                      >
                        {c.status === "pending" && (
                          <Clock className="w-3 h-3" />
                        )}
                        {c.status === "approved" && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {c.status === "rejected" && (
                          <XCircle className="w-3 h-3" />
                        )}
                        {c.status}
                      </span>
                      <span className="text-[10px] text-[#555]">
                        {c.points} pts
                      </span>
                      {c.evidence_url && (
                        <a
                          href={c.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1"
                        >
                          <ExternalLink className="w-3 h-3 text-[#555] hover:text-[#2bb673]" />
                        </a>
                      )}
                    </div>
                  </div>
                  {c.reviewer_note && (
                    <p className="text-xs text-[#555] italic mt-2 pt-2 border-t border-[#222]">
                      Reviewer: &quot;{c.reviewer_note}&quot;
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
