"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  Users,
  SendHorizontal,
  Banknote,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import Link from "next/link";
import {
  usersApi,
  contributionsApi,
  projectsApi,
  type User,
  type Contribution,
  type Project,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.35,
    ease: [0.23, 1, 0.32, 1] as const,
  } as Transition,
};

export default function Dashboard() {
  const { user: authUser } = useAppAuth();

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
    refetchInterval: 10000,
  });

  const { data: pendingReviews } = useQuery({
    queryKey: ["contributions", "pending"],
    queryFn: () => contributionsApi.list({ status: "pending" }),
    refetchInterval: 10000,
  });

  const { data: activeProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
    refetchInterval: 10000,
  });

  const firstName = authUser?.name?.split(" ")[0] || "there";

  const activeInterns =
    allUsers?.filter(
      (u: User) => u.role === "intern" || u.role === "team_member"
    )?.length ?? 0;
  const pendingCount = pendingReviews?.length ?? 0;
  const activeProjectCount =
    activeProjects?.filter(
      (p: Project) => p.status !== "completed" && p.status !== "lead"
    ).length ?? 0;
  const revenuePending =
    activeProjects
      ?.filter(
        (p: Project) => p.status !== "completed" && p.status !== "lead"
      )
      .reduce((sum: number, p: Project) => sum + (Number(p.budget) || 0), 0) ?? 0;

  const statCards = [
    {
      label: "Active Projects",
      value: activeProjectCount,
      icon: FolderKanban,
      color: "#2bb673",
      to: "/projects",
    },
    {
      label: "Active Interns",
      value: activeInterns,
      icon: Users,
      color: "#3b82f6",
      to: "/team",
    },
    {
      label: "Pending Reviews",
      value: pendingCount,
      icon: SendHorizontal,
      color: "#f59e0b",
      to: "/contributions",
    },
    {
      label: "Revenue Pending",
      value: `ETB ${revenuePending.toLocaleString()}`,
      icon: Banknote,
      color: "#8b5cf6",
      to: "/projects",
    },
  ];

  const teamMembers = (allUsers || []).filter(
    (u: User) => u.role === "intern" || u.role === "team_member"
  );

  function getStarRating(points: number): number {
    if (points >= 300) return 5;
    if (points >= 200) return 4;
    if (points >= 100) return 3;
    if (points >= 50) return 2;
    return 1;
  }

  if (usersLoading || projectsLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-64 bg-[#1a1a1a]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-[#1a1a1a]" />
          ))}
        </div>
        <Skeleton className="h-64 bg-[#1a1a1a]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div {...fadeIn}>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Good morning, {firstName}
        </h1>
        <p className="text-[#888] mt-1">
          Here&apos;s what&apos;s happening at Vibey World today.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        {...fadeIn}
        transition={{ delay: 0.05 }}
      >
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              {
                delay: 0.05 + i * 0.05,
                duration: 0.35,
                ease: [0.23, 1, 0.32, 1] as const,
              } as Transition
            }
          >
            <Link href={card.to}>
              <div className="bg-[#141414] border border-[#222] rounded-xl p-5 hover:border-[#2bb673]/30 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <card.icon
                      className="w-5 h-5"
                      style={{ color: card.color }}
                    />
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#555] group-hover:text-[#2bb673] transition-colors" />
                </div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-sm text-[#666] mt-1">{card.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Team Performance */}
      <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
        <h2 className="text-lg font-semibold text-white mb-4">
          Team Performance
        </h2>
        <div className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="text-left text-xs font-medium text-[#666] uppercase tracking-wider px-5 py-3">
                    Member
                  </th>
                  <th className="text-left text-xs font-medium text-[#666] uppercase tracking-wider px-5 py-3">
                    Level
                  </th>
                  <th className="text-left text-xs font-medium text-[#666] uppercase tracking-wider px-5 py-3">
                    Points
                  </th>
                  <th className="text-left text-xs font-medium text-[#666] uppercase tracking-wider px-5 py-3">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-[#555] py-8"
                    >
                      No team members yet.
                    </td>
                  </tr>
                ) : (
                  teamMembers
                    .sort(
                      (a: User, b: User) =>
                        (b.total_points || 0) - (a.total_points || 0)
                    )
                    .map((member: User) => {
                      const points = member.total_points || 0;
                      const level =
                        points >= 300
                          ? "Top Contributor"
                          : points >= 150
                          ? "Core Contributor"
                          : points >= 50
                          ? "Contributor"
                          : "New Contributor";
                      const stars = getStarRating(points);
                      return (
                        <tr
                          key={member.id}
                          className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <Link href={`/team/${member.id}`}>
                              <div className="flex items-center gap-3 cursor-pointer">
                                <div className="w-8 h-8 rounded-full bg-[#2bb673]/15 flex items-center justify-center text-[#2bb673] text-xs font-semibold">
                                  {member.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {member.name}
                                  </p>
                                  <p className="text-xs text-[#666]">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-5 py-3">
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
                          </td>
                          <td className="px-5 py-3 text-sm text-[#ccc]">
                            {points}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < stars
                                      ? "text-[#f4a429] fill-[#f4a429]"
                                      : "text-[#333]"
                                  }`}
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Recent Contributions */}
      <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Contributions
        </h2>
        <div className="bg-[#141414] border border-[#222] rounded-xl p-5">
          {pendingReviews && pendingReviews.length > 0 ? (
            <div className="space-y-3">
              {pendingReviews.slice(0, 5).map((c: Contribution) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0"
                >
                  <div>
                    <p className="text-sm text-white font-medium">{c.title}</p>
                    <p className="text-xs text-[#666] mt-0.5">
                      {c.category} &middot; {c.points} points
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-400">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#555] text-sm text-center py-4">
              No pending contributions to review.
            </p>
          )}
          <Link href="/contributions" className="mt-4 block text-center">
            <span className="text-sm text-[#2bb673] hover:underline">
              View all contributions &rarr;
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
