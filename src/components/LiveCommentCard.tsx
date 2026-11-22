"use client";

import React, { useState } from "react";
import { LiveComment } from "@/types/database";
import { Heart, Pin, Clock } from "lucide-react";
import { likeCommentAction } from "@/app/actions/audience-actions";

interface LiveCommentCardProps {
  comment: LiveComment;
  isStageView?: boolean;
}

export default function LiveCommentCard({ comment, isStageView = false }: LiveCommentCardProps) {
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

      if (diffSec < 15) return "Just now";
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  // Avatar color generator based on author name
  const getAvatarGradient = (name: string) => {
    const gradients = [
      "from-pink-500 to-rose-600",
      "from-purple-500 to-indigo-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-violet-500 to-fuchsia-600",
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
      className={`relative transition-all duration-300 rounded-2xl p-5 sm:p-6 backdrop-blur-md ${
        comment.is_pinned
          ? "bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border-2 border-amber-400/60 shadow-lg shadow-amber-500/10"
          : "bg-slate-900/70 border border-slate-700/60 hover:border-slate-500/70 shadow-md"
      } animate-fade-in-up`}
    >
      {/* Pinned Tag Badge */}
      {comment.is_pinned && (
        <div className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md">
          <Pin className="w-3 h-3 fill-current" />
          Featured Comment
        </div>
      )}

      {/* Top Author Row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold shadow-md bg-gradient-to-br ${getAvatarGradient(
              comment.author_name
            )} text-white`}
          >
            {comment.author_avatar && comment.author_avatar !== "💬" ? (
              <span>{comment.author_avatar}</span>
            ) : (
              <span>{comment.author_name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base sm:text-lg tracking-tight">
                {comment.author_name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{getTimeString(comment.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            hasLiked
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60"
          }`}
          title="Applaud / Upvote"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-125 ${
              hasLiked ? "fill-rose-400 text-rose-400 scale-110" : "text-slate-400 group-hover:text-rose-400"
            }`}
          />
          <span>{likes}</span>
        </button>
      </div>

      {/* Comment Body */}
      <div
        className={`text-slate-100 leading-relaxed font-normal break-words ${
          isStageView ? "text-lg sm:text-xl md:text-2xl" : "text-base sm:text-lg"
        }`}
      >
        {comment.content}
      </div>
    </div>
  );
}
