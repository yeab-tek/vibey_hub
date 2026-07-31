"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Circle, FolderKanban } from "lucide-react";
import { portalApi, type PortalData } from "@/lib/api";

const statusLabels: Record<string, string> = {
  lead: "Lead",
  requirement: "Requirements",
  design: "Design",
  development: "Development",
  testing: "Testing",
  deployment: "Deployment",
  completed: "Completed",
};

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    portalApi
      .get(token)
      .then((result) => {
        if (mounted) setData(result);
      })
      .catch(() => {
        if (mounted) setNotFound(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-[#2bb673] animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
        <div className="text-center max-w-sm">
          <FolderKanban className="w-10 h-10 text-[#333] mx-auto mb-3" />
          <h1 className="text-white text-lg font-semibold mb-1">Link not found</h1>
          <p className="text-[#666] text-sm">
            This project link is invalid or no longer active. Please check with your Vibey World contact for an updated link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2bb673]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2bb673]/3 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-6">
          <p className="text-[#2bb673] text-xs font-medium tracking-wide uppercase mb-1">
            Project Progress
          </p>
          <h1 className="text-2xl font-bold text-white">{data.project_name}</h1>
          <p className="text-[#666] text-sm mt-1">for {data.client_name}</p>
        </div>

        <div className="bg-[#141414] border border-[#222] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#888] uppercase tracking-wide">
              Current Stage
            </span>
            <span className="text-sm font-medium text-[#2bb673]">
              {statusLabels[data.status] || data.status}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#888]">Overall Progress</span>
              <span className="text-xs font-medium text-white">
                {data.progress_percent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#222] overflow-hidden">
              <div
                className="h-full bg-[#2bb673] transition-all duration-500"
                style={{ width: `${data.progress_percent}%` }}
              />
            </div>
          </div>

          {data.next_item && (
            <div className="flex items-start gap-2 bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
              <Circle className="w-4 h-4 text-[#2bb673] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-[#888]">Up Next</p>
                <p className="text-sm text-white mt-0.5">{data.next_item}</p>
              </div>
            </div>
          )}

          {data.completed_items.length > 0 && (
            <div>
              <p className="text-xs text-[#888] uppercase tracking-wide mb-2">
                Completed
              </p>
              <div className="space-y-1.5">
                {data.completed_items.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2bb673] shrink-0" />
                    <span className="text-sm text-[#ccc]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-[#444] text-xs text-center mt-8">
          Vibey World &middot; Modernizing Lives. Unlocking Potential.
        </p>
      </motion.div>
    </div>
  );
}
