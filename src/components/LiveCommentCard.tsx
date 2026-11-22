"use client";

import React, { useState } from "react";
import { LiveComment, AppLanguage } from "@/types/database";
import { Heart, Pin, Clock } from "lucide-react";
import { likeCommentAction } from "@/app/actions/audience-actions";
import { ThemeConfig, THEMES } from "@/lib/themes";
import { translations } from "@/lib/i18n";

interface LiveCommentCardProps {
  comment: LiveComment;
  isStageView?: boolean;
  themeConfig?: ThemeConfig;
  language?: AppLanguage;
}

export default function LiveCommentCard({
  comment,
  isStageView = false,
  themeConfig = THEMES["military-trucks"],
  language = "both",
}: LiveCommentCardProps) {
  const [likes, setLikes] = useState<number>(comment.likes_count || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked || isLiking) return;

    setHasLiked(true);
    setLikes((prev) => prev + 1);
    setIsLiking(true);

    try {
      const res = await likeCommentAction(comment.id);
      if (res.success) {
        setLikes(res.likes);
      }
    } catch (err) {
      console.error("Failed to like comment:", err);
    } finally {
      setIsLiking(false);
    }
  };

  // Format relative time
  const getTimeString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 20) {
        return language === "bn" ? translations.bn.justNow : translations.en.justNow;
      }
      if (diffSec < 60) {
        return language === "bn" ? `${diffSec} সেকেন্ড আগে` : `${diffSec}s ago`;
      }
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) {
        return language === "bn" ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`;
      }
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) {
        return language === "bn" ? `${diffHr} ঘণ্টা আগে` : `${diffHr}h ago`;
      }
      return date.toLocaleDateString();
    } catch {
      return language === "bn" ? "এইমাত্র" : "Recently";
    }
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      "from-emerald-700 to-green-900",
      "from-teal-600 to-emerald-800",
      "from-amber-600 to-yellow-800",
      "from-indigo-600 to-blue-900",
      "from-purple-600 to-indigo-900",
      "from-rose-600 to-red-900",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  return (
    <div
      className={`relative transition-all duration-300 rounded-2xl p-4 sm:p-5 ${
        comment.is_pinned ? themeConfig.pinnedCardClass : themeConfig.commentCardClass
      } animate-fade-in-up`}
    >
      {/* Pinned Tag Badge */}
      {comment.is_pinned && (
        <div className="absolute -top-3 left-5 inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md">
          <Pin className="w-3 h-3 fill-current" />
          <span>
            {language === "bn"
              ? translations.bn.featuredComment
              : language === "en"
              ? translations.en.featuredComment
              : "নির্বাচিত • Featured"}
          </span>
        </div>
      )}

      {/* Top Author Row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-lg font-bold shadow-md bg-gradient-to-br ${getAvatarGradient(
              comment.author_name
            )} text-white shrink-0`}
          >
            {comment.author_avatar && comment.author_avatar !== "💬" ? (
              <span>{comment.author_avatar}</span>
            ) : (
              <span>{comment.author_name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-extrabold text-base sm:text-lg tracking-tight ${themeConfig.authorNameClass}`}
              >
                {comment.author_name}
              </span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${themeConfig.metaTextClass}`}>
              <Clock className="w-3 h-3 opacity-75" />
              <span>{getTimeString(comment.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`group flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
            hasLiked
              ? "bg-rose-500/20 text-rose-600 border border-rose-500/40"
              : themeConfig.isLight
              ? "bg-emerald-950/5 hover:bg-rose-500/15 text-emerald-900 hover:text-rose-600 border border-emerald-900/15"
              : "bg-white/10 hover:bg-rose-500/20 text-slate-200 hover:text-rose-300 border border-white/15"
          }`}
          title="Like"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-125 ${
              hasLiked ? "fill-rose-500 text-rose-500 scale-110" : "opacity-80"
            }`}
          />
          <span>{likes}</span>
        </button>
      </div>

      {/* Comment Body */}
      <div
        className={`leading-relaxed break-words ${themeConfig.commentTextClass} ${
          isStageView ? "text-base sm:text-lg md:text-xl" : "text-sm sm:text-base"
        }`}
      >
        {comment.content}
      </div>
    </div>
  );
}
