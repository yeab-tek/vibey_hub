"use client";

import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center p-8">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[#888] mb-4">Page Not Found</h2>
        <p className="text-[#555] mb-8">The page you are looking for doesn&apos;t exist.</p>
        <Link href="/">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2bb673] hover:bg-[#25a065] text-[#0A0A0A] font-medium mx-auto">
            <Home className="w-4 h-4" /> Go Home
          </button>
        </Link>
      </div>
    </div>
  );
}
