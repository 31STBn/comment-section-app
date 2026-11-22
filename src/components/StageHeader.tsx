"use client";

import React, { useState, useEffect } from "react";
import { Maximize, Minimize, Volume2, VolumeX, Megaphone } from "lucide-react";
import { ThemeConfig, THEMES } from "@/lib/themes";
import { AppLanguage } from "@/types/database";
import { translations } from "@/lib/i18n";

interface StageHeaderProps {
  title: string;
  subtitle: string;
  commentCount: number;
  announcement?: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  themeConfig?: ThemeConfig;
  language?: AppLanguage;
}

export default function StageHeader({
  title,
  subtitle,
  commentCount,
  announcement,
  soundEnabled,
  onToggleSound,
  themeConfig = THEMES["military-trucks"],
  language = "both",
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
    <header className="w-full mb-5 relative z-10">
      {/* Subtle Floating Corner Stage Controls (Sound & Fullscreen only — no admin link) */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={onToggleSound}
          className="p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-white/20 shadow-lg backdrop-blur-md transition-all"
          title={soundEnabled ? "Mute Notification Chime" : "Enable Notification Chime"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-white/20 shadow-lg backdrop-blur-md transition-all"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Broadcast Announcement Banner if set by superadmin */}
      {announcement && announcement.trim() && (
        <div className="max-w-5xl mx-auto mb-4 bg-gradient-to-r from-emerald-800 via-amber-500 to-emerald-800 p-[2px] rounded-2xl shadow-lg animate-fade-in-up">
          <div className="bg-white/95 text-emerald-950 backdrop-blur-xl rounded-[14px] px-5 py-2.5 flex items-center justify-center gap-3 text-center">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 shrink-0">
              <Megaphone className="w-4 h-4 animate-bounce" />
            </span>
            <span className="text-sm sm:text-base font-bold">
              {announcement}
            </span>
          </div>
        </div>
      )}

      {/* Clean Presentation Header Bar (Centered with corner clearance for leaf graphics) */}
      <div
        className={`max-w-4xl mx-auto rounded-3xl px-6 py-4 sm:px-8 sm:py-5 flex flex-col items-center justify-center text-center relative ${themeConfig.headerCardClass}`}
      >
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-500/15 text-red-600 border border-red-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span>
              {language === "bn"
                ? translations.bn.liveBadge
                : language === "en"
                ? translations.en.liveBadge
                : "লাইভ • LIVE"}
            </span>
          </div>

          <span
            className={`text-xs font-bold px-3 py-0.5 rounded-full border ${themeConfig.accentBadgeClass}`}
          >
            {language === "bn"
              ? translations.bn.commentsCount(commentCount)
              : translations.en.commentsCount(commentCount)}
          </span>
        </div>

        <h1
          className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight ${themeConfig.titleTextClass}`}
        >
          {title || "Live Audience Comments"}
        </h1>

        {subtitle && (
          <p
            className={`text-xs sm:text-sm md:text-base font-medium mt-1 max-w-2xl ${themeConfig.subtitleTextClass}`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
