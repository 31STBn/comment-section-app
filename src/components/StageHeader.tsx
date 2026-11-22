"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Maximize, Minimize, Volume2, VolumeX, Shield, Smartphone, Megaphone } from "lucide-react";

interface StageHeaderProps {
  title: string;
  subtitle: string;
  commentCount: number;
  announcement?: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function StageHeader({
  title,
  subtitle,
  commentCount,
  announcement,
  soundEnabled,
  onToggleSound,
}: StageHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Fullscreen request failed:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Exit fullscreen failed:", err);
      });
    }
  };

  return (
    <header className="w-full mb-6">
      {/* Broadcast Announcement Banner if set by superadmin */}
      {announcement && announcement.trim() && (
        <div className="mb-4 w-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 p-[1px] rounded-2xl shadow-xl animate-fade-in-up">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-[15px] px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Megaphone className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 mr-2">
                  Live Announcement:
                </span>
                <span className="text-sm sm:text-base font-semibold text-white">
                  {announcement}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title and live status */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Live Stage
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {title || "Live Audience Comments"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/80 mt-0.5">
              {subtitle || "Scan the QR code to post live comments directly to this screen"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-2xl border transition-all ${
              soundEnabled
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30"
                : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title={soundEnabled ? "Sound enabled (chime on new comment)" : "Sound muted"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Stage View"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Open Mobile View */}
          <Link
            href="/audience"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all"
            title="Open Audience Submission Page"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Audience Form</span>
          </Link>

          {/* Superadmin Link */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-all"
            title="Open Superadmin Control Panel"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Admin Panel</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
