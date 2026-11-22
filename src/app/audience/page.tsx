"use client";

import React, { useState, useEffect } from "react";
import { submitAudienceComment } from "@/app/actions/audience-actions";
import { supabase } from "@/lib/supabase/client";
import { LiveComment, LiveSystemSettings } from "@/types/database";
import LiveCommentCard from "@/components/LiveCommentCard";
import {
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  User,
  Heart,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";

const EMOJI_OPTIONS = ["💬", "🔥", "🚀", "💡", "❤️", "👏", "🎉", "⭐", "🤓", "😎", "🙌", "💯"];
const QUICK_REACTIONS = ["👏 Great point!", "🔥 Amazing presentation!", "💡 Question:", "❤️ Loved this!", "🚀 Let's go!"];

export default function AudiencePage() {
  const [activeTab, setActiveTab] = useState<"form" | "feed">("form");
  const [authorName, setAuthorName] = useState<string>("");
  const [authorAvatar, setAuthorAvatar] = useState<string>("💬");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [settings, setSettings] = useState<LiveSystemSettings | null>(null);
  const [recentComments, setRecentComments] = useState<LiveComment[]>([]);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(false);

  // Load saved name & avatar from localStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("audience_name");
      const savedAvatar = localStorage.getItem("audience_avatar");
      if (savedName) setAuthorName(savedName);
      if (savedAvatar) setAuthorAvatar(savedAvatar);
    } catch (e) {
      // localStorage not accessible
    }

    // Fetch initial settings & feed
    async function init() {
      const { data: s } = await supabase
        .from("live_system_settings")
        .select("*")
        .eq("id", "current")
        .single();
      if (s) setSettings(s as LiveSystemSettings);
    }
    init();
  }, []);

  // Fetch comments when switching to feed tab
  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const { data } = await supabase
        .from("live_comments")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) setRecentComments(data as LiveComment[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (activeTab === "feed") {
      fetchFeed();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Save name for convenience
      try {
        localStorage.setItem("audience_name", authorName.trim());
        localStorage.setItem("audience_avatar", authorAvatar);
      } catch (err) {}

      const res = await submitAudienceComment({
        author_name: authorName.trim(),
        author_avatar: authorAvatar,
        content: content.trim(),
      });

      if (res.success) {
        setContent("");
        setFeedback({
          type: "success",
          text: res.message,
        });

        // Trigger confetti
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });

        setTimeout(() => {
          setFeedback(null);
        }, 6000);
      } else {
        setFeedback({
          type: "error",
          text: res.message,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to submit comment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col items-center p-4 sm:p-6">
      {/* Top Mobile Header */}
      <div className="w-full max-w-md flex flex-col items-center text-center my-4 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Live Stage Interactivity
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {settings?.event_title || "Join The Conversation"}
        </h1>
        <p className="text-xs text-slate-300/80">
          {settings?.event_subtitle || "Your comment will appear live on the stage screen"}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full max-w-md flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === "form"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Send className="w-4 h-4" />
          Post Comment
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === "feed"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Live Stream
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-md">
        {activeTab === "form" ? (
          <div className="glass-panel-glow rounded-3xl p-6 sm:p-7 space-y-5">
            {/* Locked notice if organizer paused comments */}
            {settings && !settings.allow_comments && (
              <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <div className="font-bold">Submissions Paused</div>
                  <div>The host has temporarily paused new comments.</div>
                </div>
              </div>
            )}

            {/* Success or Error Feedback */}
            {feedback && (
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 animate-fade-in-up ${
                  feedback.type === "success"
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200"
                    : "bg-rose-500/20 border border-rose-500/40 text-rose-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div className="font-medium">{feedback.text}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Your Name / Handle
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Alex Johnson or @alex"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Avatar Emoji Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Pick an Avatar Badge
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setAuthorAvatar(emoji)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                        authorAvatar === emoji
                          ? "bg-indigo-600 scale-110 shadow-lg border border-indigo-400"
                          : "bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>Your Live Message / Question</span>
                  <span className={`text-[11px] ${content.length > 250 ? "text-amber-400" : "text-slate-500"}`}>
                    {content.length}/500
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your comment, reaction, or question for the speaker..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 text-sm outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Quick Reaction suggestions */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REACTIONS.map((quick) => (
                    <button
                      type="button"
                      key={quick}
                      onClick={() => setContent((prev) => (prev ? `${prev} ${quick}` : quick))}
                      className="px-2.5 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 text-xs border border-slate-700/50 transition-colors"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (settings !== null && !settings.allow_comments)}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold text-base shadow-xl shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    <span>Send Live Comment</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Live Feed View */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Recent Stage Comments
              </span>
              <button
                onClick={fetchFeed}
                disabled={loadingFeed}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingFeed ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingFeed ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-panel rounded-2xl p-4 h-24 animate-pulse bg-slate-800/50" />
                ))}
              </div>
            ) : recentComments.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-sm">
                No approved comments yet. Be the first to share one!
              </div>
            ) : (
              recentComments.map((comment) => (
                <LiveCommentCard key={comment.id} comment={comment} isStageView={false} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer link to main screen */}
      <footer className="mt-8 text-center text-xs text-slate-500">
        <a href="/" className="hover:text-slate-300 transition-colors">
          View Big Stage Display
        </a>
      </footer>
    </div>
  );
}
