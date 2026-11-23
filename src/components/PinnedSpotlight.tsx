"use client";

import React from "react";
import { LiveComment, AppLanguage } from "@/types/database";
import { Pin, Heart } from "lucide-react";
import confetti from "canvas-confetti";
import { ThemeConfig, THEMES } from "@/lib/themes";
import { translations } from "@/lib/i18n";

interface PinnedSpotlightProps {
  pinnedComment: LiveComment;
  themeConfig?: ThemeConfig;
  language?: AppLanguage;
}

export default function PinnedSpotlight({
  pinnedComment,
  themeConfig = THEMES["military-trucks"],
  language = "both",
}: PinnedSpotlightProps) {
  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="relative group mb-4 overflow-hidden rounded-3xl p-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-600 shadow-xl animate-fade-in-up">
      <div
        className={`relative rounded-[22px] p-5 sm:p-6 ${themeConfig.isLight
            ? "bg-white/95 backdrop-blur-xl text-emerald-950"
            : "bg-slate-950/95 backdrop-blur-2xl text-white"
          }`}
      >
        {/* Header Badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow">
              <Pin className="w-3.5 h-3.5 fill-current" />
              <span>
                {language === "bn"
                  ? translations.bn.featuredComment
                  : language === "en"
                    ? translations.en.featuredComment
                    : "নির্বাচিত মন্তব্য • Featured"}
              </span>
            </span>
          </div>

          <button
            onClick={triggerConfetti}
            className="p-1 rounded-full hover:bg-black/5 transition-colors text-base"
            title="Celebrate"
          >
            🎉
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p
            className={`text-lg sm:text-xl md:text-2xl font-extrabold leading-snug break-words ${themeConfig.isLight ? "text-emerald-950" : "text-white"
              }`}
          >
            &ldquo;{pinnedComment.content}&rdquo;
          </p>

          <div
            className={`flex items-center justify-between pt-2.5 border-t ${themeConfig.isLight ? "border-emerald-900/10" : "border-white/10"
              }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-amber-600 flex items-center justify-center font-bold text-white text-sm">
                {pinnedComment.author_avatar && pinnedComment.author_avatar !== "💬"
                  ? pinnedComment.author_avatar
                  : pinnedComment.author_name.charAt(0).toUpperCase()}
              </div>
              <span
                className={`font-bold text-sm sm:text-base ${themeConfig.isLight ? "text-emerald-900" : "text-amber-300"
                  }`}
              >
                {pinnedComment.author_name}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold bg-rose-500/10 text-rose-600 px-2.5 py-1 rounded-full border border-rose-500/20">
              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
              <span>{pinnedComment.likes_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
