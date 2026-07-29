"use client";

import { useAppAuth } from "@/contexts/AppAuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { difficultySettingsApi, type DifficultySetting } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { user: authUser } = useAppAuth();
  const queryClient = useQueryClient();
  const isAdmin = authUser?.role === "founder" || String(authUser?.role) === "admin";

  const { data: difficultySettings, isLoading } = useQuery({
    queryKey: ["difficulty-settings"],
    queryFn: () => difficultySettingsApi.list(),
    refetchInterval: 10000,
  });

  const updateSetting = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { points: number } }) =>
      difficultySettingsApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["difficulty-settings"] });
      toast.success("Setting updated");
    },
    onError: () => toast.error("Failed to update setting"),
  });

  const [localPoints, setLocalPoints] = useState<Record<string, string>>({});

  const handleSave = async (id: string) => {
    const key = `points-${id}`;
    const pts = localPoints[key];
    if (pts === undefined || isNaN(Number(pts))) return;
    await updateSetting.mutateAsync({ id, body: { points: Number(pts) } });
  };

  const settings: DifficultySetting[] = (difficultySettings || []) as DifficultySetting[];

  const difficulties = [
    { key: "easy", label: "Easy", color: "#2bb673" },
    { key: "medium", label: "Medium", color: "#f59e0b" },
    { key: "hard", label: "Hard", color: "#3b82f6" },
    { key: "exceptional", label: "Exceptional", color: "#8b5cf6" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-[#1a1a1a]" />
        <Skeleton className="h-40 bg-[#1a1a1a]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <SettingsIcon className="w-10 h-10 text-[#333] mx-auto mb-3" />
          <p className="text-[#555] text-sm">You don&apos;t have permission to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-[#2bb673]" />
          Settings
        </h1>
        <p className="text-[#888] text-sm mt-1">Manage difficulty-to-point mappings</p>
      </div>

      <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
        <h2 className="text-sm font-medium text-white mb-4">Difficulty Points</h2>
        <div className="space-y-4">
          {settings.length === 0 ? (
            <p className="text-[#555] text-sm text-center py-4">
              No difficulty settings configured yet.
            </p>
          ) : (
            settings.map((setting) => {
              const diff = difficulties.find((d) => d.key === setting.difficulty);
              return (
                <div key={setting.id} className="flex items-center gap-4">
                  <div className="w-28">
                    <span className="text-sm font-medium" style={{ color: diff?.color }}>
                      {diff?.label || setting.difficulty}
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={localPoints[`points-${setting.id}`] ?? String(setting.points)}
                    onChange={(e) =>
                      setLocalPoints((prev) => ({
                        ...prev,
                        [`points-${setting.id}`]: e.target.value,
                      }))
                    }
                    className="w-32 bg-[#222] border-[#333] text-white"
                  />
                  <span className="text-xs text-[#555]">points</span>
                  <Button
                    size="sm"
                    onClick={() => handleSave(setting.id)}
                    className="bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A] h-8"
                    disabled={localPoints[`points-${setting.id}`] === String(setting.points)}
                  >
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
        <h2 className="text-sm font-medium text-white mb-4">Level System</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { level: "New Contributor", range: "0 - 49 pts", color: "#888" },
            { level: "Contributor", range: "50 - 149 pts", color: "#f59e0b" },
            { level: "Core Contributor", range: "150 - 299 pts", color: "#3b82f6" },
            { level: "Top Contributor", range: "300+ pts", color: "#2bb673" },
          ].map((l) => (
            <div key={l.level} className="bg-[#0f0f0f] rounded-lg p-3 text-center">
              <p className="text-xs font-medium" style={{ color: l.color }}>{l.level}</p>
              <p className="text-[10px] text-[#555] mt-1">{l.range}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
