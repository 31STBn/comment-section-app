"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { LiveComment, LiveSystemSettings } from "@/types/database";
import QRCodeCard from "@/components/QRCodeCard";
import LiveCommentCard from "@/components/LiveCommentCard";
import PinnedSpotlight from "@/components/PinnedSpotlight";
import StageHeader from "@/components/StageHeader";
import { MessageSquare, Sparkles, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

export default function StageLiveScreen() {
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [settings, setSettings] = useState<LiveSystemSettings>({
    id: "current",
    event_title: "Live Audience Comments",
    event_subtitle: "Scan the QR code on your mobile phone to share your thoughts!",
    qr_url: "",
    auto_approve: true,
    allow_comments: true,
    announcement_banner: "",
    theme: "stage-dark",
    banned_words: [],
    updated_at: new Date().toISOString(),
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play subtle chime on new comment using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Audio chime failed to play:", e);
    }
  };

  // Initial fetch
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);

        // Fetch settings
        const { data: settingsData } = await supabase
          .from("live_system_settings")
          .select("*")
          .eq("id", "current")
          .single();

        if (settingsData) {
          setSettings(settingsData as LiveSystemSettings);
        }

        // Fetch approved comments
        const { data: commentsData } = await supabase
          .from("live_comments")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(100);

        if (commentsData) {
          setComments(commentsData as LiveComment[]);
        }
      } catch (err) {
        console.error("Error loading stage data:", err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    // 1. Comments channel
    const commentsChannel = supabase
      .channel("stage-live-comments")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_comments" },
        (payload) => {
          const newComment = payload.new as LiveComment;
          if (newComment.status === "approved") {
            setComments((prev) => [newComment, ...prev.filter((c) => c.id !== newComment.id)]);
            playChime();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_comments" },
        (payload) => {
          const updated = payload.new as LiveComment;

          // If was just pinned, trigger celebratory confetti
          if (updated.is_pinned && updated.status === "approved") {
            confetti({
              particleCount: 70,
              spread: 70,
              origin: { y: 0.5 },
            });
            playChime();
          }

          if (updated.status !== "approved") {
            // Remove if rejected or deleted
            setComments((prev) => prev.filter((c) => c.id !== updated.id));
          } else {
            setComments((prev) => {
              const exists = prev.some((c) => c.id === updated.id);
              if (exists) {
                return prev.map((c) => (c.id === updated.id ? updated : c));
              } else {
                return [updated, ...prev];
              }
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "live_comments" },
        (payload) => {
          const deletedId = (payload.old as any).id;
          if (deletedId) {
            setComments((prev) => prev.filter((c) => c.id !== deletedId));
          }
        }
      )
      .subscribe();

    // 2. Settings channel
    const settingsChannel = supabase
      .channel("stage-live-settings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_system_settings" },
        (payload) => {
          const updated = payload.new as LiveSystemSettings;
          setSettings(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [soundEnabled]);

  // Separate pinned comment from the rest of the stream
  const pinnedComment = comments.find((c) => c.is_pinned);
  const streamComments = comments.filter((c) => !c.is_pinned);

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto flex flex-col justify-between">
      {/* Top Header */}
      <StageHeader
        title={settings.event_title}
        subtitle={settings.event_subtitle}
        commentCount={comments.length}
        announcement={settings.announcement_banner}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Main Grid: QR Code on Left, Live Comments on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 items-start">
        {/* LEFT COLUMN: Large QR Code Card & Live Stats */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-6">
          <QRCodeCard customUrl={settings.qr_url} />

          {/* Comment Status Notice */}
          {!settings.allow_comments && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Comment submissions are currently paused by the organizer.</span>
            </div>
          )}

          {/* Quick tips card for the stage */}
          <div className="glass-panel rounded-2xl p-4 text-xs text-slate-400 space-y-1.5 hidden md:block">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Audience Screen Tips
            </div>
            <p>• Comments update in real time without refreshing.</p>
            <p>• Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">F11</kbd> or click the maximize icon to enter fullscreen.</p>
            <p>• The host can spotlight and moderate comments from the Admin Panel.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Comment Feed */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
          {/* Pinned Spotlight at the top if present */}
          {pinnedComment && <PinnedSpotlight pinnedComment={pinnedComment} />}

          {/* Stream Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Audience Live Stream</span>
            </div>
            <span className="text-xs text-slate-400">
              Showing {streamComments.length} {streamComments.length === 1 ? "post" : "posts"}
            </span>
          </div>

          {/* Comments List */}
          {loading ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="glass-panel rounded-2xl p-6 h-28 animate-pulse bg-slate-800/40"
                />
              ))}
            </div>
          ) : streamComments.length === 0 && !pinnedComment ? (
            <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 my-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl">
                👋
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Be the First to Post!</h3>
              <p className="text-sm sm:text-base text-slate-300 max-w-md">
                Scan the QR code on the left with your phone camera, type your name and message, and see it appear here in real time!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {streamComments.map((comment) => (
                <LiveCommentCard key={comment.id} comment={comment} isStageView={true} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 text-center">
        <span>Live Interactive Comment System • Powered by Supabase Realtime</span>
        <div className="flex items-center gap-4">
          <a href="/audience" className="hover:text-slate-300 transition-colors">Audience View</a>
          <span>•</span>
          <a href="/admin" className="hover:text-slate-300 transition-colors">Admin Panel</a>
        </div>
      </footer>
    </main>
  );
}
