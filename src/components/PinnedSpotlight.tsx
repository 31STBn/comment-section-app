"use client";

import React from "react";
import { LiveComment } from "@/types/database";
import { Pin, Sparkles, Heart } from "lucide-react";
import confetti from "canvas-confetti";

interface PinnedSpotlightProps {
  pinnedComment: LiveComment;
}

export default function PinnedSpotlight({ pinnedComment }: PinnedSpotlightProps) {
  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="relative group mb-6 overflow-hidden rounded-3xl p-[2px] bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 shadow-2xl animate-fade-in-up">
      <div className="relative bg-slate-950/95 backdrop-blur-2xl rounded-[22px] p-6 sm:p-8">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Badge */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
              <Pin className="w-3.5 h-3.5 fill-current" />
              Pinned Spotlight
            </span>
            <span className="text-xs text-amber-300/80 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              Host Highlight
            </span>
          </div>

          <button
            onClick={triggerConfetti}
            className="p-1.5 rounded-full hover:bg-white/10 text-amber-300 transition-colors"
            title="Celebrate!"
          >
            🎉
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug break-words">
            "{pinnedComment.content}"
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center font-bold text-black text-sm">
                {pinnedComment.author_avatar && pinnedComment.author_avatar !== "💬"
                  ? pinnedComment.author_avatar
                  : pinnedComment.author_name.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-amber-200 text-base sm:text-lg">
                {pinnedComment.author_name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>{pinnedComment.likes_count} likes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
