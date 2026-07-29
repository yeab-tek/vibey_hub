"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import { notificationsApi } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, Clock, SendHorizontal, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { AppNotification } from "@/lib/api";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  task_assignment: Bell, deadline_warning: AlertTriangle,
  contribution_submit: SendHorizontal, approval_needed: Shield,
};
const colorMap: Record<string, string> = {
  task_assignment: "#3b82f6", deadline_warning: "#f59e0b",
  contribution_submit: "#2bb673", approval_needed: "#8b5cf6",
};

export default function Notifications() {
  const { user } = useAppAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => notificationsApi.list(user!.id),
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });

  const handleMarkRead = async (id: string) => {
    try { await notificationsApi.markRead(id); invalidate(); }
    catch { toast.error("Failed to mark as read"); }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try { await notificationsApi.markAllRead(user.id); toast.success("All marked as read"); invalidate(); }
    catch { toast.error("Failed to mark all as read"); }
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-[#1a1a1a]" />
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 bg-[#1a1a1a]" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#2bb673]" /> Notifications
            {unreadCount > 0 && <span className="text-xs bg-[#2bb673]/15 text-[#2bb673] px-2 py-0.5 rounded-full">{unreadCount} new</span>}
          </h1>
          <p className="text-[#888] text-sm mt-1">Stay updated on task and contribution activity</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" className="h-8 text-xs border-[#333] text-[#888] hover:border-[#2bb673]/50 hover:text-[#2bb673]" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {!notifications || notifications.length === 0 ? (
          <div className="bg-[#141414] border border-[#222] rounded-xl p-12 text-center">
            <Bell className="w-10 h-10 text-[#333] mx-auto mb-3" />
            <p className="text-[#555] text-sm">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n: AppNotification, idx: number) => {
            const Icon = iconMap[n.type] || Bell;
            const color = colorMap[n.type] || "#888";
            return (
              <motion.div key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03, duration: 0.2 }}
                className={`bg-[#141414] border rounded-xl p-4 flex items-start gap-3 transition-colors ${!n.is_read ? "border-[#2bb673]/20" : "border-[#222]"}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!n.is_read ? "text-white" : "text-[#888]"}`}>{n.title}</p>
                  <p className="text-xs text-[#666] mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-[#444] mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.is_read && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-[#555] hover:text-[#2bb673]" onClick={() => handleMarkRead(n.id)}>Read</Button>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
